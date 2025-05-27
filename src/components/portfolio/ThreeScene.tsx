
'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

interface ThreeSceneProps {
  scrollPercentage: number;
  currentTheme: 'light' | 'dark'; // Assuming this prop is passed from parent
}

// Define keyframes for the GLB model's animation
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
    console.warn("ThreeScene: Invalid keyframes or scroll value for interpolation. Using default.", { keyframes, scroll });
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

// Create these loaders only once
const gltfLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
// IMPORTANT: You MUST copy the draco decoder files to this path in your public folder
// This path should point to the directory containing draco_wasm_wrapper.js and draco_decoder.wasm
// It's common for these files to be in a 'gltf' subdirectory for Draco.
dracoLoader.setDecoderPath('/libs/draco/gltf/'); // Updated path
dracoLoader.setDecoderConfig({ type: 'wasm' }); // Use WASM decoder
gltfLoader.setDRACOLoader(dracoLoader);


const ThreeScene: React.FC<ThreeSceneProps> = ({ scrollPercentage, currentTheme }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animatedObjectRef = useRef<THREE.Group | null>(null); // For GLB model
  const animationFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mountRef.current) {
      console.error("ThreeScene: Mount ref is null. Aborting setup.");
      return;
    }
    const currentMount = mountRef.current;
    console.log(`ThreeScene: useEffect triggered. Theme: ${currentTheme}, Scroll: ${scrollPercentage.toFixed(2)}`);

    // Initialize Scene, Camera, Renderer only if they don't exist
    if (!sceneRef.current) {
      sceneRef.current = new THREE.Scene();
      console.log("ThreeScene: Scene created.");
    }
    sceneRef.current.background = null; // Transparent background

    if (!cameraRef.current) {
      cameraRef.current = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
      cameraRef.current.position.z = 3; // Adjust camera position as needed
      console.log("ThreeScene: Camera created.");
    } else {
       if (currentMount.clientWidth > 0 && currentMount.clientHeight > 0) {
        cameraRef.current.aspect = currentMount.clientWidth / currentMount.clientHeight;
        cameraRef.current.updateProjectionMatrix();
      }
    }

    if (!rendererRef.current) {
      rendererRef.current = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Clamp pixel ratio
      console.log("ThreeScene: Renderer instance created.");
    }
    
    if (currentMount.clientWidth > 0 && currentMount.clientHeight > 0) {
        rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
    } else {
        console.warn("ThreeScene: Mount dimensions are zero during renderer setup. Using fallback 640x480.");
        rendererRef.current.setSize(640, 480); // Fallback size
    }
    rendererRef.current.setClearAlpha(0); // Ensure transparent background

    if (!currentMount.contains(rendererRef.current.domElement)) {
        currentMount.appendChild(rendererRef.current.domElement);
        console.log("ThreeScene: Renderer DOM element appended.");
    }


    // Remove previous lights and model before adding new ones
     sceneRef.current.children.filter(child => child.type === "PointLight" || child.type === "AmbientLight" || child.type === "DirectionalLight" || child.isGroup).forEach(child => {
        sceneRef.current?.remove(child);
        if ((child as any).dispose) (child as any).dispose(); // For lights if they have dispose
        if (child.isGroup) { // For GLB model group
            child.traverse(subChild => {
                if ((subChild as THREE.Mesh).isMesh) {
                    (subChild as THREE.Mesh).geometry.dispose();
                    const material = (subChild as THREE.Mesh).material;
                     if (Array.isArray(material)) {
                        material.forEach(m => m.dispose());
                    } else if (material) {
                        material.dispose();
                    }
                }
            });
        }
    });
    animatedObjectRef.current = null; // Clear ref

    // Lighting (adjust based on theme if needed)
    const ambientLight = new THREE.AmbientLight(0xffffff, currentTheme === 'dark' ? 0.8 : 1.5);
    sceneRef.current.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, currentTheme === 'dark' ? 1.2 : 1.8);
    directionalLight.position.set(1, 3, 2).normalize();
    sceneRef.current.add(directionalLight);
    
    const pointLightColor = currentTheme === 'dark' ? 0x9575CD : 0xFFEBCD; // Violet for dark, peachy for light
    const pointLight = new THREE.PointLight(pointLightColor, 1.5, 150); // Increased intensity and distance
    pointLight.position.set(-2, 1, 3);
    sceneRef.current.add(pointLight);


    // Load GLB Model
    const modelPath = '/models/blind_man.glb'; // Ensure this is correct
    console.log(`ThreeScene: Attempting to load GLB model from: ${modelPath}`);

    gltfLoader.load(
      modelPath,
      (gltf) => {
        console.log("ThreeScene: GLB model loaded successfully.", gltf);
        if (sceneRef.current) {
          // Remove previous model if any to avoid duplicates on HMR or prop changes
          if (animatedObjectRef.current) {
            sceneRef.current.remove(animatedObjectRef.current);
             animatedObjectRef.current.traverse(subChild => {
                if ((subChild as THREE.Mesh).isMesh) {
                    (subChild as THREE.Mesh).geometry.dispose();
                    const material = (subChild as THREE.Mesh).material;
                     if (Array.isArray(material)) {
                        material.forEach(m => m.dispose());
                    } else if (material) {
                        material.dispose();
                    }
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
        // console.warn("ThreeScene: animate() called but renderer, scene, or camera is missing.");
        animationFrameIdRef.current = requestAnimationFrame(animate); // Keep trying
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
    if(currentMount.clientWidth > 0 && currentMount.clientHeight > 0) handleResize(); // Initial call

    // Cleanup
    return () => {
      console.log("ThreeScene: useEffect cleanup initiated for theme:", currentTheme);
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
                } else if (material) { 
                    material.dispose();
                }
            }
        });
        animatedObjectRef.current = null;
        console.log("ThreeScene: Animated object removed and disposed from scene.");
      }
      
      // Clean up lights
      sceneRef.current?.children.filter(child => child.type === "PointLight" || child.type === "AmbientLight" || child.type === "DirectionalLight").forEach(child => {
        sceneRef.current?.remove(child);
        if ((child as any).dispose) (child as any).dispose();
      });
      console.log("ThreeScene: Lights removed from scene.");

      // When the component unmounts (e.g. due to key change or navigating away)
      if (rendererRef.current && currentMount.contains(rendererRef.current.domElement)) {
          currentMount.removeChild(rendererRef.current.domElement);
          console.log("ThreeScene: Renderer DOM element removed from mount.");
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
        console.log("ThreeScene: Renderer disposed.");
      }
      
      sceneRef.current = null; 
      cameraRef.current = null;
      console.log("ThreeScene: Scene and camera refs nulled.");
    };
  }, [scrollPercentage, currentTheme]); // Dependencies

  return <div ref={mountRef} className="fixed inset-0 -z-10 w-screen h-screen bg-transparent" />;
};

export default ThreeScene;
