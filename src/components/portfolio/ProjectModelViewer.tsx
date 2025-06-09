
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as _THREE from 'three';
import { GLTFLoader as _GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader as _DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const THREE = _THREE;
const GLTFLoader = _GLTFLoader;
const DRACOLoader = _DRACOLoader;


interface ProjectModelViewerProps {
  modelPath: string | undefined | null;
  containerRef: React.RefObject<HTMLDivElement>;
  onModelErrorOrMissing?: () => void;
}

const dracoLoaderInstance = new DRACOLoader();
dracoLoaderInstance.setDecoderPath('/libs/draco/gltf/');
dracoLoaderInstance.setDecoderConfig({ type: 'wasm' });

const gltfLoaderInstance = new GLTFLoader();
gltfLoaderInstance.setDRACOLoader(dracoLoaderInstance);

const FIXED_CAMERA_Z = 1.8; // Fixed camera Z position
const LERP_SPEED_ROTATION = 0.08;
const LERP_SPEED_MODEL_Y = 0.05;
const DRAG_ROTATION_SENSITIVITY = 0.007;

const GYRO_MAX_INPUT_DEG = 30;
const GYRO_TARGET_MODEL_MAX_ROT_RAD_X = 0.45;
const GYRO_TARGET_MODEL_MAX_ROT_RAD_Y = 0.6;

const JUMP_HEIGHT = 0.15;
const JUMP_DURATION = 300;


const ProjectModelViewer: React.FC<ProjectModelViewerProps> = ({ modelPath, containerRef, onModelErrorOrMissing }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const modelGroupRef = useRef<THREE.Group | null>(null);
  const targetRotationRef = useRef({ x: 0, y: 0 });
  
  const initialModelYAfterCenteringRef = useRef<number>(0);

  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lightsRef = useRef<THREE.Light[]>([]);
  const isIntersectingRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const [isGyroActive, setIsGyroActive] = useState(false);
  const initialGyroOffsetRef = useRef<{ beta: number | null; gamma: number | null }>({ beta: null, gamma: null });

  const isJumpingRef = useRef(false);
  const jumpStartTimeRef = useRef(0);

  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef<{ x: number; y: number } | null>(null);
  const didDragRef = useRef(false); // To distinguish click from drag end


  const handleModelClick = useCallback(() => {
    // Only jump if it wasn't a drag operation that just ended
    if (!isJumpingRef.current && modelGroupRef.current && !didDragRef.current) {
        isJumpingRef.current = true;
        jumpStartTimeRef.current = Date.now();
    }
    // Reset didDragRef after click check
    didDragRef.current = false;
  }, []);


  useEffect(() => {
    const effectModelPath = modelPath;
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    if (!effectModelPath || typeof effectModelPath !== 'string' || effectModelPath.trim() === '') {
      setError("No valid model path provided.");
      setIsLoading(false);
      onModelErrorOrMissing?.();
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      return;
    }

    setError(null);
    setIsLoading(true);

    initialGyroOffsetRef.current = { beta: null, gamma: null };
    isJumpingRef.current = false;
    isDraggingRef.current = false;
    previousMousePositionRef.current = null;
    targetRotationRef.current = {x: 0, y: 0}; 
    initialModelYAfterCenteringRef.current = 0;


    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      if (!isMounted || !modelGroupRef.current || event.beta === null || event.gamma === null) {
          return;
      }

      if (!isGyroActive) {
          setIsGyroActive(true);
          console.log("ProjectModelViewer: Gyroscope control activated.");
      }

      const { beta, gamma } = event;

      if (initialGyroOffsetRef.current.beta === null) {
          initialGyroOffsetRef.current.beta = beta;
          initialGyroOffsetRef.current.gamma = gamma;
          if (modelGroupRef.current) {
            targetRotationRef.current.x = modelGroupRef.current.rotation.x;
            targetRotationRef.current.y = modelGroupRef.current.rotation.y;
          }
          console.log("ProjectModelViewer: Gyroscope calibrated with initial offset.", initialGyroOffsetRef.current);
          return;
      }

      let relativeBeta = beta - (initialGyroOffsetRef.current.beta || 0);
      let relativeGamma = gamma - (initialGyroOffsetRef.current.gamma || 0);

      let normBeta = THREE.MathUtils.clamp(relativeBeta / GYRO_MAX_INPUT_DEG, -1, 1);
      let normGamma = THREE.MathUtils.clamp(relativeGamma / GYRO_MAX_INPUT_DEG, -1, 1);

      targetRotationRef.current.x = normBeta * GYRO_TARGET_MODEL_MAX_ROT_RAD_X;
      targetRotationRef.current.y = -normGamma * GYRO_TARGET_MODEL_MAX_ROT_RAD_Y;
    };

    let deviceOrientationListenerAttached = false;
    if (typeof window.DeviceOrientationEvent !== 'undefined') {
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            window.addEventListener('deviceorientation', handleDeviceOrientation);
            deviceOrientationListenerAttached = true;
        } else {
            window.addEventListener('deviceorientation', handleDeviceOrientation);
            deviceOrientationListenerAttached = true;
        }
    }

    const currentMountForListeners = mountRef.current;

    const onPointerDown = (event: PointerEvent) => {
      if (!isMounted || isGyroActive || !currentMountForListeners) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      isDraggingRef.current = true;
      didDragRef.current = false; // Reset drag flag
      previousMousePositionRef.current = { x: event.clientX, y: event.clientY };
      currentMountForListeners.setPointerCapture(event.pointerId);
      currentMountForListeners.style.cursor = 'grabbing';
      
      currentMountForListeners.addEventListener('pointermove', onPointerMove);
      currentMountForListeners.addEventListener('pointerup', onPointerUp);
      currentMountForListeners.addEventListener('pointercancel', onPointerUp);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!isMounted || !isDraggingRef.current || isGyroActive || !previousMousePositionRef.current) return;

      const deltaX = event.clientX - previousMousePositionRef.current.x;
      const deltaY = event.clientY - previousMousePositionRef.current.y;

      if (Math.abs(deltaX) > 0 || Math.abs(deltaY) > 0) {
        didDragRef.current = true; // It's a drag if there's movement
      }

      targetRotationRef.current.y += deltaX * DRAG_ROTATION_SENSITIVITY;
      targetRotationRef.current.x += deltaY * DRAG_ROTATION_SENSITIVITY;

      previousMousePositionRef.current = { x: event.clientX, y: event.clientY };
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!isMounted || !currentMountForListeners) return;
      
      isDraggingRef.current = false;
      currentMountForListeners.style.cursor = isGyroActive ? '' : 'grab';
      currentMountForListeners.releasePointerCapture(event.pointerId);
      
      currentMountForListeners.removeEventListener('pointermove', onPointerMove);
      currentMountForListeners.removeEventListener('pointerup', onPointerUp);
      currentMountForListeners.removeEventListener('pointercancel', onPointerUp);
      
      // didDragRef will be checked by handleModelClick
    };

    if (currentMountForListeners) {
        currentMountForListeners.style.cursor = isGyroActive ? '' : 'grab';
        currentMountForListeners.addEventListener('pointerdown', onPointerDown);
        currentMountForListeners.addEventListener('click', handleModelClick);
    }


    if (containerRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          isIntersectingRef.current = entry.isIntersecting;
          if(!entry.isIntersecting) {
            if (isGyroActive) {
              console.log("ProjectModelViewer: Element not intersecting, deactivating gyro and resetting calibration.");
              initialGyroOffsetRef.current = { beta: null, gamma: null };
              setIsGyroActive(false);
               if (mountRef.current) mountRef.current.style.cursor = 'grab';
            }
          } else {
             if (mountRef.current && isGyroActive) mountRef.current.style.cursor = '';
             else if (mountRef.current && !isGyroActive) mountRef.current.style.cursor = 'grab';
          }
        },
        { threshold: 0.01 }
      );
      observer.observe(containerRef.current);
      observerRef.current = observer;
    }

    timeoutId = setTimeout(() => {
      if (!isMounted || !mountRef.current) {
        setError("Initialization failed: Mounting point not ready.");
        setIsLoading(false);
        onModelErrorOrMissing?.();
        return;
      }
      const currentMount = mountRef.current;

      if (!sceneRef.current) sceneRef.current = new THREE.Scene();
      if (!cameraRef.current) {
        cameraRef.current = new THREE.PerspectiveCamera(50, currentMount.clientWidth > 0 ? currentMount.clientWidth / currentMount.clientHeight : 1, 0.1, 100);
        cameraRef.current.position.z = FIXED_CAMERA_Z;
      } else {
        if (currentMount.clientWidth > 0 && currentMount.clientHeight > 0) {
          cameraRef.current.aspect = currentMount.clientWidth / currentMount.clientHeight;
          cameraRef.current.updateProjectionMatrix();
        }
        cameraRef.current.position.z = FIXED_CAMERA_Z; 
      }

      if (!rendererRef.current) {
        rendererRef.current = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        rendererRef.current.setClearAlpha(0);
      }

      if (currentMount.clientWidth > 0 && currentMount.clientHeight > 0) {
        rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
      } else {
        rendererRef.current.setSize(300, 150);
      }

      if (currentMount.contains(rendererRef.current.domElement)) {
        currentMount.removeChild(rendererRef.current.domElement);
      }
      currentMount.appendChild(rendererRef.current.domElement);

      lightsRef.current.forEach(light => sceneRef.current?.remove(light));
      lightsRef.current = [];

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      sceneRef.current.add(ambientLight);
      const mainDirectionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
      mainDirectionalLight.position.set(2, 2, 3);
      sceneRef.current.add(mainDirectionalLight);
      const purpleDirectionalLight = new THREE.DirectionalLight(0x9B59B6, 1.0);
      purpleDirectionalLight.position.set(-2, 1, 1);
      sceneRef.current.add(purpleDirectionalLight);
      const purplePointLight = new THREE.PointLight(0x9575CD, 0.5, 10);
      purplePointLight.position.set(0, 1, 2);
      sceneRef.current.add(purplePointLight);
      lightsRef.current = [ambientLight, mainDirectionalLight, purpleDirectionalLight, purplePointLight];

      if (modelGroupRef.current && sceneRef.current) {
        sceneRef.current.remove(modelGroupRef.current);
        modelGroupRef.current.traverse(child => {
          if ((child as THREE.Mesh).isMesh) {
            (child as THREE.Mesh).geometry?.dispose();
            const material = (child as THREE.Mesh).material;
            if (Array.isArray(material)) material.forEach(m => m?.dispose());
            else if (material) material?.dispose();
          }
        });
        modelGroupRef.current = null;
      }

      gltfLoaderInstance.load(
        effectModelPath,
        (gltf) => {
          if (!isMounted) return;
          modelGroupRef.current = gltf.scene;
          sceneRef.current!.add(modelGroupRef.current);

          const box = new THREE.Box3().setFromObject(modelGroupRef.current);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          let scaleFactor = 1.0;
          const targetViewSize = 1.8;
          if (maxDim > 0.001) scaleFactor = targetViewSize / maxDim;
          modelGroupRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);
          const scaledBox = new THREE.Box3().setFromObject(modelGroupRef.current);
          const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
          modelGroupRef.current.position.sub(scaledCenter);
          initialModelYAfterCenteringRef.current = modelGroupRef.current.position.y;

          if (cameraRef.current) cameraRef.current.lookAt(0, 0, 0);
          setIsLoading(false);
        },
        undefined,
        (loadError) => {
          if (!isMounted) return;
          setError(`Failed to load model. ${loadError.message || 'Unknown error'}`);
          setIsLoading(false);
          onModelErrorOrMissing?.();
        }
      );

      const animate = () => {
        if (!isMounted) return;
        animationFrameIdRef.current = requestAnimationFrame(animate);
        if (modelGroupRef.current && rendererRef.current && sceneRef.current && cameraRef.current) {
          modelGroupRef.current.rotation.x += (targetRotationRef.current.x - modelGroupRef.current.rotation.x) * LERP_SPEED_ROTATION;
          modelGroupRef.current.rotation.y += (targetRotationRef.current.y - modelGroupRef.current.rotation.y) * LERP_SPEED_ROTATION;

          cameraRef.current.position.z = FIXED_CAMERA_Z;

          let finalTargetModelY = initialModelYAfterCenteringRef.current;
          if (isJumpingRef.current) {
            const elapsedJumpTime = Date.now() - jumpStartTimeRef.current;
            if (elapsedJumpTime < JUMP_DURATION) {
              const progress = elapsedJumpTime / JUMP_DURATION;
              const jumpOffset = JUMP_HEIGHT * Math.sin(progress * Math.PI);
              finalTargetModelY += jumpOffset;
            } else {
              isJumpingRef.current = false;
            }
          }
          modelGroupRef.current.position.y += (finalTargetModelY - modelGroupRef.current.position.y) * LERP_SPEED_MODEL_Y;

          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      };
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      animate();

      const handleResize = () => {
        if (!isMounted || !currentMount || !rendererRef.current || !cameraRef.current || currentMount.clientWidth === 0 || currentMount.clientHeight === 0) {
          return;
        }
        cameraRef.current.aspect = currentMount.clientWidth / currentMount.clientHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
      };
      window.addEventListener('resize', handleResize);
      const initialResizeTimeoutId = setTimeout(() => { if (isMounted && currentMount && currentMount.clientWidth > 0 && currentMount.clientHeight > 0) handleResize(); }, 100);
      return () => { clearTimeout(initialResizeTimeoutId); window.removeEventListener('resize', handleResize); };
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);

      if (currentMountForListeners) {
        currentMountForListeners.style.cursor = '';
        currentMountForListeners.removeEventListener('pointerdown', onPointerDown);
        currentMountForListeners.removeEventListener('click', handleModelClick);
        currentMountForListeners.removeEventListener('pointermove', onPointerMove);
        currentMountForListeners.removeEventListener('pointerup', onPointerUp);
        currentMountForListeners.removeEventListener('pointercancel', onPointerUp);
      }
      if (deviceOrientationListenerAttached) window.removeEventListener('deviceorientation', handleDeviceOrientation);
      initialGyroOffsetRef.current = { beta: null, gamma: null };
      setIsGyroActive(false); // Ensure gyro is deactivated on cleanup
      if (observerRef.current) observerRef.current.disconnect();
      if (modelGroupRef.current && sceneRef.current) {
        sceneRef.current.remove(modelGroupRef.current);
        modelGroupRef.current.traverse(child => {
          if ((child as THREE.Mesh).isMesh) {
            (child as THREE.Mesh).geometry?.dispose();
            const material = (child as THREE.Mesh).material;
            if (Array.isArray(material)) material.forEach(m => m?.dispose());
            else if (material) material?.dispose();
          }
        });
        modelGroupRef.current = null;
      }
      lightsRef.current.forEach(light => { sceneRef.current?.remove(light); (light as any).dispose?.(); });
      lightsRef.current = [];
      if (mountRef.current && rendererRef.current?.domElement) {
         try { if (mountRef.current.contains(rendererRef.current.domElement)) mountRef.current.removeChild(rendererRef.current.domElement); } catch (e) {}
      }
      rendererRef.current?.dispose();
    };
  // Main dependencies that should trigger re-initialization.
  }, [modelPath, containerRef, onModelErrorOrMissing, handleModelClick]); 
  
  // Effect to update cursor based on isGyroActive, separate from main setup
  useEffect(() => {
    if (mountRef.current) {
      mountRef.current.style.cursor = isGyroActive ? '' : 'grab';
    }
  }, [isGyroActive]);


  return (
    <div 
      ref={mountRef} 
      className={cn(
        "w-full h-full overflow-hidden relative"
        // Cursor style is now managed by JS depending on isGyroActive and isDragging
      )}
    >
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/10 z-10 pointer-events-none">
          <Skeleton className="w-full h-full" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/10 text-destructive p-2 text-center z-10 pointer-events-none">
          <AlertTriangle className="h-8 w-8 mb-2" />
          <p className="text-xs font-semibold">Model Error</p>
          <p className="text-xs">{error}</p>
        </div>
      )}
    </div>
  );
};

export default ProjectModelViewer;
    