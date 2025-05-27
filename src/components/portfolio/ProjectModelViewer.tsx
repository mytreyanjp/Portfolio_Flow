
'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; // Optional: if you want to allow user control for debugging
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';

interface ProjectModelViewerProps {
  modelUrl: string;
  containerRef: React.RefObject<HTMLDivElement>; // Ref to the parent container for mouse move
}

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/libs/draco/gltf/');
dracoLoader.setDecoderConfig({ type: 'wasm' });

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

const ProjectModelViewer: React.FC<ProjectModelViewerProps> = ({ modelUrl, containerRef }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const targetRotation = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!mountRef.current || !containerRef.current) return;

    setIsLoading(true);
    setError(null);

    const currentMount = mountRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xeeeeee); // Light gray background for individual viewers

    const camera = new THREE.PerspectiveCamera(50, currentMount.clientWidth / currentMount.clientHeight, 0.1, 100);
    camera.position.z = 3; // Adjust based on typical model size

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    currentMount.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(2, 2, 5);
    scene.add(directionalLight);

    gltfLoader.load(
      modelUrl,
      (gltf) => {
        // Center and scale model (basic implementation)
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 1.5 / maxDim; // Adjust 1.5 to fit well in camera view

        gltf.scene.position.sub(center.multiplyScalar(scale));
        gltf.scene.scale.set(scale, scale, scale);
        
        modelRef.current = gltf.scene;
        scene.add(gltf.scene);
        setIsLoading(false);
      },
      undefined,
      (loadError) => {
        console.error(`Error loading model ${modelUrl}:`, loadError);
        setError(`Failed to load model: ${loadError.message}`);
        setIsLoading(false);
      }
    );
    
    // Mouse move interaction
    const parentContainer = containerRef.current;
    const handleMouseMove = (event: MouseEvent) => {
      if (!modelRef.current || !parentContainer) return;
      const rect = parentContainer.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      
      // Store target rotation, apply smoothing in animation loop
      targetRotation.current.x = y * 0.2; // Adjust sensitivity
      targetRotation.current.y = x * 0.2;
    };

    if (parentContainer) {
      parentContainer.addEventListener('mousemove', handleMouseMove);
      parentContainer.addEventListener('mouseleave', () => {
         targetRotation.current.x = 0;
         targetRotation.current.y = 0;
      });
    }


    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (modelRef.current) {
        // Smoothly interpolate rotation
        modelRef.current.rotation.x += (targetRotation.current.x - modelRef.current.rotation.x) * 0.05;
        modelRef.current.rotation.y += (targetRotation.current.y - modelRef.current.rotation.y) * 0.05;
      }
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!currentMount) return;
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (parentContainer) {
        parentContainer.removeEventListener('mousemove', handleMouseMove);
         parentContainer.removeEventListener('mouseleave', () => {
            targetRotation.current.x = 0;
            targetRotation.current.y = 0;
        });
      }
      cancelAnimationFrame(animationFrameId);
      if (modelRef.current) {
        scene.remove(modelRef.current);
        modelRef.current.traverse(child => {
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
      }
      scene.remove(ambientLight);
      scene.remove(directionalLight);
      ambientLight.dispose();
      directionalLight.dispose();
      renderer.dispose();
      if (currentMount && renderer.domElement) {
         try {
            currentMount.removeChild(renderer.domElement);
        } catch (e) {
            // Ignore if already removed or parent changed
        }
      }
    };
  }, [modelUrl, containerRef]);

  if (isLoading) {
    return <Skeleton className="w-full h-full" />;
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-destructive/10 text-destructive p-2 text-center">
        <AlertTriangle className="h-8 w-8 mb-2" />
        <p className="text-xs">{error}</p>
      </div>
    );
  }

  return <div ref={mountRef} className="w-full h-full overflow-hidden" />;
};

export default ProjectModelViewer;
