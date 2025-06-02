
'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as _THREE from 'three'; // Use wildcard import
import { GLTFLoader as _GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader as _DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Re-alias to avoid conflict if THREE is globally available in some environments
const THREE = _THREE;
const GLTFLoader = _GLTFLoader;
const DRACOLoader = _DRACOLoader;


interface ProjectModelViewerProps {
  modelPath: string;
  containerRef: React.RefObject<HTMLDivElement>; // This is the ref to the parent Card element
}

const dracoLoaderInstance = new DRACOLoader();
dracoLoaderInstance.setDecoderPath('/libs/draco/gltf/');
dracoLoaderInstance.setDecoderConfig({ type: 'wasm' });

const gltfLoaderInstance = new GLTFLoader();
gltfLoaderInstance.setDRACOLoader(dracoLoaderInstance);

const ProjectModelViewer: React.FC<ProjectModelViewerProps> = ({ modelPath, containerRef }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const modelGroupRef = useRef<THREE.Group | null>(null);
  const targetRotationRef = useRef({ x: 0, y: 0 });
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lightsRef = useRef<THREE.Light[]>([]);

  useEffect(() => {
    const effectModelPath = modelPath; 
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;
    // const currentCardContainer = containerRef.current; // No longer needed for global mousemove

    if (!effectModelPath || typeof effectModelPath !== 'string' || effectModelPath.trim() === '') {
      setError(`Invalid model path provided.`);
      setIsLoading(false);
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      return;
    }
    
    setError(null);
    setIsLoading(true);

    // Define event handlers here so they can be added and removed correctly
    const handleGlobalMouseMove = (event: MouseEvent) => {
      if (!isMounted || !modelGroupRef.current || typeof window === 'undefined') return;

      const x = (event.clientX / window.innerWidth - 0.5) * 2; // Normalized -1 to 1
      const y = -(event.clientY / window.innerHeight - 0.5) * 2; // Normalized -1 to 1 (inverted Y)
      
      const sensitivity = 0.3; 
      targetRotationRef.current.x = y * sensitivity;
      targetRotationRef.current.y = x * sensitivity;
    };
    
    window.addEventListener('mousemove', handleGlobalMouseMove);


    timeoutId = setTimeout(() => {
      if (!isMounted || !mountRef.current) { // Removed currentCardContainer check here
        setError("Initialization failed: Mounting point not ready.");
        setIsLoading(false);
        return;
      }
      
      const currentMount = mountRef.current;

      if (!sceneRef.current) sceneRef.current = new THREE.Scene();
      if (!cameraRef.current) {
        cameraRef.current = new THREE.PerspectiveCamera(50, currentMount.clientWidth > 0 ? currentMount.clientWidth / currentMount.clientHeight : 1, 0.1, 100);
        cameraRef.current.position.z = 2.5;
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
        rendererRef.current.setSize(300, 150); // Fallback
      }
      
      if (currentMount.contains(rendererRef.current.domElement)) {
        currentMount.removeChild(rendererRef.current.domElement);
      }
      currentMount.appendChild(rendererRef.current.domElement);
      
      lightsRef.current.forEach(light => sceneRef.current?.remove(light));
      lightsRef.current = [];

      const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
      sceneRef.current.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
      directionalLight.position.set(2, 2, 3);
      sceneRef.current.add(directionalLight);
      const purplePointLight = new THREE.PointLight(0x9b59b6, 1.5, 10); 
      purplePointLight.position.set(0, 1, 2);
      sceneRef.current.add(purplePointLight);
      lightsRef.current = [ambientLight, directionalLight, purplePointLight];

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
          
          cameraRef.current!.lookAt(0, 0, 0);
          setIsLoading(false);
        },
        undefined,
        (loadError) => {
          if (!isMounted) return;
          setError(`Failed to load model. ${loadError.message || 'Unknown error'}`);
          setIsLoading(false);
        }
      );

      const animate = () => {
        if (!isMounted) return;
        animationFrameIdRef.current = requestAnimationFrame(animate);
        if (modelGroupRef.current && rendererRef.current && sceneRef.current && cameraRef.current) {
          // LERP factor for smooth rotation
          modelGroupRef.current.rotation.x += (targetRotationRef.current.x - modelGroupRef.current.rotation.x) * 0.08;
          modelGroupRef.current.rotation.y += (targetRotationRef.current.y - modelGroupRef.current.rotation.y) * 0.08;
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
      
      const initialResizeTimeoutId = setTimeout(() => {
        if (isMounted && currentMount && currentMount.clientWidth > 0 && currentMount.clientHeight > 0) {
            handleResize();
        }
      }, 100);
      
      // Cleanup for listeners added inside setTimeout
      return () => {
        clearTimeout(initialResizeTimeoutId);
        window.removeEventListener('resize', handleResize);
        // Card-specific listeners are no longer here
      };

    }, 0); // setTimeout ensures DOM is ready for measurements

    // Main useEffect cleanup
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      // Card-specific listeners cleanup is removed as they are no longer added.

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
      rendererRef.current = null;
    };
  }, [modelPath, containerRef]); // containerRef is still a dependency for sizing, but not for mouse events

  return (
    <div ref={mountRef} className="w-full h-full overflow-hidden relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/10 z-10 pointer-events-none">
          <Skeleton className="w-full h-full" />
        </div>
      )}
      {error && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/10 text-destructive p-2 text-center z-10 pointer-events-none">
          <AlertTriangle className="h-8 w-8 mb-2" />
          <p className="text-xs font-semibold">Error</p>
          <p className="text-xs">{error}</p>
        </div>
      )}
    </div>
  );
};

export default ProjectModelViewer;

