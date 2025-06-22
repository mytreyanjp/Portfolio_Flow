
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, LucideRotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

// --- Constants ---
const SCROLL_ZOOM_FACTOR_MIN = 2.0;
const SCROLL_ZOOM_FACTOR_MAX = 3.5;
const LERP_SPEED = 0.08;
const MOUSE_ROTATION_SENSITIVITY_X = 0.4;
const MOUSE_ROTATION_SENSITIVITY_Y = 0.3;
const JUMP_HEIGHT = 0.15;
const JUMP_DURATION = 300;
const TARGET_MODEL_VIEW_SIZE = 2.5;

// --- Singleton Loaders ---
// It's more efficient to create loaders once and reuse them.
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
  const [isInView, setIsInView] = useState(false);
  
  // We use a single state to manage the loading status
  const [status, setStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');

  // --- Intersection Observer to manage visibility ---
  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      {
        root: null, // viewport
        rootMargin: '0px', // No margin
        threshold: 0.1, // Fire when 10% of the item is visible
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
    // If not in view or no model path, do nothing and ensure cleanup happens.
    if (!isInView || !modelPath) {
      // The return function will handle teardown if it was previously visible
      return;
    }
    
    // Guard against multiple initializations
    if (status !== 'idle' && status !== 'error') return;

    const currentMount = mountRef.current;
    if (!currentMount) return;
    
    let isMounted = true;
    let renderer: THREE.WebGLRenderer | null = null;
    let animationFrameId: number | null = null;
    let scene: THREE.Scene | null = null;

    const setupScene = () => {
      setStatus('loading');
      setError(null);
      
      scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, currentMount.clientWidth / currentMount.clientHeight, 0.1, 100);
      camera.position.z = SCROLL_ZOOM_FACTOR_MIN;

      // --- Lighting ---
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
      directionalLight.position.set(2, 5, 3);
      const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
      scene.add(ambientLight, directionalLight, hemiLight);
      
      // --- Renderer ---
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
      } catch (e) {
        console.error("Failed to create WebGLRenderer:", e);
        if (isMounted) {
            setError('Could not initialize 3D viewer.');
            setStatus('error');
            onModelErrorOrMissing?.();
        }
        return;
      }

      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
      renderer.setClearAlpha(0);
      currentMount.appendChild(renderer.domElement);

      let modelGroup: THREE.Group | null = null;
      let initialModelYAfterCentering = 0;
      let isJumping = false;
      let jumpStartTime = 0;
      const targetRotation = { x: 0, y: 0 };
      let targetCameraZ = SCROLL_ZOOM_FACTOR_MIN;

      // --- Interaction Handlers ---
      const handleMouseMove = (event: MouseEvent) => {
        targetRotation.y = (event.clientX / window.innerWidth - 0.5) * MOUSE_ROTATION_SENSITIVITY_X * 2;
        targetRotation.x = (event.clientY / window.innerHeight - 0.5) * MOUSE_ROTATION_SENSITIVITY_Y * 2;
      };
      const handleScroll = () => {
        const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
        targetCameraZ = SCROLL_ZOOM_FACTOR_MIN + scrollPercent * (SCROLL_ZOOM_FACTOR_MAX - SCROLL_ZOOM_FACTOR_MIN);
      };
      const handleModelClick = () => {
        if (!isJumping) {
            isJumping = true;
            jumpStartTime = Date.now();
        }
      };

      // --- Model Loading ---
      if (gltfLoader) {
        gltfLoader.load(modelPath,
          (gltf) => {
            if (!isMounted || !scene) return;
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
            initialModelYAfterCentering = model.position.y;
            
            modelGroup = model;
            setStatus('loaded');
          },
          undefined,
          (loadError) => {
            if (!isMounted) return;
            console.error(`Error loading model ${modelPath}:`, loadError);
            setError('Failed to load model.');
            setStatus('error');
            onModelErrorOrMissing?.();
          }
        );
      }

      // --- Animation Loop ---
      const animate = () => {
        if (!isMounted) return;
        animationFrameId = requestAnimationFrame(animate);
        
        if (renderer && camera && scene && modelGroup) {
          modelGroup.rotation.x += (targetRotation.x - modelGroup.rotation.x) * LERP_SPEED;
          modelGroup.rotation.y += (targetRotation.y - modelGroup.rotation.y) * LERP_SPEED;
          camera.position.z += (targetCameraZ - camera.position.z) * LERP_SPEED;
          
          let finalTargetModelY = initialModelYAfterCentering;
          if (isJumping) {
            const elapsed = Date.now() - jumpStartTime;
            if (elapsed < JUMP_DURATION) {
              finalTargetModelY += JUMP_HEIGHT * Math.sin((elapsed / JUMP_DURATION) * Math.PI);
            } else {
              isJumping = false;
            }
          }
          modelGroup.position.y += (finalTargetModelY - modelGroup.position.y) * LERP_SPEED;

          renderer.render(scene, camera);
        }
      };
      
      // --- Resize Observer ---
      const resizeObserver = new ResizeObserver(entries => {
        if (!isMounted || !entries || entries.length === 0 || !camera || !renderer) return;
        const { width, height } = entries[0].contentRect;
        if (width > 0 && height > 0) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        }
      });
      resizeObserver.observe(currentMount);

      // --- Attach Event Listeners ---
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('scroll', handleScroll, { passive: true });
      currentMount.addEventListener('click', handleModelClick);
      
      animate();

      // --- Return the cleanup function for this setup ---
      return () => {
        isMounted = false;
        
        // --- Detach Event Listeners ---
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('scroll', handleScroll);
        currentMount.removeEventListener('click', handleModelClick);
        resizeObserver.disconnect();
        
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        
        // --- Full Scene Teardown ---
        if (scene) {
            scene.traverse(object => {
                if ((object as THREE.Mesh).isMesh) {
                    const mesh = object as THREE.Mesh;
                    if(mesh.geometry) mesh.geometry.dispose();
                    if(Array.isArray(mesh.material)) {
                        mesh.material.forEach(material => material.dispose());
                    } else if (mesh.material) {
                        mesh.material.dispose();
                    }
                }
            });
            scene.clear();
        }
        
        if (renderer) {
          // Force context loss is a strong way to ensure resources are freed
          renderer.forceContextLoss();
          renderer.dispose();
          if (currentMount.contains(renderer.domElement)) {
            currentMount.removeChild(renderer.domElement);
          }
        }

        renderer = null;
        scene = null;
      };
    };

    const cleanup = setupScene();

    // The actual cleanup function that useEffect will run
    return () => {
      if (cleanup) {
        cleanup();
      }
      setStatus('idle');
    };

  }, [isInView, modelPath, onModelErrorOrMissing, status]); // Rerun effect when visibility or model changes

  const handleRetry = () => {
    setStatus('idle'); // Reset status to allow re-initialization
    setError(null);
  };

  return (
    <div
      ref={mountRef}
      className={cn(
        "w-full h-full overflow-hidden flex items-center justify-center",
        error && "bg-destructive/10"
      )}
    >
      {(status === 'idle' || status === 'loading') && !error && <Skeleton className="w-full h-full" />}
      {status === 'error' && (
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
