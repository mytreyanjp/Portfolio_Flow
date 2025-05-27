
'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface ThreeSceneProps {
  scrollPercentage: number;
  currentTheme: 'light' | 'dark'; // Though theme isn't used for geometry now, it might be for lighting/bg
}

// Keyframes for the GLB model's animation
// IMPORTANT: You will likely need to adjust these values significantly
// to suit your custom GLB model's size, orientation, and desired animation.
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
) => {
  const current = {
    position: [...keyframes[0].position] as [number, number, number],
    rotation: [...keyframes[0].rotation] as [number, number, number],
    scale: [...keyframes[0].scale] as [number, number, number],
  };

  for (let i = 0; i < keyframes.length - 1; i++) {
    const kf1 = keyframes[i];
    const kf2 = keyframes[i + 1];

    if (scroll >= kf1.scroll && scroll <= kf2.scroll) {
      const t = (scroll - kf1.scroll) / (kf2.scroll - kf1.scroll);
      for (let j = 0; j < 3; j++) {
        current.position[j] = kf1.position[j] + (kf2.position[j] - kf1.position[j]) * t;
        current.rotation[j] = kf1.rotation[j] + (kf2.rotation[j] - kf1.rotation[j]) * t;
        current.scale[j] = kf1.scale[j] + (kf2.scale[j] - kf1.scale[j]) * t;
      }
      break;
    } else if (scroll > keyframes[keyframes.length - 1].scroll) {
      current.position = [...keyframes[keyframes.length - 1].position] as [number, number, number];
      current.rotation = [...keyframes[keyframes.length - 1].rotation] as [number, number, number];
      current.scale = [...keyframes[keyframes.length - 1].scale] as [number, number, number];
      break;
    }
  }
  return current;
};

const ThreeScene: React.FC<ThreeSceneProps> = ({ scrollPercentage, currentTheme }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animatedObjectRef = useRef<THREE.Group | null>(null); // Will hold the loaded GLB scene
  const animationFrameIdRef = useRef<number | null>(null);
  const lightsRef = useRef<{ ambientLight?: THREE.AmbientLight; directionalLight?: THREE.DirectionalLight; pointLight?: THREE.PointLight }>({});

  useEffect(() => {
    console.log(`ThreeScene: useEffect triggered. Theme: ${currentTheme}, Scroll: ${scrollPercentage.toFixed(2)}`);
    if (!mountRef.current) {
      console.error("ThreeScene: Mount ref is null. Aborting setup.");
      return;
    }
    const currentMount = mountRef.current;

    // Initialize Scene, Camera, Renderer if they don't exist for this instance
    if (!sceneRef.current) sceneRef.current = new THREE.Scene();
    if (!cameraRef.current) {
      cameraRef.current = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
      cameraRef.current.position.z = 3; // Adjust camera position as needed for your GLB
    }
    if (!rendererRef.current) {
      rendererRef.current = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // alpha: true for transparent background
      rendererRef.current.setPixelRatio(window.devicePixelRatio);
      currentMount.appendChild(rendererRef.current.domElement);
      console.log("ThreeScene: Renderer initialized and appended.");
    }
    rendererRef.current.setClearAlpha(0); // Ensure transparent background

    const mountWidth = currentMount.clientWidth;
    const mountHeight = currentMount.clientHeight;

    if (mountWidth > 0 && mountHeight > 0) {
      rendererRef.current.setSize(mountWidth, mountHeight);
      if (cameraRef.current) {
        cameraRef.current.aspect = mountWidth / mountHeight;
        cameraRef.current.updateProjectionMatrix();
      }
      console.log(`ThreeScene: Renderer and camera sized to: ${mountWidth}x${mountHeight}`);
    } else {
      console.warn("ThreeScene: Mount dimensions are zero. Using fallback 640x480 for renderer.");
      rendererRef.current.setSize(640, 480); // Fallback size
      if (cameraRef.current) {
        cameraRef.current.aspect = 640 / 480;
        cameraRef.current.updateProjectionMatrix();
      }
    }

    // Lighting Setup (adjust as needed for your GLB model)
    if (sceneRef.current) {
      if (lightsRef.current.ambientLight) sceneRef.current.remove(lightsRef.current.ambientLight);
      lightsRef.current.ambientLight = new THREE.AmbientLight(0xffffff, 1.5); // Brighter ambient light
      sceneRef.current.add(lightsRef.current.ambientLight);

      if (lightsRef.current.directionalLight) sceneRef.current.remove(lightsRef.current.directionalLight);
      lightsRef.current.directionalLight = new THREE.DirectionalLight(0xffffff, 2); // Brighter directional light
      lightsRef.current.directionalLight.position.set(5, 5, 5).normalize();
      sceneRef.current.add(lightsRef.current.directionalLight);
      
      if (lightsRef.current.pointLight) sceneRef.current.remove(lightsRef.current.pointLight);
      lightsRef.current.pointLight = new THREE.PointLight(0xffffff, 1, 100);
      lightsRef.current.pointLight.position.set(-5, -5, 5);
      sceneRef.current.add(lightsRef.current.pointLight);
    }

    // Load GLB Model
    if (sceneRef.current && animatedObjectRef.current) {
      sceneRef.current.remove(animatedObjectRef.current);
      // Dispose old geometry/material if any (more complex for GLB, traverse scene graph)
      animatedObjectRef.current = null; 
    }

    const loader = new GLTFLoader();
    // IMPORTANT: Replace with the actual path to your GLB file in the public folder
    const modelPath = '/models/placeholder.glb'; 
    console.log(`ThreeScene: Attempting to load GLB model from: ${modelPath}`);

    loader.load(
      modelPath,
      (gltf) => {
        console.log("ThreeScene: GLB model loaded successfully.", gltf);
        if (sceneRef.current) {
          // If there was a previous model, remove it
          if (animatedObjectRef.current) {
            sceneRef.current.remove(animatedObjectRef.current);
             // Proper disposal for GLTF scenes involves traversing
            animatedObjectRef.current.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                (child as THREE.Mesh).geometry.dispose();
                ((child as THREE.Mesh).material as THREE.Material | THREE.Material[]).dispose();
              }
            });
          }

          animatedObjectRef.current = gltf.scene;
          // Initial adjustments (optional, can also be handled by keyframes)
          // animatedObjectRef.current.scale.set(0.5, 0.5, 0.5);
          // animatedObjectRef.current.position.set(0, 0, 0);
          sceneRef.current.add(animatedObjectRef.current);
          console.log("ThreeScene: GLB model added to scene.");
        }
      },
      (xhr) => {
        // console.log(`ThreeScene: GLB loading progress: ${(xhr.loaded / xhr.total) * 100}% loaded`);
      },
      (error) => {
        console.error('ThreeScene: Error loading GLB model:', error);
        // Fallback to a cube if GLB fails to load? Or just show error?
        // For now, it will just log error and scene might be empty.
      }
    );

    // Animation Loop
    const animate = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) {
        console.warn("ThreeScene: Animate called but refs not ready for rendering.");
        animationFrameIdRef.current = requestAnimationFrame(animate);
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
    if (mountWidth > 0 && mountHeight > 0) {
        animate();
        console.log("ThreeScene: Animation loop started.");
    } else {
        console.warn("ThreeScene: Animation loop NOT started due to zero mount dimensions.");
    }

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
          if (!animationFrameIdRef.current && (animatedObjectRef.current || modelPath)) {
            if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
            animate();
            console.log("ThreeScene: Animation loop (re)started on resize.");
          }
        } else {
          console.warn("ThreeScene: Resize event, but new dimensions are zero.");
        }
      }
    };
    window.addEventListener('resize', handleResize);
    // Initial size update if dimensions are already good
    if (mountWidth > 0 && mountHeight > 0) handleResize();


    // Cleanup function
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
        // Proper disposal for GLTF scenes involves traversing
        animatedObjectRef.current.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            (child as THREE.Mesh).geometry.dispose();
            // Material could be an array
            const material = (child as THREE.Mesh).material;
            if (Array.isArray(material)) {
              material.forEach(m => m.dispose());
            } else {
              material.dispose();
            }
          }
        });
        animatedObjectRef.current = null;
        console.log("ThreeScene: Animated object removed and disposed from scene.");
      }
      
      // Dispose lights
      if (sceneRef.current) {
        if (lightsRef.current.ambientLight) sceneRef.current.remove(lightsRef.current.ambientLight);
        if (lightsRef.current.directionalLight) sceneRef.current.remove(lightsRef.current.directionalLight);
        if (lightsRef.current.pointLight) sceneRef.current.remove(lightsRef.current.pointLight);
      }
      // lightsRef.current.ambientLight?.dispose(); // AmbientLight doesn't have dispose
      // lightsRef.current.directionalLight?.dispose(); // DirectionalLight doesn't have dispose
      // lightsRef.current.pointLight?.dispose(); // PointLight doesn't have dispose directly, managed by scene removal
      lightsRef.current = {};


      if (rendererRef.current) {
        if (rendererRef.current.domElement.parentNode === currentMount) {
          currentMount.removeChild(rendererRef.current.domElement);
          console.log("ThreeScene: Renderer DOM element removed.");
        }
        rendererRef.current.dispose();
        rendererRef.current = null;
        console.log("ThreeScene: Renderer disposed.");
      }
      
      // Scene and camera don't have dispose methods themselves, their contents do.
      // Scene is effectively cleared by removing objects and lights.
      sceneRef.current = null; 
      cameraRef.current = null;
      console.log("ThreeScene: Scene and camera refs nulled. Full cleanup complete for this instance.");
    };
  // Key dependencies: scrollPercentage and currentTheme (which implies object/animation changes)
  // currentTheme is not directly used for object geometry here anymore as we load GLB
  // but keep it if lighting or other scene aspects are theme-dependent.
  // For GLB loading, we want this effect to run once per component mount,
  // and scrollPercentage updates will drive animation.
  // Theme change is handled by RootLayout re-keying and remounting ThreeScene.
  }, [scrollPercentage, currentTheme]); 

  return <div ref={mountRef} className="fixed inset-0 -z-10 w-screen h-screen bg-transparent" />;
};

export default ThreeScene;

    