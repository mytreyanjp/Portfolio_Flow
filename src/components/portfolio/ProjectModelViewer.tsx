
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

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

// --- Loader Instances (created once) ---
const dracoLoaderInstance = new DRACOLoader();
dracoLoaderInstance.setDecoderPath(DRACO_DECODER_PATH);
const gltfLoaderInstance = new GLTFLoader();
gltfLoaderInstance.setDRACOLoader(dracoLoaderInstance);

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
  const interactionListenersAdded = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interaction state refs
  const targetRotationRef = useRef({ x: 0, y: 0 });
  const targetCameraZRef = useRef<number>(SCROLL_ZOOM_FACTOR_MIN);
  const initialModelYAfterCenteringRef = useRef<number>(0);
  const isJumpingRef = useRef(false);
  const jumpStartTimeRef = useRef(0);
  const isGyroActiveRef = useRef(false);
  const initialGyroOffsetRef = useRef<{ beta: number | null; gamma: number | null }>({ beta: null, gamma: null });

  const cleanupModel = useCallback(() => {
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
  }, []);

  useEffect(() => {
    let isMounted = true;
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // --- One-time setup of scene, camera, renderer, and lights ---
    if (!rendererRef.current) {
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(50, currentMount.clientWidth > 0 ? currentMount.clientWidth / currentMount.clientHeight : 1, 0.1, 100);
      camera.position.set(0, 0, SCROLL_ZOOM_FACTOR_MIN);
      cameraRef.current = camera;
      
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
      directionalLight.position.set(2, 5, 3);
      const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
      scene.add(ambientLight, directionalLight, hemiLight);
      
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
      renderer.setClearAlpha(0);
      currentMount.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      const animate = () => {
        if (!isMounted) return;
        animationFrameIdRef.current = requestAnimationFrame(animate);

        const renderer = rendererRef.current;
        const camera = cameraRef.current;
        const scene = sceneRef.current;
        const model = modelGroupRef.current;

        if (renderer && camera && scene) {
          if (mountRef.current) {
             const { clientWidth, clientHeight } = mountRef.current;
             if (renderer.domElement.width !== clientWidth || renderer.domElement.height !== clientHeight) {
                if (clientWidth > 0 && clientHeight > 0) {
                    renderer.setSize(clientWidth, clientHeight);
                    camera.aspect = clientWidth / clientHeight;
                    camera.updateProjectionMatrix();
                }
             }
          }
          if(model) {
            model.rotation.x += (targetRotationRef.current.x - model.rotation.x) * LERP_SPEED;
            model.rotation.y += (targetRotationRef.current.y - model.rotation.y) * LERP_SPEED;
            camera.position.z += (targetCameraZRef.current - camera.position.z) * LERP_SPEED;
            
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
          }
          renderer.render(scene, camera);
        }
      };
      animate();
    }
    
    // --- Add interaction listeners only once ---
    if (!interactionListenersAdded.current) {
      const handleMouseMove = (event: MouseEvent) => {
        if (isGyroActiveRef.current || !isMounted) return;
        targetRotationRef.current.y = (event.clientX / window.innerWidth - 0.5) * MOUSE_ROTATION_SENSITIVITY_X * 2;
        targetRotationRef.current.x = (event.clientY / window.innerHeight - 0.5) * MOUSE_ROTATION_SENSITIVITY_Y * 2;
      };

      const handleScroll = () => {
        if(!isMounted) return;
        const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
        targetCameraZRef.current = SCROLL_ZOOM_FACTOR_MIN + scrollPercent * (SCROLL_ZOOM_FACTOR_MAX - SCROLL_ZOOM_FACTOR_MIN);
      };

      const handleModelClick = () => {
        if (!isJumpingRef.current && isMounted) {
          isJumpingRef.current = true;
          jumpStartTimeRef.current = Date.now();
        }
      };

      const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
        if(!isMounted) return;
        const { beta, gamma } = event;
        if (beta === null || gamma === null) return;

        if (initialGyroOffsetRef.current.beta === null) {
          initialGyroOffsetRef.current = { beta, gamma };
        }
        const deltaBeta = beta - initialGyroOffsetRef.current.beta;
        const deltaGamma = gamma - initialGyroOffsetRef.current.gamma;

        targetRotationRef.current.x = (Math.min(Math.max(deltaBeta, -GYRO_MAX_INPUT_DEG), GYRO_MAX_INPUT_DEG) / GYRO_MAX_INPUT_DEG) * GYRO_TARGET_MODEL_MAX_ROT_RAD_X;
        targetRotationRef.current.y = (Math.min(Math.max(deltaGamma, -GYRO_MAX_INPUT_DEG), GYRO_MAX_INPUT_DEG) / GYRO_MAX_INPUT_DEG) * GYRO_TARGET_MODEL_MAX_ROT_RAD_Y;
      };
      
      if ('DeviceOrientationEvent' in window && typeof (DeviceOrientationEvent as any).requestPermission !== 'function') {
        window.addEventListener('deviceorientation', handleDeviceOrientation);
        isGyroActiveRef.current = true;
      }
      
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('scroll', handleScroll, { passive: true });
      currentMount.addEventListener('click', handleModelClick);
      interactionListenersAdded.current = true;
    }

    // --- Load new model when modelPath changes ---
    if (modelPath) {
      cleanupModel();
      setIsLoading(true);
      setError(null);
      
      gltfLoaderInstance.load(modelPath,
        (gltf) => {
          if (!isMounted || !sceneRef.current) return;
          const model = gltf.scene;
          sceneRef.current.add(model);
          
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scaleFactor = maxDim > 0 ? TARGET_MODEL_VIEW_SIZE / maxDim : 1;
          model.scale.setScalar(scaleFactor);
          
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
      cleanupModel();
      setIsLoading(false);
      if(onModelErrorOrMissing) onModelErrorOrMissing();
    }
    
    return () => { isMounted = false; };
  }, [modelPath, cleanupModel, onModelErrorOrMissing]);
  
  useEffect(() => {
    const currentRenderer = rendererRef.current;
    const currentMount = mountRef.current;
    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      if(currentRenderer) {
        currentRenderer.dispose();
         if (currentMount && currentMount.contains(currentRenderer.domElement)) {
            currentMount.removeChild(currentRenderer.domElement);
         }
      }
      // Note: interaction listeners are not removed as they are added once to the window
    }
  }, []);

  return (
    <div
      ref={mountRef}
      className={cn(
        "w-full h-full overflow-hidden",
        (isLoading || error) && "flex items-center justify-center",
        error && "bg-destructive/10"
      )}
    >
      {isLoading && <Skeleton className="w-full h-full" />}
      {error && (
        <div className="flex flex-col items-center justify-center text-destructive p-2 text-center">
          <AlertTriangle className="h-10 w-10 mb-2" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}
    </div>
  );
};

export default ProjectModelViewer;
