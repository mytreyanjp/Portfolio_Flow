
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
  
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const targetRotationRef = useRef({ x: 0, y: 0 });
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lightsRef = useRef<THREE.Light[]>([]);

  useEffect(() => {
    console.log(`ProjectModelViewer (${modelUrl}): useEffect triggered.`);
    let timeoutId: NodeJS.Timeout;
    let isMounted = true; // To prevent updates after unmount

    timeoutId = setTimeout(() => {
      if (!isMounted || !mountRef.current || !containerRef.current) {
        if (isMounted) {
          console.warn(`ProjectModelViewer (${modelUrl}): DEFERRED CHECK - Mount or container ref not available. mountRef: ${mountRef.current}, containerRef: ${containerRef.current}`);
          setError("Initialization failed: Mounting point not ready.");
          setIsLoading(false);
        }
        return;
      }
      console.log(`ProjectModelViewer (${modelUrl}): DEFERRED CHECK - Mount and container refs available. Initializing Three.js scene.`);
      console.log(`ProjectModelViewer (${modelUrl}): Mount dimensions: ${mountRef.current.clientWidth}x${mountRef.current.clientHeight}`);


      const currentMount = mountRef.current;

      sceneRef.current = new THREE.Scene();
      // sceneRef.current.background = new THREE.Color(0xdddddd); // Light gray for visibility during debugging

      cameraRef.current = new THREE.PerspectiveCamera(50, currentMount.clientWidth / currentMount.clientHeight, 0.1, 100);
      cameraRef.current.position.z = 3;
      console.log(`ProjectModelViewer (${modelUrl}): Camera initialized. Aspect: ${currentMount.clientWidth / currentMount.clientHeight}`);

      rendererRef.current = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      rendererRef.current.setClearAlpha(0); 
      
      if (currentMount.clientWidth > 0 && currentMount.clientHeight > 0) {
        rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
      } else {
        console.warn(`ProjectModelViewer (${modelUrl}): currentMount has zero dimensions during renderer setup. Using fallback 300x150.`);
        rendererRef.current.setSize(300, 150); 
      }
      currentMount.appendChild(rendererRef.current.domElement);
      console.log(`ProjectModelViewer (${modelUrl}): Renderer created with size ${currentMount.clientWidth}x${currentMount.clientHeight}`);

      lightsRef.current.forEach(light => sceneRef.current?.remove(light));
      lightsRef.current = [];

      const ambientLight = new THREE.AmbientLight(0xffffff, 1.0); 
      sceneRef.current.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5); 
      directionalLight.position.set(3, 3, 5);
      sceneRef.current.add(directionalLight);
      
      // Purple PointLight
      const purplePointLight = new THREE.PointLight(0x9b59b6, 0.75, 10); // Purple color (e.g., HSL 280, 50%, 50%), intensity, distance
      purplePointLight.position.set(0, 1, 2); // Position it slightly above and in front
      sceneRef.current.add(purplePointLight);

      lightsRef.current = [ambientLight, directionalLight, purplePointLight];
      console.log(`ProjectModelViewer (${modelUrl}): Lights added (including purple point light).`);

      gltfLoaderInstance.load(
        modelUrl,
        (gltf) => {
          if (!isMounted) return;
          console.log(`ProjectModelViewer (${modelUrl}): GLTF loaded successfully.`);
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

          const box = new THREE.Box3().setFromObject(modelGroupRef.current);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          console.log(`ProjectModelViewer (${modelUrl}): Loaded model raw BBox size: X=${size.x.toFixed(2)}, Y=${size.y.toFixed(2)}, Z=${size.z.toFixed(2)}. MaxDim: ${maxDim.toFixed(2)}`);

          let scaleFactor = 1.0;
          const targetViewSize = 1.8; 
          if (maxDim > 0.001) { 
            scaleFactor = targetViewSize / maxDim;
          } else {
            console.warn(`ProjectModelViewer (${modelUrl}): Model has very small or zero max dimension. Using default scale factor.`);
            scaleFactor = 1.0; 
          }
          modelGroupRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);
          console.log(`ProjectModelViewer (${modelUrl}): Applied scaleFactor: ${scaleFactor.toFixed(2)}`);
          
          const scaledBox = new THREE.Box3().setFromObject(modelGroupRef.current);
          const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
          modelGroupRef.current.position.sub(scaledCenter);
          console.log(`ProjectModelViewer (${modelUrl}): Model positioned at world origin.`);
          
          // DEBUGGING MATERIAL OVERRIDE - Uncomment to test with basic wireframe
          // modelGroupRef.current.traverse((child) => {
          //   if ((child as THREE.Mesh).isMesh) {
          //     (child as THREE.Mesh).material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
          //   }
          // });
          // console.log(`ProjectModelViewer (${modelUrl}): Applied DEBUG wireframe material.`);
          
          cameraRef.current!.lookAt(0, 0, 0);
          setIsLoading(false);
          console.log(`ProjectModelViewer (${modelUrl}): Model ready and centered.`);
        },
        (xhr) => {
          console.log(`ProjectModelViewer (${modelUrl}): Model loading progress: ${(xhr.loaded / xhr.total * 100).toFixed(2)}% loaded`);
        },
        (loadError) => {
          if (!isMounted) return;
          console.error(`ProjectModelViewer (${modelUrl}): Error loading model:`, loadError);
          setError(`Failed to load model. ${loadError.message || 'Unknown error'}`);
          setIsLoading(false);
        }
      );
      
      const handleMouseMove = (event: MouseEvent) => {
        if (!isMounted || !modelGroupRef.current) return;
        
        // Normalize mouse position to -1 to +1 range for both axes
        const x = (event.clientX / window.innerWidth) * 2 - 1;
        const y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        const sensitivity = 0.15; // Adjust for more or less rotation
        targetRotationRef.current.x = y * sensitivity;
        targetRotationRef.current.y = x * sensitivity;
      };

      // Listen to mousemove on the window for global effect
      window.addEventListener('mousemove', handleMouseMove);
      console.log(`ProjectModelViewer (${modelUrl}): Global mousemove listener added.`);

      const animate = () => {
        if (!isMounted) return;
        animationFrameIdRef.current = requestAnimationFrame(animate);
        if (modelGroupRef.current && rendererRef.current && sceneRef.current && cameraRef.current) {
          // Smoothly interpolate rotation
          const targetX = targetRotationRef.current.x;
          const targetY = targetRotationRef.current.y;

          modelGroupRef.current.rotation.x += (targetX - modelGroupRef.current.rotation.x) * 0.05;
          modelGroupRef.current.rotation.y += (targetY - modelGroupRef.current.rotation.y) * 0.05;
          
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      };
      animate();
      console.log(`ProjectModelViewer (${modelUrl}): Animation loop started.`);

      const handleResize = () => {
        if (!isMounted || !currentMount || !rendererRef.current || !cameraRef.current || currentMount.clientWidth === 0 || currentMount.clientHeight === 0) {
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
        if (isMounted && currentMount && currentMount.clientWidth > 0 && currentMount.clientHeight > 0) {
            handleResize();
            console.log(`ProjectModelViewer (${modelUrl}): Initial resize executed after timeout.`);
        } else if (isMounted) {
            console.warn(`ProjectModelViewer (${modelUrl}): Initial resize skipped after timeout - mount still has zero dimensions.`);
        }
      }, 100); 

      return () => {
        isMounted = false;
        console.log(`ProjectModelViewer (${modelUrl}): setTimeout callback cleanup starting.`);
        clearTimeout(initialResizeTimeoutId);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mousemove', handleMouseMove); // Remove global listener
        console.log(`ProjectModelViewer (${modelUrl}): Global mousemove listener removed.`);
      };
    }, 0); 

    return () => {
      isMounted = false;
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
        light.dispose?.(); 
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
  }, [modelUrl, containerRef]); // Re-run effect if modelUrl or containerRef changes

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
      {/* The canvas will be appended here by Three.js */}
    </div>
  );
};

export default ProjectModelViewer;
