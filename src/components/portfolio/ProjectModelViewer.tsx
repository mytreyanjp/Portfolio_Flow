
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
const JUMP_HEIGHT = 0.15;
const JUMP_DURATION = 300;
const TARGET_MODEL_VIEW_SIZE = 2.5;

// --- Component Props ---
interface ProjectModelViewerProps {
  modelPath: string | undefined | null;
  onModelErrorOrMissing?: () => void;
}

// Re-using loaders is a good pattern.
const gltfLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
gltfLoader.setDRACOLoader(dracoLoader);

const ProjectModelViewer: React.FC<ProjectModelViewerProps> = ({ modelPath, onModelErrorOrMissing }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Core Three.js object refs
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Interaction state refs
  const targetRotationRef = useRef({ x: 0, y: 0 });
  const targetCameraZRef = useRef<number>(SCROLL_ZOOM_FACTOR_MIN);
  const initialModelYAfterCenteringRef = useRef<number>(0);
  const isJumpingRef = useRef(false);
  const jumpStartTimeRef = useRef(0);

  // Main Three.js setup effect
  useEffect(() => {
    if (!modelPath || !mountRef.current) {
        if (modelPath === undefined || modelPath === null) {
            onModelErrorOrMissing?.();
        }
        return;
    }

    const currentMount = mountRef.current;
    let isMounted = true;

    // --- Scene, camera, renderer, and lights ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(50, currentMount.clientWidth / currentMount.clientHeight, 0.1, 100);
    cameraRef.current = camera;
    camera.position.z = SCROLL_ZOOM_FACTOR_MIN;

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
    directionalLight.position.set(2, 5, 3);
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
    scene.add(ambientLight, directionalLight, hemiLight);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setClearAlpha(0);
    currentMount.appendChild(renderer.domElement);

    // --- Model Loading ---
    gltfLoader.load(modelPath,
      (gltf) => {
        if (!isMounted) return;
        const model = gltf.scene;
        scene.add(model);

        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = maxDim > 0 ? TARGET_MODEL_VIEW_SIZE / maxDim : 1;
        model.scale.set(scale, scale, scale);
        
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
        setError('Failed to load model.');
        setIsLoading(false);
        onModelErrorOrMissing?.();
      }
    );

    // --- Animation Loop ---
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
    
    // --- Resize Observer ---
    const resizeObserver = new ResizeObserver(entries => {
      if (!isMounted || !entries || entries.length === 0 || !cameraRef.current || !rendererRef.current) return;
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(width, height);
      }
    });
    resizeObserver.observe(currentMount);
    resizeObserverRef.current = resizeObserver;

    // --- Cleanup ---
    return () => {
      isMounted = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      resizeObserverRef.current?.disconnect();
      
      if (rendererRef.current) {
         if (currentMount.contains(rendererRef.current.domElement)) {
            currentMount.removeChild(rendererRef.current.domElement);
         }
        rendererRef.current.dispose();
      }
    };
  }, [modelPath, onModelErrorOrMissing]);
  
  // Effect for managing global event listeners
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
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
    
    const currentMount = mountRef.current;
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll, { passive: true });
    currentMount?.addEventListener('click', handleModelClick);
    
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('scroll', handleScroll);
        currentMount?.removeEventListener('click', handleModelClick);
    }
  }, []); // Empty dependency array means this effect runs once and cleans up on unmount


  return (
    <div
      ref={mountRef}
      className={cn(
        "w-full h-full overflow-hidden",
        error && "flex items-center justify-center bg-destructive/10"
      )}
    >
      {isLoading && <Skeleton className="w-full h-full" />}
      {error && (
        <div className="flex flex-col items-center justify-center text-destructive p-2 text-center">
            <AlertTriangle className="h-10 w-10 mb-2"/>
            <p className="text-sm font-semibold">{error}</p>
        </div>
      )}
    </div>
  );
};

export default ProjectModelViewer;
