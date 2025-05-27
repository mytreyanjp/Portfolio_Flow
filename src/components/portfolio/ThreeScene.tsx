
'use client';

import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

interface ThreeSceneProps {
  scrollPercentage: number;
  currentTheme: 'light' | 'dark'; // Expect 'light' or 'dark'
}

// Keyframes for the GLB model's animation
// IMPORTANT: You will likely need to adjust these values significantly
// to suit your custom GLB model's size, orientation, and desired animation.
// These keyframes are for the '/models/blind_man.glb' model.
const modelKeyframes = [
  { scroll: 0, position: [0, -0.5, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  { scroll: 0.25, position: [0.5, 0, -1], rotation: [0, Math.PI / 4, 0], scale: [1.1, 1.1, 1.1] },
  { scroll: 0.5, position: [0, 0.5, -2], rotation: [0, Math.PI / 2, 0], scale: [1.2, 1.2, 1.2] },
  { scroll: 0.75, position: [-0.5, 0, -1], rotation: [0, (3 * Math.PI) / 4, 0], scale: [1.1, 1.1, 1.1] },
  { scroll: 1, position: [0, -0.5, 0], rotation: [0, Math.PI, 0], scale: [1, 1, 1] },
];


const interpolateKeyframes = (
  keyframes: typeof modelKeyframes,
  scroll: number
): { position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number] } => {
  if (!keyframes || keyframes.length === 0 || typeof scroll !== 'number' || isNaN(scroll)) {
    const defaultKf = keyframes?.[0] || {
      position: [0, 0, 0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
      scale: [1, 1, 1] as [number, number, number],
    };
    return {
      position: [...defaultKf.position],
      rotation: [...defaultKf.rotation],
      scale: [...defaultKf.scale],
    };
  }

  let kf1 = keyframes[0];
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (scroll >= keyframes[i].scroll && scroll <= keyframes[i + 1].scroll) {
      kf1 = keyframes[i];
      break;
    }
  }

  let kf2 = kf1;
  for (let i = 0; i < keyframes.length; i++) {
    if (keyframes[i].scroll > kf1.scroll) {
      kf2 = keyframes[i];
      break;
    }
  }
  if (scroll < kf1.scroll) kf2 = kf1;
  if (scroll > keyframes[keyframes.length - 1].scroll) {
    kf1 = keyframes[keyframes.length -1];
    kf2 = kf1;
  }


  const t = (kf2.scroll - kf1.scroll === 0) ? 1 : (scroll - kf1.scroll) / (kf2.scroll - kf1.scroll);

  return {
    position: [
      kf1.position[0] + (kf2.position[0] - kf1.position[0]) * t,
      kf1.position[1] + (kf2.position[1] - kf1.position[1]) * t,
      kf1.position[2] + (kf2.position[2] - kf1.position[2]) * t,
    ] as [number, number, number],
    rotation: [
      kf1.rotation[0] + (kf2.rotation[0] - kf1.rotation[0]) * t,
      kf1.rotation[1] + (kf2.rotation[1] - kf1.rotation[1]) * t,
      kf1.rotation[2] + (kf2.rotation[2] - kf1.rotation[2]) * t,
    ] as [number, number, number],
    scale: [
      kf1.scale[0] + (kf2.scale[0] - kf1.scale[0]) * t,
      kf1.scale[1] + (kf2.scale[1] - kf1.scale[1]) * t,
      kf1.scale[2] + (kf2.scale[2] - kf1.scale[2]) * t,
    ] as [number, number, number],
  };
};


const ThreeScene: React.FC<ThreeSceneProps> = ({ scrollPercentage, currentTheme }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animatedObjectRef = useRef<THREE.Group | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const gltfLoaderRef = useRef<GLTFLoader | null>(null);
  const dracoLoaderRef = useRef<DRACOLoader | null>(null);

  useEffect(() => {
    if (!mountRef.current) {
      console.error("ThreeScene: Mount ref is null. Aborting setup.");
      return;
    }
    const currentMount = mountRef.current;
    console.log(`ThreeScene: useEffect triggered. Theme: ${currentTheme}, Scroll: ${scrollPercentage.toFixed(2)}`);

    // Initialize Scene, Camera, Renderer if they don't exist for this instance
    sceneRef.current = new THREE.Scene();
    sceneRef.current.background = null; // Transparent background

    const mountWidth = currentMount.clientWidth;
    const mountHeight = currentMount.clientHeight;

    if (mountWidth === 0 || mountHeight === 0) {
      console.warn("ThreeScene: Mount dimensions are zero during setup. Using fallback 640x480. Ensure parent div has dimensions.");
    }
    const effectiveWidth = mountWidth || 640;
    const effectiveHeight = mountHeight || 480;

    cameraRef.current = new THREE.PerspectiveCamera(75, effectiveWidth / effectiveHeight, 0.1, 1000);
    cameraRef.current.position.z = 3; // Adjust camera position as needed for your GLB

    rendererRef.current = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Clamp pixel ratio
    rendererRef.current.setSize(effectiveWidth, effectiveHeight);
    rendererRef.current.setClearAlpha(0); // Ensure transparent background
    currentMount.appendChild(rendererRef.current.domElement);
    console.log(`ThreeScene: Renderer initialized and appended. Size: ${effectiveWidth}x${effectiveHeight}`);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, currentTheme === 'dark' ? 0.6 : 1.2);
    sceneRef.current.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, currentTheme === 'dark' ? 1.2 : 2.0);
    directionalLight.position.set(1, 3, 2).normalize();
    sceneRef.current.add(directionalLight);

    const pointLight = new THREE.PointLight(currentTheme === 'dark' ? 0x9575CD : 0xFFEBCD, 1.0, 100);
    pointLight.position.set(-2, -1, 3);
    sceneRef.current.add(pointLight);

    // Setup DracoLoader
    if (!dracoLoaderRef.current) {
      dracoLoaderRef.current = new DRACOLoader();
      // IMPORTANT: You MUST copy the draco decoder files to this path in your public folder
      dracoLoaderRef.current.setDecoderPath('/libs/draco/'); 
      dracoLoaderRef.current.setDecoderConfig({ type: 'js' }); // or 'wasm' if you prefer
      console.log("ThreeScene: DRACOLoader instance created and decoder path set.");
    }
    
    // Setup GLTFLoader
    if (!gltfLoaderRef.current) {
        gltfLoaderRef.current = new GLTFLoader();
    }
    gltfLoaderRef.current.setDRACOLoader(dracoLoaderRef.current); // Assign DRACOLoader to GLTFLoader
    console.log("ThreeScene: GLTFLoader instance created/retrieved and DRACOLoader assigned.");


    // Load GLB Model
    // IMPORTANT: Path to your GLB file in the public folder
    const modelPath = '/models/blind_man.glb'; 
    console.log(`ThreeScene: Attempting to load GLB model from: ${modelPath}`);

    gltfLoaderRef.current.load(
      modelPath,
      (gltf) => {
        console.log("ThreeScene: GLB model loaded successfully.", gltf);
        if (sceneRef.current) {
          if (animatedObjectRef.current) {
            sceneRef.current.remove(animatedObjectRef.current);
            // Basic cleanup, more thorough might be needed for complex models
            animatedObjectRef.current.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                (child as THREE.Mesh).geometry.dispose();
                ((child as THREE.Mesh).material as THREE.Material | THREE.Material[]).dispose();
              }
            });
          }
          animatedObjectRef.current = gltf.scene;
          // Example: Adjust model scale or initial position if needed
          // animatedObjectRef.current.scale.set(0.5, 0.5, 0.5);
          // animatedObjectRef.current.position.y = -1; // Adjust based on your model's pivot
          sceneRef.current.add(animatedObjectRef.current);
          console.log("ThreeScene: GLB model added to scene.");
        }
      },
      (xhr) => {
        // console.log(`ThreeScene: GLB model ${(xhr.loaded / xhr.total * 100).toFixed(2)}% loaded`);
      },
      (error) => {
        console.error('ThreeScene: Error loading GLB model:', error);
      }
    );

    // Animation Loop
    const animate = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) {
        console.warn("ThreeScene: animate() called but renderer, scene, or camera is missing.");
        return;
      }
      animationFrameIdRef.current = requestAnimationFrame(animate);

      if (animatedObjectRef.current) {
        const interpolated = interpolateKeyframes(modelKeyframes, scrollPercentage);
        animatedObjectRef.current.position.set(...interpolated.position);
        animatedObjectRef.current.rotation.set(...interpolated.rotation);
        animatedObjectRef.current.scale.set(...interpolated.scale);
      }
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    animate();
    console.log("ThreeScene: Animation loop (re)started.");

    // Resize Handler
    const handleResize = () => {
      if (mountRef.current && rendererRef.current && cameraRef.current) {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        if (width > 0 && height > 0) {
          rendererRef.current.setSize(width, height);
          cameraRef.current.aspect = width / height;
          cameraRef.current.updateProjectionMatrix();
          console.log("ThreeScene: Resized to", width, "x", height);
        } else {
          console.warn("ThreeScene: Resize event, but new dimensions are zero.");
        }
      }
    };
    window.addEventListener('resize', handleResize);
    if(mountWidth > 0 && mountHeight > 0) handleResize(); // Initial call

    // Cleanup
    return () => {
      console.log("ThreeScene: useEffect cleanup initiated.");
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
        console.log("ThreeScene: Animation frame cancelled.");
      }
      window.removeEventListener('resize', handleResize);
      console.log("ThreeScene: Resize listener removed.");
      
      if (animatedObjectRef.current && sceneRef.current) {
         sceneRef.current.remove(animatedObjectRef.current);
         animatedObjectRef.current.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                (child as THREE.Mesh).geometry.dispose();
                const material = (child as THREE.Mesh).material;
                if (Array.isArray(material)) {
                    material.forEach(m => m.dispose());
                } else if (material) { // Check if material is not undefined
                    material.dispose();
                }
            }
        });
        animatedObjectRef.current = null;
        console.log("ThreeScene: Animated object removed and disposed from scene.");
      }
      
      sceneRef.current?.children.slice().forEach(child => { // remove all direct children including lights
        if(child !== animatedObjectRef.current) { // if not already removed
            sceneRef.current?.remove(child);
            if ((child as any).dispose) (child as any).dispose(); // if light has dispose, call it
        }
      });

      if (rendererRef.current) {
        if (rendererRef.current.domElement.parentNode === currentMount) {
            currentMount.removeChild(rendererRef.current.domElement);
            console.log("ThreeScene: Renderer DOM element removed.");
        }
        rendererRef.current.dispose();
        rendererRef.current = null;
        console.log("ThreeScene: Renderer disposed.");
      }
      
      sceneRef.current = null; 
      cameraRef.current = null;
      console.log("ThreeScene: Scene and camera refs nulled.");
    };
  }, [scrollPercentage, currentTheme]); // Dependencies that drive re-render/updates

  return <div ref={mountRef} className="fixed inset-0 -z-10 w-screen h-screen bg-transparent" />;
};

export default ThreeScene;

    