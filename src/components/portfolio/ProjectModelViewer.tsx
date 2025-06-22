
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, LucideRotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// --- Constants ---
const DRACO_DECODER_PATH = '/libs/draco/gltf/';
const SCROLL_ZOOM_FACTOR_MIN = 2.0;
const SCROLL_ZOOM_FACTOR_MAX = 3.5;
const LERP_SPEED = 0.08;
const MOUSE_ROTATION_SENSITIVITY_X = 0.4;
const MOUSE_ROTATION_SENSITIVITY_Y = 0.3;
const GYRO_MAX_INPUT_DEG = 30;
const GYRO_TARGET_MODEL_MAX_ROT_RAD_X = 0.45;
const GYRO_TARGET_MODEL_MAX_ROT_RAD_Y = 0.6;
const JUMP_HEIGHT = 0.15;
const JUMP_DURATION = 300;
const TARGET_MODEL_VIEW_SIZE = 2.5;

// --- Loader Instances (created once and shared) ---
let dracoLoaderInstance: DRACOLoader | null = null;
let gltfLoaderInstance: GLTFLoader | null = null;

// This check ensures these are only created in a browser environment.
if (typeof window !== 'undefined') {
  dracoLoaderInstance = new DRACOLoader();
  dracoLoaderInstance.setDecoderPath(DRACO_DECODER_PATH);
  gltfLoaderInstance = new GLTFLoader();
  gltfLoaderInstance.setDRACOLoader(dracoLoaderInstance);
}


// --- Component Props ---
interface ProjectModelViewerProps {
  modelPath: string | undefined | null;
  onModelErrorOrMissing?: () => void;
}

const ProjectModelViewer: React.FC<ProjectModelViewerProps> = ({ modelPath, onModelErrorOrMissing }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [gyroPermissionNeeded, setGyroPermissionNeeded] = useState(false);

  // Interaction state refs
  const targetRotationRef = useRef({ x: 0, y: 0 });
  const targetCameraZRef = useRef<number>(SCROLL_ZOOM_FACTOR_MIN);
  const initialModelYAfterCenteringRef = useRef<number>(0);
  const isJumpingRef = useRef(false);
  const jumpStartTimeRef = useRef(0);
  const isGyroActiveRef = useRef(false);
  const initialGyroOffsetRef = useRef<{ beta: number | null; gamma: number | null }>({ beta: null, gamma: null });

  // Use IntersectionObserver to only render the scene when it's visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      { rootMargin: '0px' } // Only load when it's actually in the viewport
    );
    const currentMount = mountRef.current;
    if (currentMount) {
      observer.observe(currentMount);
    }
    return () => {
      if (currentMount) observer.unobserve(currentMount);
    };
  }, []);

  const handleDeviceOrientation = useCallback((event: DeviceOrientationEvent) => {
    const { beta, gamma } = event;
    if (beta === null || gamma === null) return;
    isGyroActiveRef.current = true;
    if (initialGyroOffsetRef.current.beta === null) {
      initialGyroOffsetRef.current = { beta, gamma };
    }
    const deltaBeta = beta - initialGyroOffsetRef.current.beta;
    const deltaGamma = gamma - initialGyroOffsetRef.current.gamma;
    targetRotationRef.current.x = (Math.min(Math.max(deltaBeta, -GYRO_MAX_INPUT_DEG), GYRO_MAX_INPUT_DEG) / GYRO_MAX_INPUT_DEG) * GYRO_TARGET_MODEL_MAX_ROT_RAD_X;
    targetRotationRef.current.y = (Math.min(Math.max(deltaGamma, -GYRO_MAX_INPUT_DEG), GYRO_MAX_INPUT_DEG) / GYRO_MAX_INPUT_DEG) * GYRO_TARGET_MODEL_MAX_ROT_RAD_Y;
  }, []);
  
  const requestGyroPermission = useCallback(async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          window.addEventListener('deviceorientation', handleDeviceOrientation);
          setGyroPermissionNeeded(false);
        } else {
          setGyroPermissionNeeded(false);
        }
      } catch (e) {
        setGyroPermissionNeeded(false);
      }
    }
  }, [handleDeviceOrientation]);

  // Main Three.js setup and cleanup effect
  useEffect(() => {
    const currentMount = mountRef.current;
    let resizeObserver: ResizeObserver | null = null;
    let isMounted = true;

    const cleanupScene = () => {
      isMounted = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }

      const model = modelGroupRef.current;
      if (model && sceneRef.current) {
        sceneRef.current.remove(model);
        model.traverse(child => {
          if ((child as THREE.Mesh).isMesh) {
            (child as THREE.Mesh).geometry.dispose();
            const material = (child as THREE.Mesh).material;
            if (Array.isArray(material)) {
              material.forEach(m => m.dispose());
            } else if (material) {
              material.dispose();
            }
          }
        });
        modelGroupRef.current = null;
      }
      
      const renderer = rendererRef.current;
      if (renderer) {
        // Forcefully release the WebGL context
        renderer.forceContextLoss();
        renderer.dispose();
        if (currentMount && currentMount.contains(renderer.domElement)) {
          currentMount.removeChild(renderer.domElement);
        }
        rendererRef.current = null;
      }
      
      sceneRef.current = null;
      cameraRef.current = null;
    };

    if (isIntersecting && currentMount && modelPath) {
      setIsLoading(true);
      setError(null);
      // --- Scene, camera, renderer, and lights ---
      const scene = new THREE.Scene();
      sceneRef.current = scene;
      const camera = new THREE.PerspectiveCamera(50, currentMount.clientWidth / currentMount.clientHeight, 0.1, 100);
      camera.position.z = SCROLL_ZOOM_FACTOR_MIN;
      cameraRef.current = camera;
      
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
      directionalLight.position.set(2, 5, 3);
      const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
      scene.add(ambientLight, directionalLight, hemiLight);
      
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
      rendererRef.current = renderer;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      if (currentMount.clientWidth > 0 && currentMount.clientHeight > 0) {
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
      }
      renderer.setClearAlpha(0);
      currentMount.appendChild(renderer.domElement);
      
      if (gltfLoaderInstance) {
        gltfLoaderInstance.load(modelPath,
          (gltf) => {
            if (!isMounted || !sceneRef.current) return;
            const model = gltf.scene;
            sceneRef.current.add(model);
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            model.scale.setScalar(maxDim > 0 ? TARGET_MODEL_VIEW_SIZE / maxDim : 1);
            const newBox = new THREE.Box3().setFromObject(model);
            const center = newBox.getCenter(new THREE.Vector3());
            model.position.sub(center);
            initialModelYAfterCenteringRef.current = model.position.y;
            modelGroupRef.current = model;
            setIsLoading(false);
          },
          undefined,
          (loadError) => {
            if (!isMounted) return;
            console.error(`Error loading model ${modelPath}:`, loadError);
            setError(`Failed to load model.`);
            setIsLoading(false);
            onModelErrorOrMissing?.();
          }
        );
      } else {
         setError('3D loader not available.');
         setIsLoading(false);
         onModelErrorOrMissing?.();
      }

      const animate = () => {
        if (!isMounted) return;
        animationFrameIdRef.current = requestAnimationFrame(animate);
        const model = modelGroupRef.current;
        if (rendererRef.current && cameraRef.current && sceneRef.current && model) {
          model.rotation.x += (targetRotationRef.current.x - model.rotation.x) * LERP_SPEED;
          model.rotation.y += (targetRotationRef.current.y - model.rotation.y) * LERP_SPEED;
          cameraRef.current.position.z += (targetCameraZRef.current - cameraRef.current.position.z) * LERP_SPEED;
          let finalTargetModelY = initialModelYAfterCenteringRef.current;
          if (isJumpingRef.current) {
            const elapsed = Date.now() - jumpStartTimeRef.current;
            if (elapsed < JUMP_DURATION) {
              finalTargetModelY += JUMP_HEIGHT * Math.sin((elapsed / JUMP_DURATION) * Math.PI);
            } else {
              isJumpingRef.current = false;
            }
          }
          model.position.y += (finalTargetModelY - model.position.y) * LERP_SPEED;
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      };
      animate();

      if ('DeviceOrientationEvent' in window && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        setGyroPermissionNeeded(true);
      }
      
      resizeObserver = new ResizeObserver(entries => {
        if (!isMounted || !entries || entries.length === 0 || !cameraRef.current || !rendererRef.current) return;
        const { width, height } = entries[0].contentRect;
        if (width > 0 && height > 0) {
          cameraRef.current.aspect = width / height;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(width, height);
        }
      });
      resizeObserver.observe(currentMount);
    }
    
    return cleanupScene;
  }, [isIntersecting, modelPath, onModelErrorOrMissing]);
  
  // This separate effect correctly manages the global event listeners
  useEffect(() => {
    const currentMount = mountRef.current;
    
    const handleMouseMove = (event: MouseEvent) => {
      if (isGyroActiveRef.current) return;
      targetRotationRef.current.y = (event.clientX / window.innerWidth - 0.5) * MOUSE_ROTATION_SENSITIVITY_X * 2;
      targetRotationRef.current.x = (event.clientY / window.innerHeight - 0.5) * MOUSE_ROTATION_SENSITIVITY_Y * 2;
    };
    const handleScroll = () => {
      const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      targetCameraZRef.current = SCROLL_ZOOM_FACTOR_MIN + scrollPercent * (SCROLL_ZOOM_FACTOR_MAX - SCROLL_ZOOM_FACTOR_MIN);
    };
    const handleModelClick = () => {
      if (!isJumpingRef.current) {
        isJumpingRef.current = true;
        jumpStartTimeRef.current = Date.now();
      }
    };
    
    if (isIntersecting) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('scroll', handleScroll, { passive: true });
        currentMount?.addEventListener('click', handleModelClick);
        if ('DeviceOrientationEvent' in window && typeof (DeviceOrientationEvent as any).requestPermission !== 'function') {
          window.addEventListener('deviceorientation', handleDeviceOrientation);
        }
    }

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('scroll', handleScroll);
        currentMount?.removeEventListener('click', handleModelClick);
        window.removeEventListener('deviceorientation', handleDeviceOrientation);
    }
  }, [isIntersecting, handleDeviceOrientation]);


  return (
    <div
      ref={mountRef}
      className={cn(
        "w-full h-full overflow-hidden relative",
        "flex items-center justify-center",
        error && "bg-destructive/10"
      )}
    >
      {isIntersecting && isLoading && <Skeleton className="absolute w-full h-full" />}
      {isIntersecting && error && (
        <div className="absolute flex flex-col items-center justify-center text-destructive p-2 text-center">
          <AlertTriangle className="h-10 w-10 mb-2" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}
      {isIntersecting && !isLoading && !error && gyroPermissionNeeded && (
        <Button
          onClick={requestGyroPermission}
          className="absolute z-10"
          variant="outline"
        >
          <LucideRotateCw className="mr-2 h-4 w-4" /> Enable Gyro
        </Button>
      )}
    </div>
  );
};

export default ProjectModelViewer;
