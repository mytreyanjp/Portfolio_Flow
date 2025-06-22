
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, LucideRotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

// --- Singleton Loaders ---
let gltfLoader: GLTFLoader | null = null;
if (typeof window !== 'undefined') {
  gltfLoader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('/libs/draco/gltf/');
  gltfLoader.setDRACOLoader(dracoLoader);
}

// --- Component Props ---
interface ProjectModelViewerProps {
  modelPath: string | undefined | null;
  onModelErrorOrMissing?: () => void;
}

const ProjectModelViewer: React.FC<ProjectModelViewerProps> = ({ modelPath, onModelErrorOrMissing }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInView, setIsInView] = useState(false);

  // --- Intersection Observer to manage visibility ---
  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: '200px',
        threshold: 0.01,
      }
    );

    observer.observe(currentMount);

    return () => {
      if (currentMount) {
        observer.unobserve(currentMount);
      }
    };
  }, []);

  // --- Main Three.js setup and teardown effect ---
  useEffect(() => {
    if (!isInView || !modelPath) {
      return;
    }

    const currentMount = mountRef.current;
    if (!currentMount) return;

    setIsLoading(true);
    setError(null);
    
    let isMounted = true;
    let animationFrameId: number;
    let scene: THREE.Scene | null = new THREE.Scene();
    let camera: THREE.PerspectiveCamera | null;
    let renderer: THREE.WebGLRenderer | null;
    let modelGroup: THREE.Group | null;
    
    try {
      camera = new THREE.PerspectiveCamera(50, currentMount.clientWidth / currentMount.clientHeight, 0.1, 100);
      camera.position.z = 3;

      const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
      directionalLight.position.set(1, 4, 2);
      scene.add(ambientLight, directionalLight);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
      renderer.setClearAlpha(0);
      currentMount.appendChild(renderer.domElement);
    } catch (e: any) {
      console.error("Failed to create WebGL context:", e);
      if (isMounted) {
        setError(`WebGL Error: ${e.message || 'Context creation failed.'}`);
        onModelErrorOrMissing?.();
        setIsLoading(false);
      }
      if(scene) scene.clear();
      scene = null;
      return;
    }

    if (gltfLoader) {
      gltfLoader.load(
        modelPath,
        (gltf) => {
          if (!isMounted || !scene) return;
          setIsLoading(false);
          modelGroup = gltf.scene;
          
          const box = new THREE.Box3().setFromObject(modelGroup);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = maxDim > 0 ? 2.5 / maxDim : 1;
          modelGroup.scale.set(scale, scale, scale);
          
          const center = box.getCenter(new THREE.Vector3());
          modelGroup.position.sub(center);
          
          scene.add(modelGroup);
        },
        undefined, // onProgress callback
        (loadError) => {
          if (!isMounted) return;
          console.error(`Error loading model ${modelPath}:`, loadError);
          setError('Failed to load model file.');
          onModelErrorOrMissing?.();
          setIsLoading(false);
        }
      );
    }

    const animate = () => {
      if (!isMounted) return;
      animationFrameId = requestAnimationFrame(animate);
      
      if (renderer && scene && camera) {
        if (modelGroup) {
          modelGroup.rotation.y += 0.005; // Simple auto-rotation
        }
        renderer.render(scene, camera);
      }
    };
    animate();

    const resizeObserver = new ResizeObserver(entries => {
      if (!isMounted || !entries[0] || !camera || !renderer) return;
      const { width, height } = entries[0].contentRect;
      if(width > 0 && height > 0) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    });
    resizeObserver.observe(currentMount);

    return () => {
      isMounted = false;
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);

      if (scene) {
        scene.traverse(object => {
          if ((object as THREE.Mesh).isMesh) {
            const mesh = object as THREE.Mesh;
            mesh.geometry?.dispose();
            if(Array.isArray(mesh.material)) {
              mesh.material.forEach(material => material.dispose());
            } else if (mesh.material) {
              mesh.material.dispose();
            }
          }
        });
        scene.clear();
      }
      scene = null;
      
      if (renderer) {
        renderer.forceContextLoss();
        renderer.dispose();
        if (currentMount && currentMount.contains(renderer.domElement)) {
          currentMount.removeChild(renderer.domElement);
        }
      }
      renderer = null;
      camera = null;
      modelGroup = null;
    };
  }, [isInView, modelPath, onModelErrorOrMissing]);

  const handleRetry = useCallback(() => {
    setError(null);
    setIsInView(false);
    setTimeout(() => setIsInView(true), 50);
  }, []);

  return (
    <div
      ref={mountRef}
      className={cn(
        "w-full h-full overflow-hidden flex items-center justify-center",
        error && "bg-destructive/10"
      )}
    >
      {isLoading && !error && <Skeleton className="w-full h-full" />}
      {error && (
        <div className="flex flex-col items-center justify-center text-destructive p-2 text-center">
            <AlertTriangle className="h-10 w-10 mb-2"/>
            <p className="text-sm font-semibold mb-3">{error}</p>
            <Button variant="destructive" size="sm" onClick={handleRetry}>
              <LucideRotateCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
        </div>
      )}
    </div>
  );
};

export default ProjectModelViewer;
