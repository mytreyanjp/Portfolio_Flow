
'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface ThreeSceneProps {
  scrollPercentage: number;
  currentTheme: 'light' | 'dark';
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
) => {
  // Ensure keyframes is not empty and scroll is a valid number
  if (!keyframes || keyframes.length === 0 || typeof scroll !== 'number' || isNaN(scroll)) {
    // Return a default state or the first keyframe
    const defaultKf = keyframes && keyframes.length > 0 ? keyframes[0] : {
      position: [0, 0, 0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
      scale: [1, 1, 1] as [number, number, number],
    };
    return {
      position: [...defaultKf.position] as [number, number, number],
      rotation: [...defaultKf.rotation] as [number, number, number],
      scale: [...defaultKf.scale] as [number, number, number],
    };
  }

  let kf1 = keyframes[0];
  let kf2 = keyframes[keyframes.length - 1]; // Default to last if scroll is beyond range

  // Find the two keyframes to interpolate between
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (scroll >= keyframes[i].scroll && scroll <= keyframes[i + 1].scroll) {
      kf1 = keyframes[i];
      kf2 = keyframes[i + 1];
      break;
    }
  }
   // If scroll is before the first keyframe, use the first keyframe's values
  if (scroll < kf1.scroll) {
    return {
      position: [...kf1.position] as [number, number, number],
      rotation: [...kf1.rotation] as [number, number, number],
      scale: [...kf1.scale] as [number, number, number],
    };
  }
  // If scroll is after the last keyframe, use the last keyframe's values
  if (scroll > kf2.scroll && kf2 !== keyframes[keyframes.length-1] ) { // check if kf2 is not already the last keyframe
     kf1 = keyframes[keyframes.length-1]; // update kf1 to the last keyframe before assigning to kf2
     kf2 = keyframes[keyframes.length-1];
  }
   if (scroll > keyframes[keyframes.length - 1].scroll) {
    const lastKf = keyframes[keyframes.length - 1];
    return {
        position: [...lastKf.position] as [number, number, number],
        rotation: [...lastKf.rotation] as [number, number, number],
        scale: [...lastKf.scale] as [number, number, number],
    };
  }


  const t = (kf2.scroll - kf1.scroll === 0) ? 1 : (scroll - kf1.scroll) / (kf2.scroll - kf1.scroll);

  const current = {
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
  return current;
};


const ThreeScene: React.FC<ThreeSceneProps> = ({ scrollPercentage, currentTheme }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animatedObjectRef = useRef<THREE.Group | null>(null); // For GLB model
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
    sceneRef.current.background = null; // Transparent background


    if (!cameraRef.current) {
      cameraRef.current = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
      cameraRef.current.position.z = 3; // Adjust camera position as needed for your GLB
    }

    if (!rendererRef.current) {
      rendererRef.current = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      // Clamp pixel ratio for performance
      rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      rendererRef.current.setClearAlpha(0); // Ensure transparent background
      currentMount.appendChild(rendererRef.current.domElement);
      console.log("ThreeScene: Renderer initialized and appended.");
    }


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
      console.warn("ThreeScene: Mount dimensions are zero during setup. Using fallback 640x480 for renderer.");
      rendererRef.current.setSize(640, 480); // Fallback size
      if (cameraRef.current) {
        cameraRef.current.aspect = 640 / 480;
        cameraRef.current.updateProjectionMatrix();
      }
    }
    
    // Lighting (adjust as needed)
    // Remove existing lights before adding new ones to prevent duplicates on re-renders if not careful
    Object.values(lightsRef.current).forEach(light => light && sceneRef.current?.remove(light));
    lightsRef.current = {};

    lightsRef.current.ambientLight = new THREE.AmbientLight(0xffffff, currentTheme === 'dark' ? 0.8 : 1.5);
    sceneRef.current.add(lightsRef.current.ambientLight);

    lightsRef.current.directionalLight = new THREE.DirectionalLight(0xffffff, currentTheme === 'dark' ? 1.5 : 2.5);
    lightsRef.current.directionalLight.position.set(2, 5, 3).normalize();
    sceneRef.current.add(lightsRef.current.directionalLight);
    
    lightsRef.current.pointLight = new THREE.PointLight(currentTheme === 'dark' ? 0x9575CD : 0xFFEBCD, 1.5, 100 ); // Violet for dark, Orange for light
    lightsRef.current.pointLight.position.set(-3, -2, 4);
    sceneRef.current.add(lightsRef.current.pointLight);


    // Load GLB Model
    if (sceneRef.current && !animatedObjectRef.current) { // Load only if not already loaded
      const loader = new GLTFLoader();
      const modelPath = '/models/blind_man.glb'; // Make sure this path is correct
      console.log(`ThreeScene: Attempting to load GLB model from: ${modelPath}`);

      loader.load(
        modelPath,
        (gltf) => {
          console.log("ThreeScene: GLB model loaded successfully.", gltf);
          if (sceneRef.current) {
            if (animatedObjectRef.current) { // Should not happen due to guard above, but good practice
              sceneRef.current.remove(animatedObjectRef.current);
               animatedObjectRef.current.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                  (child as THREE.Mesh).geometry.dispose();
                  const material = (child as THREE.Mesh).material;
                  if (Array.isArray(material)) {
                    material.forEach(m => m.dispose());
                  } else {
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
        undefined, // onProgress callback (optional)
        (error) => {
          console.error('ThreeScene: Error loading GLB model:', error);
        }
      );
    }


    // Animation Loop
    const animate = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) {
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
        console.log("ThreeScene: Animation loop (re)started.");
    } else {
        console.warn("ThreeScene: Animation loop NOT started due to zero mount dimensions during setup.");
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
          // Ensure animation continues after resize if it was stopped or not started
          if (!animationFrameIdRef.current && (animatedObjectRef.current || modelPath)) { // Re-check condition
             if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
             animate(); // Restart animation if needed
             console.log("ThreeScene: Animation loop (re)started on resize ensure.");
          }
        } else {
          console.warn("ThreeScene: Resize event, but new dimensions are zero.");
          if (animationFrameIdRef.current) {
             cancelAnimationFrame(animationFrameIdRef.current);
             animationFrameIdRef.current = null;
             console.log("ThreeScene: Animation loop stopped due to zero dimensions on resize.");
          }
        }
      }
    };
    window.addEventListener('resize', handleResize);
    if (mountWidth > 0 && mountHeight > 0) handleResize(); // Call once to set initial size properly


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

      // Only dispose and remove model if this component instance is truly unmounting
      // This is tricky with HMR and React strict mode.
      // The key prop in layout.tsx helps ensure full remounts on theme change.
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
        animatedObjectRef.current = null; // Nullify ref for next potential load
        console.log("ThreeScene: Animated object removed and disposed from scene.");
      }
      
      Object.values(lightsRef.current).forEach(light => {
        if (light) {
          sceneRef.current?.remove(light);
          // light.dispose(); // Most lights don't have a dispose method, removal is usually enough
        }
      });
      lightsRef.current = {};
      console.log("ThreeScene: Lights removed from scene.");


      // Renderer and scene are more persistent across re-renders of this component
      // due to being outside the key-driven remount of ThreeScene itself.
      // However, if ThreeScene is unmounted by its parent, this cleanup is vital.
      if (rendererRef.current) {
        if (rendererRef.current.domElement.parentNode === currentMount) { // Check parent before removing
            currentMount.removeChild(rendererRef.current.domElement);
            console.log("ThreeScene: Renderer DOM element removed.");
        }
        rendererRef.current.dispose();
        rendererRef.current = null;
        console.log("ThreeScene: Renderer disposed.");
      }
      
      // Scene contents are disposed, scene itself doesn't have a dispose method
      if (sceneRef.current) {
        // sceneRef.current.clear(); // another way to empty scene
        sceneRef.current = null; 
      }
      if (cameraRef.current) {
        cameraRef.current = null;
      }
      console.log("ThreeScene: Scene and camera refs nulled.");
    };
  }, [scrollPercentage, currentTheme]); // Dependencies that drive re-render/updates

  // The div `mountRef` points to will be styled by its className to be fixed and cover the viewport
  return <div ref={mountRef} className="fixed inset-0 -z-10 w-screen h-screen bg-transparent" />;
};

export default ThreeScene;

    