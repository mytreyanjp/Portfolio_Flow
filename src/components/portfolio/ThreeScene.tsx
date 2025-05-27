
'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';

interface ThreeSceneProps {
  scrollPercentage: number;
  currentTheme: 'light' | 'dark'; // Still accepting this, though not using it for geometry/keyframes in this step
}

// Keyframes for the cube's animation
const cubeKeyframes = [
  { scroll: 0, position: [0, -0.5, 0], rotation: [0, 0, 0], scale: [0.8, 0.8, 0.8] },
  { scroll: 0.25, position: [0.5, 0, 0], rotation: [0, Math.PI / 2, 0], scale: [1, 1, 1] },
  { scroll: 0.5, position: [0, 0.5, 0], rotation: [Math.PI / 2, Math.PI, Math.PI / 2], scale: [1.2, 1.2, 1.2] },
  { scroll: 0.75, position: [-0.5, 0, 0], rotation: [Math.PI, Math.PI * 1.5, Math.PI], scale: [1, 1, 1] },
  { scroll: 1, position: [0, -0.5, 0], rotation: [Math.PI * 2, Math.PI * 2, Math.PI * 2], scale: [0.8, 0.8, 0.8] },
];

// Helper function to interpolate between keyframes
const interpolateKeyframes = (keyframes: typeof cubeKeyframes, scroll: number) => {
  const current = {
    position: [...keyframes[0].position] as [number, number, number],
    rotation: [...keyframes[0].rotation] as [number, number, number],
    scale: [...keyframes[0].scale] as [number, number, number],
  };

  for (let i = 0; i < keyframes.length - 1; i++) {
    const kf1 = keyframes[i];
    const kf2 = keyframes[i + 1];

    if (scroll >= kf1.scroll && scroll <= kf2.scroll) {
      const t = (scroll - kf1.scroll) / (kf2.scroll - kf1.scroll); // Normalized time between kf1 and kf2

      for (let j = 0; j < 3; j++) {
        current.position[j] = kf1.position[j] + (kf2.position[j] - kf1.position[j]) * t;
        current.rotation[j] = kf1.rotation[j] + (kf2.rotation[j] - kf1.rotation[j]) * t;
        current.scale[j] = kf1.scale[j] + (kf2.scale[j] - kf1.scale[j]) * t;
      }
      break;
    } else if (scroll > keyframes[keyframes.length - 1].scroll) {
      // If scroll is past the last keyframe, snap to last keyframe state
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
  const animatedObjectRef = useRef<THREE.Mesh | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lightsRef = useRef<{ ambientLight?: THREE.AmbientLight; directionalLight?: THREE.DirectionalLight }>({});


  useEffect(() => {
    console.log(`%cThreeScene: useEffect triggered. Theme: ${currentTheme}, Scroll: ${scrollPercentage.toFixed(2)}`, "color: blue; font-weight: bold;");

    if (!mountRef.current) {
      console.error("ThreeScene: Mount ref is null. Aborting setup.");
      return;
    }
    const currentMount = mountRef.current;

    // Initialize core Three.js objects if they don't exist
    if (!sceneRef.current) {
      sceneRef.current = new THREE.Scene();
      console.log("ThreeScene: Scene created.");
    }
    if (!cameraRef.current) {
      cameraRef.current = new THREE.PerspectiveCamera(75, 1, 0.1, 1000); // Aspect ratio set by renderer
      cameraRef.current.position.z = 2;
      console.log("ThreeScene: Camera created.");
    }
    if (!rendererRef.current) {
      rendererRef.current = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      rendererRef.current.setPixelRatio(window.devicePixelRatio);
      currentMount.appendChild(rendererRef.current.domElement);
      console.log("ThreeScene: Renderer initialized and appended to DOM.");
    }
    
    rendererRef.current.setClearAlpha(0); // Ensure transparent background

    const mountWidth = currentMount.clientWidth;
    const mountHeight = currentMount.clientHeight;

    if (mountWidth > 0 && mountHeight > 0) {
      rendererRef.current.setSize(mountWidth, mountHeight);
      cameraRef.current.aspect = mountWidth / mountHeight;
      cameraRef.current.updateProjectionMatrix();
      console.log(`ThreeScene: Renderer and camera sized to: ${mountWidth}x${mountHeight}`);
    } else {
      console.warn("ThreeScene: Mount dimensions are zero. Renderer will use fallback size or might not render correctly. Check CSS for the mount point.");
      rendererRef.current.setSize(300, 150); // Fallback size
      cameraRef.current.aspect = 300 / 150;
      cameraRef.current.updateProjectionMatrix();
    }
    
    // Cleanup previous object if it exists
    if (animatedObjectRef.current) {
      if (animatedObjectRef.current.geometry) animatedObjectRef.current.geometry.dispose();
      if (animatedObjectRef.current.material) {
        if (Array.isArray(animatedObjectRef.current.material)) {
          animatedObjectRef.current.material.forEach(m => m.dispose());
        } else {
          (animatedObjectRef.current.material as THREE.Material).dispose();
        }
      }
      sceneRef.current.remove(animatedObjectRef.current);
      animatedObjectRef.current = null;
      console.log("ThreeScene: Previous animated object removed and disposed.");
    }

    // Create the light purple cube
    const geometry = new THREE.BoxGeometry(0.7, 0.7, 0.7); // Slightly smaller cube
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(270 / 360, 0.65, 0.75), // Light purple
      metalness: 0.3,
      roughness: 0.6,
    });
    animatedObjectRef.current = new THREE.Mesh(geometry, material);
    sceneRef.current.add(animatedObjectRef.current);
    console.log("ThreeScene: Light purple cube (MeshStandardMaterial) created and added to scene.");

    // Lighting setup
    if (lightsRef.current.ambientLight) sceneRef.current.remove(lightsRef.current.ambientLight);
    if (lightsRef.current.directionalLight) sceneRef.current.remove(lightsRef.current.directionalLight);
    
    lightsRef.current.ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Softer ambient
    sceneRef.current.add(lightsRef.current.ambientLight);

    lightsRef.current.directionalLight = new THREE.DirectionalLight(0xffffff, 1.2); // Brighter directional
    lightsRef.current.directionalLight.position.set(1, 1, 1);
    sceneRef.current.add(lightsRef.current.directionalLight);
    console.log("ThreeScene: Lights configured.");


    // Animation loop
    const animate = () => {
      if (!animatedObjectRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
        return;
      }
      animationFrameIdRef.current = requestAnimationFrame(animate);

      const interpolated = interpolateKeyframes(cubeKeyframes, scrollPercentage);
      
      animatedObjectRef.current.position.set(...interpolated.position);
      animatedObjectRef.current.rotation.set(...interpolated.rotation);
      animatedObjectRef.current.scale.set(...interpolated.scale);

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    if (mountWidth > 0 && mountHeight > 0) {
      animate();
      console.log("ThreeScene: Animation loop started.");
    } else {
      console.warn("ThreeScene: Animation loop NOT started due to zero mount dimensions. Will attempt on resize.");
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
           if (!animationFrameIdRef.current && animatedObjectRef.current) { 
            animate();
            console.log("ThreeScene: Animation loop started on resize.");
          }
        }
      }
    };
    window.addEventListener('resize', handleResize);
    
    if (mountWidth > 0 && mountHeight > 0) {
        handleResize(); // Initial call
    }

    // Cleanup
    return () => {
      console.log(`%cThreeScene: useEffect cleanup for theme: ${currentTheme}`, "color: red; font-weight: bold;");
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
        console.log("ThreeScene: Animation frame cancelled.");
      }
      window.removeEventListener('resize', handleResize);
      console.log("ThreeScene: Resize listener removed.");

      // Only dispose renderer and remove its DOM element if the whole ThreeScene component is unmounting
      // This is handled by React's key prop mechanism in RootLayout
      // However, if we were NOT using key prop for remount, we would do more cleanup here.
      // For now, we ensure object is cleaned up if this specific effect re-runs without a full remount:
      if (animatedObjectRef.current) {
        console.log("ThreeScene: Disposing animated object from cleanup (if not full remount).");
        if (animatedObjectRef.current.geometry) animatedObjectRef.current.geometry.dispose();
        if (animatedObjectRef.current.material) {
           if (Array.isArray(animatedObjectRef.current.material)) {
              animatedObjectRef.current.material.forEach(m => m.dispose());
          } else {
              (animatedObjectRef.current.material as THREE.Material).dispose();
          }
        }
        if(sceneRef.current) sceneRef.current.remove(animatedObjectRef.current);
        animatedObjectRef.current = null;
      }
      if (lightsRef.current.ambientLight && sceneRef.current) sceneRef.current.remove(lightsRef.current.ambientLight);
      if (lightsRef.current.directionalLight && sceneRef.current) sceneRef.current.remove(lightsRef.current.directionalLight);
      // lightsRef.current.ambientLight?.dispose(); // Lights don't have dispose method
      // lightsRef.current.directionalLight?.dispose();
      lightsRef.current = {};


      // If the component is truly unmounting (e.g. navigating away or key change)
      // It might be safer to clean up renderer and scene refs here in some scenarios
      // but with key-based remounts in layout.tsx, this should be sufficient.
      // If renderer was created in THIS effect, it would be cleaned here:
      // if (rendererRef.current && currentMount && rendererRef.current.domElement.parentNode === currentMount) {
      //   currentMount.removeChild(rendererRef.current.domElement);
      // }
      // rendererRef.current?.dispose();
      // rendererRef.current = null;
      // sceneRef.current = null; // To allow re-creation
      // cameraRef.current = null;

      console.log("ThreeScene: Partial cleanup complete.");
    };

  // Dependencies: scrollPercentage for animation updates.
  // currentTheme is included because if it changes, object/keyframes might change,
  // so the effect should re-run to apply new visuals.
  // The key prop in layout.tsx handles full remount for fundamental theme changes.
  }, [scrollPercentage, currentTheme]); 

  return <div ref={mountRef} className="fixed inset-0 -z-10 w-screen h-screen bg-transparent" />;
};

export default ThreeScene;

    