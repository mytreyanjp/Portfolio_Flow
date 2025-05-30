
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
  containerRef: React.RefObject<HTMLDivElement>;
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

  console.log(`ProjectModelViewer: Component function called. modelPath prop:`, modelPath, `Type: ${typeof modelPath}`);


  useEffect(() => {
    const effectModelPath = modelPath; // Capture the modelPath for this specific effect run
    console.log(`ProjectModelViewer (${effectModelPath ?? 'undefined prop value'}): useEffect triggered.`);

    // Guard at the VERY START of the effect
    if (!effectModelPath || typeof effectModelPath !== 'string' || effectModelPath.trim() === '') {
      const pathInfo = effectModelPath === undefined ? 'undefined' 
                     : (typeof effectModelPath === 'string' ? `"${effectModelPath}" (length: ${effectModelPath.length}, trimmed length: ${effectModelPath.trim().length})` 
                     : `type: ${typeof effectModelPath}`);
      console.error(`ProjectModelViewer [EFFECT_START_GUARD_FAIL]: Invalid or empty modelPath (${pathInfo}). Aborting effect setup.`);
      setError(`Invalid model path provided at effect start.`);
      setIsLoading(false);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      return; // Abort this effect run
    }

    // If we reach here, effectModelPath was valid when this effect started.
    setError(null); // Reset error from previous invalid runs, if any
    setIsLoading(true); // Set loading state for the current valid modelPath

    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    timeoutId = setTimeout(() => {
      if (!isMounted) {
        console.log(`ProjectModelViewer (${effectModelPath}): setTimeout callback skipped, component unmounted.`);
        return;
      }
      if (!mountRef.current || !containerRef.current) {
        console.warn(`ProjectModelViewer (${effectModelPath}): setTimeout callback - Mount or container ref not available. mountRef: ${mountRef.current}, containerRef: ${containerRef.current}`);
        setError("Initialization failed: Mounting point not ready in setTimeout.");
        setIsLoading(false);
        return;
      }
      console.log(`ProjectModelViewer (${effectModelPath}): setTimeout callback. Mount and container refs available.`);
      console.log(`ProjectModelViewer (${effectModelPath}): Current mount dimensions: ${mountRef.current.clientWidth}x${mountRef.current.clientHeight}`);

      // Guard INSIDE setTimeout, using the captured effectModelPath
      if (!effectModelPath || typeof effectModelPath !== 'string' || effectModelPath.trim() === '') {
        console.error(`ProjectModelViewer [setTimeout_GUARD_FAIL]: modelPath is currently: `, effectModelPath);
        console.error(`ProjectModelViewer [setTimeout_GUARD_FAIL]: typeof modelPath: ${typeof effectModelPath}`);
        if (typeof effectModelPath === 'string') {
            console.error(`ProjectModelViewer [setTimeout_GUARD_FAIL]: modelPath.trim() === '': ${effectModelPath.trim() === ''}`);
        }
        setError(`Invalid model path provided (checked in setTimeout).`);
        setIsLoading(false);
        return;
      }

      const currentMount = mountRef.current;

      if (!sceneRef.current) sceneRef.current = new THREE.Scene();
      // sceneRef.current.background = new THREE.Color(0xeeeeee); // Light gray for debugging visibility

      if (!cameraRef.current) {
        cameraRef.current = new THREE.PerspectiveCamera(50, currentMount.clientWidth > 0 ? currentMount.clientWidth / currentMount.clientHeight : 1, 0.1, 100);
        cameraRef.current.position.z = 2.5;
        console.log(`ProjectModelViewer (${effectModelPath}): Camera initialized. Aspect: ${cameraRef.current.aspect}`);
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
        console.log(`ProjectModelViewer (${effectModelPath}): Renderer instance created.`);
      }

      if (currentMount.clientWidth > 0 && currentMount.clientHeight > 0) {
        rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
      } else {
        console.warn(`ProjectModelViewer (${effectModelPath}): currentMount has zero dimensions during renderer setup. Using fallback 300x150.`);
        rendererRef.current.setSize(300, 150);
      }
      
      if (currentMount.contains(rendererRef.current.domElement)) {
        currentMount.removeChild(rendererRef.current.domElement); // Clean up before appending, if it was already there
      }
      currentMount.appendChild(rendererRef.current.domElement);
      console.log(`ProjectModelViewer (${effectModelPath}): Renderer configured and appended. Size: ${currentMount.clientWidth}x${currentMount.clientHeight}`);
      
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
      console.log(`ProjectModelViewer (${effectModelPath}): Lights added.`);

      if (modelGroupRef.current && sceneRef.current) {
        sceneRef.current.remove(modelGroupRef.current);
        modelGroupRef.current.traverse(child => {
          if ((child as THREE.Mesh).isMesh) {
            (child as THREE.Mesh).geometry?.dispose();
            const material = (child as THREE.Mesh).material;
            if (Array.isArray(material)) {
              material.forEach(m => m?.dispose());
            } else if (material) {
              material?.dispose();
            }
          }
        });
        modelGroupRef.current = null;
        console.log(`ProjectModelViewer (${effectModelPath}): Previous model cleaned up.`);
      }
      
      console.log(`ProjectModelViewer (${effectModelPath}): Attempting to load GLB model...`);
      gltfLoaderInstance.load(
        effectModelPath,
        (gltf) => {
          if (!isMounted) return;
          console.log(`ProjectModelViewer (${effectModelPath}): GLTF loaded successfully.`);
          modelGroupRef.current = gltf.scene;
          sceneRef.current!.add(modelGroupRef.current);

          const box = new THREE.Box3().setFromObject(modelGroupRef.current);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          console.log(`ProjectModelViewer (${effectModelPath}): Loaded model raw BBox size: X=${size.x.toFixed(2)}, Y=${size.y.toFixed(2)}, Z=${size.z.toFixed(2)}. MaxDim: ${maxDim.toFixed(2)}`);
          
          let scaleFactor = 1.0;
          const targetViewSize = 1.8;
          if (maxDim > 0.001) {
            scaleFactor = targetViewSize / maxDim;
          } else {
            console.warn(`ProjectModelViewer (${effectModelPath}): Model has very small or zero max dimension. Using default scale factor.`);
            scaleFactor = 1.0;
          }
          modelGroupRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);
          console.log(`ProjectModelViewer (${effectModelPath}): Applied scaleFactor: ${scaleFactor.toFixed(2)}`);

          const scaledBox = new THREE.Box3().setFromObject(modelGroupRef.current);
          const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
          modelGroupRef.current.position.sub(scaledCenter);
          // modelGroupRef.current.rotation.y = Math.PI / 4; // Y-axis rotation
          console.log(`ProjectModelViewer (${effectModelPath}): Model centered and scaled.`);
          
          cameraRef.current!.lookAt(0, 0, 0);
          setIsLoading(false);
          console.log(`ProjectModelViewer (${effectModelPath}): Model ready.`);
        },
        undefined,
        (loadError) => {
          if (!isMounted) return;
          console.error(`ProjectModelViewer (${effectModelPath}): Error loading model:`, loadError);
          setError(`Failed to load model. ${loadError.message || 'Unknown error'}`);
          setIsLoading(false);
        }
      );

      const handleMouseMove = (event: MouseEvent) => {
        if (!isMounted || !modelGroupRef.current) return;
        const x = (event.clientX / window.innerWidth) * 2 - 1;
        const y = -(event.clientY / window.innerHeight) * 2 + 1;
        const sensitivity = 0.1;
        targetRotationRef.current.x = y * sensitivity;
        targetRotationRef.current.y = x * sensitivity;
      };
      window.addEventListener('mousemove', handleMouseMove);
      console.log(`ProjectModelViewer (${effectModelPath}): Global mousemove listener added.`);

      const animate = () => {
        if (!isMounted) return;
        animationFrameIdRef.current = requestAnimationFrame(animate);
        if (modelGroupRef.current && rendererRef.current && sceneRef.current && cameraRef.current) {
          modelGroupRef.current.rotation.x += (targetRotationRef.current.x - modelGroupRef.current.rotation.x) * 0.05;
          modelGroupRef.current.rotation.y += (targetRotationRef.current.y - modelGroupRef.current.rotation.y) * 0.05;
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      };
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current); // Cancel previous loop if any
      animate();
      console.log(`ProjectModelViewer (${effectModelPath}): Animation loop started.`);

      const handleResize = () => {
        if (!isMounted || !currentMount || !rendererRef.current || !cameraRef.current || currentMount.clientWidth === 0 || currentMount.clientHeight === 0) {
          console.warn(`ProjectModelViewer (${effectModelPath}): Resize skipped, mount/renderer/camera not ready or zero dimensions.`);
          return;
        }
        cameraRef.current.aspect = currentMount.clientWidth / currentMount.clientHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
        console.log(`ProjectModelViewer (${effectModelPath}): Resized to ${currentMount.clientWidth}x${currentMount.clientHeight}`);
      };
      window.addEventListener('resize', handleResize);
      
      const initialResizeTimeoutId = setTimeout(() => {
        if (isMounted && currentMount && currentMount.clientWidth > 0 && currentMount.clientHeight > 0) {
            handleResize();
        }
      }, 100);
      
      return () => { // Cleanup for this specific setTimeout call, not for the whole effect
        clearTimeout(initialResizeTimeoutId);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mousemove', handleMouseMove);
        console.log(`ProjectModelViewer (${effectModelPath}): Listeners (resize, mousemove) from setTimeout removed.`);
      };

    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      console.log(`ProjectModelViewer (${effectModelPath}): useEffect cleanup function running.`);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      
      if (modelGroupRef.current && sceneRef.current) {
        sceneRef.current.remove(modelGroupRef.current);
        modelGroupRef.current.traverse(child => {
          if ((child as THREE.Mesh).isMesh) {
            (child as THREE.Mesh).geometry?.dispose();
            const material = (child as THREE.Mesh).material;
            if (Array.isArray(material)) {
              material.forEach(m => m?.dispose());
            } else if (material) {
              material?.dispose();
            }
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
            // console.warn(`ProjectModelViewer (${effectModelPath}): Error removing renderer DOM element:`, e);
        }
      }
      rendererRef.current?.dispose();
      rendererRef.current = null;
      
      // sceneRef.current = null; // Keep scene and camera refs if component might re-render with new modelPath
      // cameraRef.current = null;
      console.log(`ProjectModelViewer (${effectModelPath}): Full cleanup complete.`);
    };
  }, [modelPath, containerRef]);

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

    

    