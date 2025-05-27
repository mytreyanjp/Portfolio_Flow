
'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
// OrbitControls is not used for mouse-move reaction, but useful for debugging model visibility
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';

interface ProjectModelViewerProps {
  modelUrl: string;
  containerRef: React.RefObject<HTMLDivElement>; // Ref to the parent card for mouse interactions
}

// Create loaders once and reuse them
const dracoLoaderInstance = new DRACOLoader();
dracoLoaderInstance.setDecoderPath('/libs/draco/gltf/'); // Path to Draco decoders in public folder
dracoLoaderInstance.setDecoderConfig({ type: 'wasm' });

const gltfLoaderInstance = new GLTFLoader();
gltfLoaderInstance.setDRACOLoader(dracoLoaderInstance);

const ProjectModelViewer: React.FC<ProjectModelViewerProps> = ({ modelUrl, containerRef }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null); // To store the loaded model (gltf.scene)
  const targetRotationRef = useRef({ x: 0, y: 0 }); // For mouse move effect

  useEffect(() => {
    // Ensure this log appears if the effect runs
    console.log(`ProjectModelViewer (${modelUrl}): useEffect triggered.`);

    if (!mountRef.current || !containerRef.current) {
      console.warn(`ProjectModelViewer (${modelUrl}): Mount or container ref not available yet. mountRef: ${mountRef.current}, containerRef: ${containerRef.current}`);
      // Don't return here immediately, allow it to proceed if refs become available later in the same render cycle,
      // or let the loading/error state handle it.
      if (!mountRef.current) setIsLoading(false); // Show error or "no preview" if mount point never appears
      return;
    }

    setIsLoading(true);
    setError(null);
    console.log(`ProjectModelViewer (${modelUrl}): Initializing for model.`);

    const currentMount = mountRef.current;
    const scene = new THREE.Scene();
    // A light background for the individual viewer to make models more visible
    // Forcing a distinct background to ensure it's not transparent by mistake
    scene.background = new THREE.Color(0xeeeeee); // Light gray

    const camera = new THREE.PerspectiveCamera(50, currentMount.clientWidth / currentMount.clientHeight, 0.1, 100);
    camera.position.z = 3; // Adjust based on typical model size and desired view
    console.log(`ProjectModelViewer (${modelUrl}): Camera initialized. Aspect: ${currentMount.clientWidth / currentMount.clientHeight}`);


    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // alpha: true if page bg should show
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    // renderer.setClearAlpha(0); // if transparent background is desired. Forcing opaque for debug.
    currentMount.appendChild(renderer.domElement);
    console.log(`ProjectModelViewer (${modelUrl}): Renderer created with size ${currentMount.clientWidth}x${currentMount.clientHeight}`);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2); // Increased ambient light
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8); // Increased directional light
    directionalLight.position.set(3, 3, 5);
    scene.add(directionalLight);
    const pointLight = new THREE.PointLight(0xffffff, 0.7);
    pointLight.position.set(-3, 2, 3);
    scene.add(pointLight);
    console.log(`ProjectModelViewer (${modelUrl}): Lights added.`);

    // Optional: OrbitControls for debugging model visibility and scale
    // const controls = new OrbitControls(camera, renderer.domElement);
    // controls.enableDamping = true;
    // console.log(`ProjectModelViewer (${modelUrl}): OrbitControls initialized (if uncommented).`);

    gltfLoaderInstance.load(
      modelUrl,
      (gltf) => {
        console.log(`ProjectModelViewer (${modelUrl}): GLTF loaded successfully.`);
        modelGroupRef.current = gltf.scene; // Store reference to the model group
        scene.add(modelGroupRef.current);

        // Center and scale model
        const box = new THREE.Box3().setFromObject(modelGroupRef.current);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        console.log(`ProjectModelViewer (${modelUrl}): Loaded model raw BBox size: X=${size.x.toFixed(2)}, Y=${size.y.toFixed(2)}, Z=${size.z.toFixed(2)}. MaxDim: ${maxDim.toFixed(2)}`);

        let scaleFactor = 1.0;
        const targetViewSize = 1.8; // How large the model should appear in the view (adjust this)

        if (maxDim > 0.001) { // Ensure maxDim is a sensible positive number
          scaleFactor = targetViewSize / maxDim;
        } else {
          console.warn(`ProjectModelViewer (${modelUrl}): Model maxDim is very small or zero (${maxDim}). Applying default scaleFactor of 1.0.`);
          scaleFactor = 1.0; // Default scale if model is too small or dimensions are weird
        }
        
        modelGroupRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);
        console.log(`ProjectModelViewer (${modelUrl}): Applied scaleFactor: ${scaleFactor.toFixed(2)}`);

        // After scaling, re-calculate center for correct positioning
        // This ensures the model is centered at the world origin AFTER scaling
        const scaledBox = new THREE.Box3().setFromObject(modelGroupRef.current); // Recalculate box with new scale
        const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
        modelGroupRef.current.position.sub(scaledCenter); 

        console.log(`ProjectModelViewer (${modelUrl}): Model positioned at world origin. Initial model center was (${center.x.toFixed(2)},${center.y.toFixed(2)},${center.z.toFixed(2)}), scaled center was (${scaledCenter.x.toFixed(2)},${scaledCenter.y.toFixed(2)},${scaledCenter.z.toFixed(2)})`);
        
        camera.lookAt(0, 0, 0); // Ensure camera looks at the origin where model is placed
        // controls?.target.set(0,0,0); // If using OrbitControls, update its target

        // --- DEBUGGING MATERIAL OVERRIDE (Uncomment to test if materials are the issue) ---
        // modelGroupRef.current.traverse((child) => {
        //   if ((child as THREE.Mesh).isMesh) {
        //     console.log(`ProjectModelViewer (${modelUrl}): Applying debug material to mesh:`, child.name || 'Unnamed Mesh');
        //     (child as THREE.Mesh).material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
        //   }
        // });
        // --- END DEBUGGING ---

        setIsLoading(false);
        console.log(`ProjectModelViewer (${modelUrl}): Model ready and centered.`);
      },
      (xhr) => { // onProgress callback
        console.log(`ProjectModelViewer (${modelUrl}): Model loading progress: ${(xhr.loaded / xhr.total * 100).toFixed(2)}% loaded`);
      },
      (loadError) => {
        console.error(`ProjectModelViewer (${modelUrl}): Error loading model:`, loadError);
        setError(`Failed to load model. Message: ${loadError.message || 'Unknown error'}`);
        setIsLoading(false);
      }
    );
    
    const parentContainer = containerRef.current; // Capture ref value
    const handleMouseMove = (event: MouseEvent) => {
      if (!modelGroupRef.current || !parentContainer) return;
      const rect = parentContainer.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1; // Normalized: -1 to 1
      const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1); // Normalized: -1 to 1, Y inverted
      
      targetRotationRef.current.x = y * 0.25; // Adjust sensitivity as needed
      targetRotationRef.current.y = x * 0.25;
    };

    const handleMouseLeave = () => {
       targetRotationRef.current.x = 0;
       targetRotationRef.current.y = 0;
    };

    if (parentContainer) {
      parentContainer.addEventListener('mousemove', handleMouseMove);
      parentContainer.addEventListener('mouseleave', handleMouseLeave);
      console.log(`ProjectModelViewer (${modelUrl}): Mouse move/leave listeners added to parent container.`);
    } else {
      console.warn(`ProjectModelViewer (${modelUrl}): Parent container (card) ref was null when trying to add mouse listeners.`);
    }

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (modelGroupRef.current) {
        // Smoothly interpolate rotation towards target
        modelGroupRef.current.rotation.x += (targetRotationRef.current.x - modelGroupRef.current.rotation.x) * 0.05;
        modelGroupRef.current.rotation.y += (targetRotationRef.current.y - modelGroupRef.current.rotation.y) * 0.05;
      }
      // controls?.update(); // If using OrbitControls
      renderer.render(scene, camera);
    };
    animate();
    console.log(`ProjectModelViewer (${modelUrl}): Animation loop started.`);

    const handleResize = () => {
      if (!currentMount || currentMount.clientWidth === 0 || currentMount.clientHeight === 0) {
        console.warn(`ProjectModelViewer (${modelUrl}): Resize handler called but currentMount has zero dimensions or is null.`);
        return;
      }
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
      console.log(`ProjectModelViewer (${modelUrl}): Resized to ${currentMount.clientWidth}x${currentMount.clientHeight}`);
    };
    window.addEventListener('resize', handleResize);
    // Initial resize call in case dimensions were not ready at first, or if layout shifts slightly after mount
    // Using a small timeout can sometimes help if the div's dimensions are not immediately final
    const resizeTimeoutId = setTimeout(() => {
        if (currentMount && currentMount.clientWidth > 0 && currentMount.clientHeight > 0) {
            handleResize();
        } else {
            console.warn(`ProjectModelViewer (${modelUrl}): Initial resize check found zero dimensions for currentMount.`);
        }
    }, 100);


    return () => {
      console.log(`ProjectModelViewer (${modelUrl}): Cleaning up...`);
      clearTimeout(resizeTimeoutId);
      window.removeEventListener('resize', handleResize);
      if (parentContainer) { // Use captured ref for removal
        parentContainer.removeEventListener('mousemove', handleMouseMove);
        parentContainer.removeEventListener('mouseleave', handleMouseLeave);
      }
      cancelAnimationFrame(animationFrameId);
      
      if (modelGroupRef.current) {
        scene.remove(modelGroupRef.current);
        modelGroupRef.current.traverse(child => {
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
        modelGroupRef.current = null;
      }
      scene.remove(ambientLight);
      scene.remove(directionalLight);
      scene.remove(pointLight);
      ambientLight.dispose();
      directionalLight.dispose();
      pointLight.dispose();
      
      if (currentMount && renderer.domElement) {
         try {
            currentMount.removeChild(renderer.domElement);
        } catch (e) {
            // Ignore if already removed, or if currentMount became null (unlikely here but good practice)
            console.warn(`ProjectModelViewer (${modelUrl}): Error removing renderer DOM element during cleanup:`, e);
        }
      }
      renderer.dispose();
      // scene.dispose(); // Scene itself doesn't have a dispose method like this. Its contents are disposed above.
      console.log(`ProjectModelViewer (${modelUrl}): Cleanup complete.`);
    };
  }, [modelUrl, containerRef]); // Only re-run if modelUrl or containerRef (unlikely for containerRef) changes

  if (isLoading) {
    return <Skeleton className="w-full h-full" />; // Uses full height of its container in ProjectCard
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-destructive/10 text-destructive p-2 text-center">
        <AlertTriangle className="h-8 w-8 mb-2" />
        <p className="text-xs font-semibold">Error loading model</p>
        <p className="text-xs">{error}</p>
      </div>
    );
  }

  // This div is where the Three.js canvas will be appended. Its size is determined by ProjectCard.tsx
  return <div ref={mountRef} className="w-full h-full overflow-hidden" />;
};

export default ProjectModelViewer;
