
'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';

interface ProjectModelViewerProps {
  modelUrl: string;
  containerRef: React.RefObject<HTMLDivElement>; 
}

// Initialize DRACOLoader and GLTFLoader once
const dracoLoaderInstance = new DRACOLoader();
dracoLoaderInstance.setDecoderPath('/libs/draco/gltf/'); 
dracoLoaderInstance.setDecoderConfig({ type: 'wasm' });

const gltfLoaderInstance = new GLTFLoader();
gltfLoaderInstance.setDRACOLoader(dracoLoaderInstance);

const ProjectModelViewer: React.FC<ProjectModelViewerProps> = ({ modelUrl, containerRef }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Refs for Three.js objects to manage them across renders and cleanup
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const targetRotationRef = useRef({ x: 0, y: 0 });
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lightsRef = useRef<THREE.Light[]>([]);


  useEffect(() => {
    console.log(`ProjectModelViewer (${modelUrl}): useEffect triggered.`);
    setIsLoading(true); 
    setError(null);   

    const timeoutId = setTimeout(() => {
      if (!mountRef.current || !containerRef.current) {
        console.warn(`ProjectModelViewer (${modelUrl}): DEFERRED CHECK - Mount or container ref not available. mountRef: ${mountRef.current}, containerRef: ${containerRef.current}`);
        setError("Initialization failed: Mounting point not ready.");
        setIsLoading(false);
        return;
      }
      console.log(`ProjectModelViewer (${modelUrl}): DEFERRED CHECK - Mount and container refs available. Initializing Three.js scene.`);

      const currentMount = mountRef.current;

      sceneRef.current = new THREE.Scene();
      // sceneRef.current.background = new THREE.Color(0xeeeeee); // Set to light gray for visibility during debugging

      cameraRef.current = new THREE.PerspectiveCamera(50, currentMount.clientWidth / currentMount.clientHeight, 0.1, 100);
      cameraRef.current.position.z = 3;
      console.log(`ProjectModelViewer (${modelUrl}): Camera initialized. Aspect: ${currentMount.clientWidth / currentMount.clientHeight}`);

      rendererRef.current = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // alpha: true for transparency
      rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      rendererRef.current.setClearAlpha(0); // Ensure clear alpha is 0 for transparency
      
      if (currentMount.clientWidth > 0 && currentMount.clientHeight > 0) {
        rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
      } else {
        console.warn(`ProjectModelViewer (${modelUrl}): currentMount has zero dimensions during renderer setup. Using fallback 300x150.`);
        rendererRef.current.setSize(300, 150); // Fallback size
      }
      currentMount.appendChild(rendererRef.current.domElement);
      console.log(`ProjectModelViewer (${modelUrl}): Renderer created with size ${currentMount.clientWidth}x${currentMount.clientHeight}`);

      const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
      sceneRef.current.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
      directionalLight.position.set(3, 3, 5);
      sceneRef.current.add(directionalLight);
      const pointLight = new THREE.PointLight(0xffffff, 0.7);
      pointLight.position.set(-3, 2, 3);
      sceneRef.current.add(pointLight);
      lightsRef.current = [ambientLight, directionalLight, pointLight];
      console.log(`ProjectModelViewer (${modelUrl}): Lights added.`);

      gltfLoaderInstance.load(
        modelUrl,
        (gltf) => {
          console.log(`ProjectModelViewer (${modelUrl}): GLTF loaded successfully.`);
          if (modelGroupRef.current && sceneRef.current) { 
            sceneRef.current.remove(modelGroupRef.current);
            // Basic disposal for previous model - can be more thorough if needed
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
          }
          modelGroupRef.current = gltf.scene;
          sceneRef.current!.add(modelGroupRef.current);

          const box = new THREE.Box3().setFromObject(modelGroupRef.current);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          console.log(`ProjectModelViewer (${modelUrl}): Loaded model raw BBox size: X=${size.x.toFixed(2)}, Y=${size.y.toFixed(2)}, Z=${size.z.toFixed(2)}. MaxDim: ${maxDim.toFixed(2)}`);

          let scaleFactor = 1.0;
          const targetViewSize = 1.8; // Adjust this to control how large the model appears
          if (maxDim > 0.001) { // Avoid division by zero or very small numbers
            scaleFactor = targetViewSize / maxDim;
          } else {
            console.warn(`ProjectModelViewer (${modelUrl}): Model has very small or zero max dimension. Using default scale factor.`);
            scaleFactor = 1.0; // Fallback scale
          }
          modelGroupRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);
          console.log(`ProjectModelViewer (${modelUrl}): Applied scaleFactor: ${scaleFactor.toFixed(2)}`);
          
          // Center the model
          const scaledBox = new THREE.Box3().setFromObject(modelGroupRef.current);
          const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
          modelGroupRef.current.position.sub(scaledCenter);
          console.log(`ProjectModelViewer (${modelUrl}): Model positioned at world origin.`);

          // Apply initial Y-axis rotation
          modelGroupRef.current.rotation.y = Math.PI / 4; // 45 degrees
          console.log(`ProjectModelViewer (${modelUrl}): Applied initial Y rotation of 45 degrees.`);
          
          cameraRef.current!.lookAt(0, 0, 0);
          setIsLoading(false);
          console.log(`ProjectModelViewer (${modelUrl}): Model ready and centered.`);
        },
        (xhr) => {
          console.log(`ProjectModelViewer (${modelUrl}): Model loading progress: ${(xhr.loaded / xhr.total * 100).toFixed(2)}% loaded`);
        },
        (loadError) => {
          console.error(`ProjectModelViewer (${modelUrl}): Error loading model:`, loadError);
          setError(`Failed to load model. ${loadError.message || 'Unknown error'}`);
          setIsLoading(false);
        }
      );
      
      const parentContainer = containerRef.current;
      const handleMouseMove = (event: MouseEvent) => {
        if (!modelGroupRef.current || !parentContainer) return;
        const rect = parentContainer.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
        targetRotationRef.current.x = y * 0.25; // Reduced sensitivity
        targetRotationRef.current.y = x * 0.25; // Reduced sensitivity
      };

      const handleMouseLeave = () => {
         targetRotationRef.current.x = 0;
         targetRotationRef.current.y = 0;
      };

      if (parentContainer) {
        parentContainer.addEventListener('mousemove', handleMouseMove);
        parentContainer.addEventListener('mouseleave', handleMouseLeave);
      }

      const animate = () => {
        animationFrameIdRef.current = requestAnimationFrame(animate);
        if (modelGroupRef.current && rendererRef.current && sceneRef.current && cameraRef.current) {
          // Smoothly interpolate rotation towards target
          modelGroupRef.current.rotation.x += (targetRotationRef.current.x - modelGroupRef.current.rotation.x) * 0.05;
          modelGroupRef.current.rotation.y += (targetRotationRef.current.y - modelGroupRef.current.rotation.y) * 0.05;
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      };
      animate();
      console.log(`ProjectModelViewer (${modelUrl}): Animation loop started.`);

      const handleResize = () => {
        if (!currentMount || !rendererRef.current || !cameraRef.current || currentMount.clientWidth === 0 || currentMount.clientHeight === 0) {
          console.warn(`ProjectModelViewer (${modelUrl}): Resize skipped, mount/renderer/camera not ready or zero dimensions.`);
          return;
        }
        cameraRef.current.aspect = currentMount.clientWidth / currentMount.clientHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
        console.log(`ProjectModelViewer (${modelUrl}): Resized to ${currentMount.clientWidth}x${currentMount.clientHeight}`);
      };
      window.addEventListener('resize', handleResize);
      
      const initialResizeTimeoutId = setTimeout(() => {
        if (currentMount && currentMount.clientWidth > 0 && currentMount.clientHeight > 0) {
            handleResize();
            console.log(`ProjectModelViewer (${modelUrl}): Initial resize executed after timeout.`);
        } else {
            console.warn(`ProjectModelViewer (${modelUrl}): Initial resize skipped after timeout - mount still has zero dimensions.`);
        }
      }, 100); // Slight delay for layout to settle

      return () => {
        console.log(`ProjectModelViewer (${modelUrl}): setTimeout callback cleanup starting.`);
        clearTimeout(initialResizeTimeoutId);
        window.removeEventListener('resize', handleResize);
        if (parentContainer) {
          parentContainer.removeEventListener('mousemove', handleMouseMove);
          parentContainer.removeEventListener('mouseleave', handleMouseLeave);
        }
      };
    }, 0); 

    return () => {
      console.log(`ProjectModelViewer (${modelUrl}): Main useEffect cleanup starting.`);
      clearTimeout(timeoutId); 
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
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
        light.dispose?.(); // Some lights might not have dispose
      });
      lightsRef.current = [];
      
      if (mountRef.current && rendererRef.current?.domElement) {
         try {
            mountRef.current.removeChild(rendererRef.current.domElement);
        } catch (e) {
            console.warn(`ProjectModelViewer (${modelUrl}): Error removing renderer DOM element during cleanup:`, e);
        }
      }
      rendererRef.current?.dispose();
      rendererRef.current = null;
      sceneRef.current = null; 
      cameraRef.current = null;
      console.log(`ProjectModelViewer (${modelUrl}): Main useEffect cleanup complete.`);
    };
  }, [modelUrl, containerRef]); // Key dependencies

  return (
    <div ref={mountRef} className="w-full h-full overflow-hidden relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/10 z-10">
          <Skeleton className="w-full h-full" />
        </div>
      )}
      {error && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/10 text-destructive p-2 text-center z-10">
          <AlertTriangle className="h-8 w-8 mb-2" />
          <p className="text-xs font-semibold">Error</p>
          <p className="text-xs">{error}</p>
        </div>
      )}
      {/* The div above (with mountRef) is where Three.js canvas will be. It's always rendered. */}
    </div>
  );
};

export default ProjectModelViewer;
