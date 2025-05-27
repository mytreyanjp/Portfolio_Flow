
'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';

interface ProjectModelViewerProps {
  model: string; // Path or URL to the GLB model
  containerRef: React.RefObject<HTMLDivElement>; 
}

const dracoLoaderInstance = new DRACOLoader();
dracoLoaderInstance.setDecoderPath('/libs/draco/gltf/'); // Ensure this path is correct for your public folder structure
dracoLoaderInstance.setDecoderConfig({ type: 'wasm' });

const gltfLoaderInstance = new GLTFLoader();
gltfLoaderInstance.setDRACOLoader(dracoLoaderInstance);

const ProjectModelViewer: React.FC<ProjectModelViewerProps> = ({ model: modelPath, containerRef }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const targetRotationRef = useRef({ x: 0, y: 0 });

  // Refs for Three.js objects that persist across renders if not re-created
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lightsRef = useRef<THREE.Light[]>([]);

  useEffect(() => {
    console.log(`ProjectModelViewer (${modelPath}): useEffect triggered.`);
    let timeoutId: NodeJS.Timeout;
    let isMounted = true; 

    // Defer execution to ensure mountRef is available
    timeoutId = setTimeout(() => {
      if (!isMounted || !mountRef.current || !containerRef.current) {
        if (isMounted) {
          console.warn(`ProjectModelViewer (${modelPath}): DEFERRED CHECK - Mount or container ref not available. mountRef: ${mountRef.current}, containerRef: ${containerRef.current}`);
          setError("Initialization failed: Mounting point not ready.");
          setIsLoading(false);
        }
        return;
      }
      console.log(`ProjectModelViewer (${modelPath}): DEFERRED CHECK - Mount and container refs available. Initializing Three.js scene.`);
      console.log(`ProjectModelViewer (${modelPath}): Mount dimensions: ${mountRef.current.clientWidth}x${mountRef.current.clientHeight}`);

      const currentMount = mountRef.current;

      // Initialize scene, camera, and renderer only if they don't exist
      if (!sceneRef.current) {
        sceneRef.current = new THREE.Scene();
      }
      // No explicit scene background color, relying on renderer alpha for transparency

      if (!cameraRef.current) {
        cameraRef.current = new THREE.PerspectiveCamera(50, currentMount.clientWidth / currentMount.clientHeight, 0.1, 100);
        cameraRef.current.position.z = 3; // Adjust camera Z position as needed
        console.log(`ProjectModelViewer (${modelPath}): Camera initialized. Aspect: ${currentMount.clientWidth / currentMount.clientHeight}`);
      } else {
        // Update camera aspect ratio if it already exists (e.g., on resize)
        if (currentMount.clientWidth > 0 && currentMount.clientHeight > 0) {
            cameraRef.current.aspect = currentMount.clientWidth / currentMount.clientHeight;
            cameraRef.current.updateProjectionMatrix();
        }
      }

      if (!rendererRef.current) {
        rendererRef.current = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // alpha: true for transparent background
        rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        rendererRef.current.setClearAlpha(0); // Ensure clear alpha is 0 for transparency
      }
      
      if (currentMount.clientWidth > 0 && currentMount.clientHeight > 0) {
        rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
      } else {
        console.warn(`ProjectModelViewer (${modelPath}): currentMount has zero dimensions during renderer setup. Using fallback 300x150.`);
        rendererRef.current.setSize(300, 150); // Fallback size
      }
      
      // Append renderer's DOM element if it's not already there
      if (!currentMount.contains(rendererRef.current.domElement)) {
        currentMount.appendChild(rendererRef.current.domElement);
      }
      console.log(`ProjectModelViewer (${modelPath}): Renderer configured with size ${currentMount.clientWidth}x${currentMount.clientHeight}`);

      // Clear previous lights
      lightsRef.current.forEach(light => sceneRef.current?.remove(light));
      lightsRef.current = [];

      // Add new lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.0); 
      sceneRef.current.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5); 
      directionalLight.position.set(3, 3, 5); // Adjusted position for better lighting
      sceneRef.current.add(directionalLight);
      
      // Purple point light
      const purplePointLight = new THREE.PointLight(0x9b59b6, 1.5, 10); // Increased intensity from 0.75 to 1.5
      purplePointLight.position.set(0, 1, 2); // Position it to affect the model
      sceneRef.current.add(purplePointLight);

      lightsRef.current = [ambientLight, directionalLight, purplePointLight];
      console.log(`ProjectModelViewer (${modelPath}): Lights added (including purple point light).`);

      // Load GLB model
      gltfLoaderInstance.load(
        modelPath,
        (gltf) => {
          if (!isMounted) return;
          console.log(`ProjectModelViewer (${modelPath}): GLTF loaded successfully.`);
          
          // Remove previous model if it exists
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
          }
          
          modelGroupRef.current = gltf.scene;
          sceneRef.current!.add(modelGroupRef.current);

          // Center and scale the model
          const box = new THREE.Box3().setFromObject(modelGroupRef.current);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          console.log(`ProjectModelViewer (${modelPath}): Loaded model raw BBox size: X=${size.x.toFixed(2)}, Y=${size.y.toFixed(2)}, Z=${size.z.toFixed(2)}. MaxDim: ${maxDim.toFixed(2)}`);

          let scaleFactor = 1.0;
          const targetViewSize = 1.8; // Desired apparent size in the view
          if (maxDim > 0.001) { // Avoid division by zero or tiny numbers
            scaleFactor = targetViewSize / maxDim;
          } else {
            console.warn(`ProjectModelViewer (${modelPath}): Model has very small or zero max dimension. Using default scale factor.`);
            scaleFactor = 1.0; // Or some other sensible default if maxDim is problematic
          }
          modelGroupRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);
          console.log(`ProjectModelViewer (${modelPath}): Applied scaleFactor: ${scaleFactor.toFixed(2)}`);
          
          // Re-calculate box after scaling to get center
          const scaledBox = new THREE.Box3().setFromObject(modelGroupRef.current);
          const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
          modelGroupRef.current.position.sub(scaledCenter); // Center the model at world origin
          console.log(`ProjectModelViewer (${modelPath}): Model positioned at world origin.`);
          
          // No initial Y-axis rotation
          // modelGroupRef.current.rotation.y = Math.PI / 4; 
          
          cameraRef.current!.lookAt(0, 0, 0); // Ensure camera looks at the centered model

          setIsLoading(false);
          console.log(`ProjectModelViewer (${modelPath}): Model ready and centered.`);
        },
        (xhr) => {
          console.log(`ProjectModelViewer (${modelPath}): Model loading progress: ${(xhr.loaded / xhr.total * 100).toFixed(2)}% loaded`);
        },
        (loadError) => {
          if (!isMounted) return;
          console.error(`ProjectModelViewer (${modelPath}): Error loading model:`, loadError);
          setError(`Failed to load model. ${loadError.message || 'Unknown error'}`);
          setIsLoading(false);
        }
      );
      
      // Global mouse move listener
      const handleMouseMove = (event: MouseEvent) => {
        if (!isMounted || !modelGroupRef.current) return;
        
        // Normalize mouse position to -1 to +1 range for X and Y
        const x = (event.clientX / window.innerWidth) * 2 - 1;
        const y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Adjust sensitivity as needed
        const sensitivity = 0.15; 
        targetRotationRef.current.x = y * sensitivity;
        targetRotationRef.current.y = x * sensitivity;
      };

      window.addEventListener('mousemove', handleMouseMove);
      console.log(`ProjectModelViewer (${modelPath}): Global mousemove listener added.`);

      // Animation loop
      const animate = () => {
        if (!isMounted) return;
        animationFrameIdRef.current = requestAnimationFrame(animate);
        if (modelGroupRef.current && rendererRef.current && sceneRef.current && cameraRef.current) {
          // Smoothly interpolate rotation towards target
          const targetX = targetRotationRef.current.x;
          const targetY = targetRotationRef.current.y;

          // Apply mouse-driven rotation
          modelGroupRef.current.rotation.x += (targetX - modelGroupRef.current.rotation.x) * 0.05;
          modelGroupRef.current.rotation.y += (targetY - modelGroupRef.current.rotation.y) * 0.05;
          
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      };
      // Start animation loop only if not already running
      if (animationFrameIdRef.current === null) {
        animate();
        console.log(`ProjectModelViewer (${modelPath}): Animation loop started.`);
      }

      // Resize handler
      const handleResize = () => {
        if (!isMounted || !currentMount || !rendererRef.current || !cameraRef.current || currentMount.clientWidth === 0 || currentMount.clientHeight === 0) {
          console.warn(`ProjectModelViewer (${modelPath}): Resize skipped, mount/renderer/camera not ready or zero dimensions.`);
          return;
        }
        cameraRef.current.aspect = currentMount.clientWidth / currentMount.clientHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
        console.log(`ProjectModelViewer (${modelPath}): Resized to ${currentMount.clientWidth}x${currentMount.clientHeight}`);
      };
      window.addEventListener('resize', handleResize);
      
      // Initial resize call after a short delay to ensure dimensions are stable
      const initialResizeTimeoutId = setTimeout(() => {
        if (isMounted && currentMount && currentMount.clientWidth > 0 && currentMount.clientHeight > 0) {
            handleResize();
            console.log(`ProjectModelViewer (${modelPath}): Initial resize executed after timeout.`);
        } else if (isMounted) {
            console.warn(`ProjectModelViewer (${modelPath}): Initial resize skipped after timeout - mount still has zero dimensions.`);
        }
      }, 100); // Small delay for DOM to settle

      return () => {
        isMounted = false;
        console.log(`ProjectModelViewer (${modelPath}): setTimeout callback cleanup starting.`);
        clearTimeout(initialResizeTimeoutId);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mousemove', handleMouseMove); // Ensure global listener is removed
        console.log(`ProjectModelViewer (${modelPath}): Global mousemove listener removed.`);
      };
    }, 0); // setTimeout delay of 0 ms

    // Main useEffect cleanup
    return () => {
      isMounted = false;
      console.log(`ProjectModelViewer (${modelPath}): Main useEffect cleanup starting.`);
      clearTimeout(timeoutId); // Clear the setTimeout
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null; // Reset ref
      }
      
      // Dispose of model and its materials
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
        modelGroupRef.current = null; // Clear ref
      }

      // Dispose of lights
      lightsRef.current.forEach(light => {
        sceneRef.current?.remove(light);
        (light as any).dispose?.(); // Some lights might not have dispose
      });
      lightsRef.current = []; // Clear ref
      
      // Dispose of renderer, scene, camera - these are now instance-specific
      if (mountRef.current && rendererRef.current?.domElement) {
         try {
            // Check if the child is still there before removing
            if (mountRef.current.contains(rendererRef.current.domElement)) {
                mountRef.current.removeChild(rendererRef.current.domElement);
            }
        } catch (e) {
            console.warn(`ProjectModelViewer (${modelPath}): Error removing renderer DOM element during cleanup:`, e);
        }
      }
      rendererRef.current?.dispose();
      rendererRef.current = null; // Clear ref
      
      sceneRef.current = null; // Clear scene ref
      cameraRef.current = null; // Clear camera ref
      console.log(`ProjectModelViewer (${modelPath}): Main useEffect cleanup complete.`);
    };
  }, [modelPath, containerRef]); // Key dependencies for re-running the effect

  return (
    <div ref={mountRef} className="w-full h-full overflow-hidden relative">
      {/* Loading and error states are overlays */}
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
      {/* The canvas will be injected here by Three.js */}
    </div>
  );
};

export default ProjectModelViewer;

