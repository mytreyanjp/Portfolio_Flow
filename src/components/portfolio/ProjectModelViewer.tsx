
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
  modelPath: string | undefined | null; // Allow undefined or null
  containerRef: React.RefObject<HTMLDivElement>;
  onModelErrorOrMissing?: () => void; // Callback for errors or missing path
}

const dracoLoaderInstance = new DRACOLoader();
dracoLoaderInstance.setDecoderPath('/libs/draco/gltf/');
dracoLoaderInstance.setDecoderConfig({ type: 'wasm' });

const gltfLoaderInstance = new GLTFLoader();
gltfLoaderInstance.setDRACOLoader(dracoLoaderInstance);

const MIN_CAMERA_Z = 1.2; 
const MAX_CAMERA_Z = 2.8; 
const MIN_MODEL_Y_OFFSET = -0.2; 
const MAX_MODEL_Y_OFFSET = 0;    
const LERP_SPEED_ROTATION = 0.08;
const LERP_SPEED_CAMERA_Z = 0.05;
const LERP_SPEED_MODEL_Y = 0.05;

const ProjectModelViewer: React.FC<ProjectModelViewerProps> = ({ modelPath, containerRef, onModelErrorOrMissing }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const modelGroupRef = useRef<THREE.Group | null>(null);
  const targetRotationRef = useRef({ x: 0, y: 0 });
  const targetCameraZRef = useRef<number>(MAX_CAMERA_Z);
  const targetModelYOffsetRef = useRef<number>(MAX_MODEL_Y_OFFSET);
  const initialModelYAfterCenteringRef = useRef<number>(0);

  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lightsRef = useRef<THREE.Light[]>([]);
  const isIntersectingRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);


  const handleScroll = useCallback(() => {
    if (!isIntersectingRef.current || !containerRef.current || typeof window === 'undefined') {
      targetCameraZRef.current = MAX_CAMERA_Z;
      targetModelYOffsetRef.current = MAX_MODEL_Y_OFFSET;
      return;
    }

    const cardRect = containerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const cardCenterY = cardRect.top + cardRect.height / 2;
    const distanceFromViewportCenter = cardCenterY - viewportHeight / 2;
    const normalizedDistance = Math.min(1, Math.abs(distanceFromViewportCenter) / (viewportHeight / 2));
    
    let newTargetZ = MIN_CAMERA_Z + normalizedDistance * (MAX_CAMERA_Z - MIN_CAMERA_Z);
    newTargetZ = Math.max(MIN_CAMERA_Z, Math.min(MAX_CAMERA_Z, newTargetZ)); 
    targetCameraZRef.current = newTargetZ;

    const zoomFactor = 1 - normalizedDistance; 
    const newTargetYOffset = MAX_MODEL_Y_OFFSET + (MIN_MODEL_Y_OFFSET - MAX_MODEL_Y_OFFSET) * zoomFactor;
    targetModelYOffsetRef.current = newTargetYOffset;

  }, [containerRef]);


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
    targetCameraZRef.current = MAX_CAMERA_Z; 
    targetModelYOffsetRef.current = MAX_MODEL_Y_OFFSET;
    initialModelYAfterCenteringRef.current = 0;

    const handleGlobalMouseMove = (event: MouseEvent) => {
      if (!isMounted || !modelGroupRef.current || typeof window === 'undefined') return;
      const x = (event.clientX / window.innerWidth - 0.5) * 2;
      const y = -(event.clientY / window.innerHeight - 0.5) * 2;
      const sensitivity = 0.3; 
      targetRotationRef.current.x = y * sensitivity;
      targetRotationRef.current.y = x * sensitivity;
    };
    
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('scroll', handleScroll, { passive: true });

    if (containerRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          isIntersectingRef.current = entry.isIntersecting;
          if(entry.isIntersecting) {
            handleScroll(); 
          } else {
            targetCameraZRef.current = MAX_CAMERA_Z; 
            targetModelYOffsetRef.current = MAX_MODEL_Y_OFFSET;
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
        cameraRef.current.position.z = MAX_CAMERA_Z; 
      } else {
        if (currentMount.clientWidth > 0 && currentMount.clientHeight > 0) {
          cameraRef.current.aspect = currentMount.clientWidth / currentMount.clientHeight;
          cameraRef.current.updateProjectionMatrix();
        }
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
          handleScroll(); 
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
          
          cameraRef.current.position.z += (targetCameraZRef.current - cameraRef.current.position.z) * LERP_SPEED_CAMERA_Z;

          const finalTargetY = initialModelYAfterCenteringRef.current + targetModelYOffsetRef.current;
          modelGroupRef.current.position.y += (finalTargetY - modelGroupRef.current.position.y) * LERP_SPEED_MODEL_Y;
          
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
        handleScroll(); 
      };
      window.addEventListener('resize', handleResize);
      
      const initialResizeTimeoutId = setTimeout(() => {
        if (isMounted && currentMount && currentMount.clientWidth > 0 && currentMount.clientHeight > 0) {
            handleResize();
        }
      }, 100);
      
      return () => {
        clearTimeout(initialResizeTimeoutId);
        window.removeEventListener('resize', handleResize);
      };

    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('scroll', handleScroll);
      
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

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

      lightsRef.current.forEach(light => {
        sceneRef.current?.remove(light);
        (light as any).dispose?.();
      });
      lightsRef.current = [];
      
      if (mountRef.current && rendererRef.current?.domElement) {
         try {
            if (mountRef.current.contains(rendererRef.current.domElement)) {
                mountRef.current.removeChild(rendererRef.current.domElement);
            }
        } catch (e) {
            // console.warn("Error removing renderer DOM element:", e);
        }
      }
      rendererRef.current?.dispose();
      // Do not nullify sceneRef, cameraRef here if they are meant to persist across modelPath changes
      // rendererRef.current = null; // This one should be nulled if re-created per model.
    };
  }, [modelPath, containerRef, handleScroll, onModelErrorOrMissing]); 

  return (
    <div ref={mountRef} className="w-full h-full overflow-hidden relative">
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/10 z-10 pointer-events-none">
          <Skeleton className="w-full h-full" />
        </div>
      )}
      {error && ( // Only show error if there's an error message
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
