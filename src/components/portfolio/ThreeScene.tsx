
'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';

interface ThreeSceneProps {
  scrollPercentage: number;
  currentTheme: 'light' | 'dark'; // Will be used later for theme-specific colors
}

// Keyframes for the Cube
const cubeKeyframes = [
  { scroll: 0, position: [0, -0.2, 0], rotation: [0, 0, Math.PI / 4], scale: [0.7, 0.7, 0.7] },
  { scroll: 0.25, position: [0.3, 0.1, 0], rotation: [Math.PI / 8, Math.PI / 3, Math.PI / 2], scale: [0.85, 0.85, 0.85] },
  { scroll: 0.5, position: [0, 0.3, 0], rotation: [Math.PI / 4, Math.PI / 1.5, Math.PI * 0.75], scale: [1, 1, 1] },
  { scroll: 0.75, position: [-0.3, 0.1, 0], rotation: [Math.PI / 8, Math.PI, Math.PI], scale: [0.85, 0.85, 0.85] },
  { scroll: 1, position: [0, -0.2, 0], rotation: [0, Math.PI * 2, Math.PI * 1.25], scale: [0.7, 0.7, 0.7] },
];

const interpolateKeyframes = (
    keyframes: typeof cubeKeyframes, 
    scroll: number
  ) => {
  // Default to first keyframe
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
      break; // Found the segment
    } else if (scroll > keyframes[keyframes.length - 1].scroll) { // If scroll is past the last keyframe
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
  const cubeRef = useRef<THREE.Mesh | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lightsRef = useRef<{ ambientLight?: THREE.AmbientLight; pointLight?: THREE.PointLight }>({});


  useEffect(() => {
    console.log(`ThreeScene: useEffect triggered. Current theme: ${currentTheme}, Scroll: ${scrollPercentage.toFixed(2)}`);
    if (!mountRef.current) {
      console.error("ThreeScene: Mount ref is null. Aborting setup.");
      return;
    }
    const currentMount = mountRef.current;

    // Initialize Scene, Camera, Renderer if they don't exist
    if (!sceneRef.current) {
      sceneRef.current = new THREE.Scene();
      console.log("ThreeScene: Scene created.");
    }
    if (!cameraRef.current) {
      cameraRef.current = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
      cameraRef.current.position.z = 2;
      console.log("ThreeScene: Camera created.");
    }
    if (!rendererRef.current) {
      rendererRef.current = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      rendererRef.current.setPixelRatio(window.devicePixelRatio);
      currentMount.appendChild(rendererRef.current.domElement);
      console.log("ThreeScene: Renderer initialized and appended.");
    }
    rendererRef.current.setClearAlpha(0); // Make background transparent

    const mountWidth = currentMount.clientWidth;
    const mountHeight = currentMount.clientHeight;

    if (mountWidth > 0 && mountHeight > 0) {
        rendererRef.current.setSize(mountWidth, mountHeight);
        cameraRef.current.aspect = mountWidth / mountHeight;
        cameraRef.current.updateProjectionMatrix();
        console.log(`ThreeScene: Renderer and camera sized to: ${mountWidth}x${mountHeight}`);
    } else {
        console.warn("ThreeScene: Mount dimensions are zero. Using fallback 300x150 for renderer.");
        rendererRef.current.setSize(300, 150); // Fallback size
        cameraRef.current.aspect = 300/150;
        cameraRef.current.updateProjectionMatrix();
    }
    
    // Cube setup
    if (!cubeRef.current) {
      const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8); // Cube
      // Light purple color for the cube, works with light theme
      const material = new THREE.MeshStandardMaterial({ 
        color: new THREE.Color().setHSL(270 / 360, 0.65, 0.75), // Light Purple
        metalness: 0.3,
        roughness: 0.6,
      });
      cubeRef.current = new THREE.Mesh(geometry, material);
      sceneRef.current.add(cubeRef.current);
      console.log("ThreeScene: Light purple cube created and added.");
    }

    // Lighting setup
    if (!lightsRef.current.ambientLight) {
        lightsRef.current.ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Soft white light
        sceneRef.current.add(lightsRef.current.ambientLight);
        console.log("ThreeScene: Ambient light added.");
    }
    if(!lightsRef.current.pointLight) {
        lightsRef.current.pointLight = new THREE.PointLight(0xffffff, 1, 100);
        lightsRef.current.pointLight.position.set(2, 2, 2);
        sceneRef.current.add(lightsRef.current.pointLight);
        console.log("ThreeScene: Point light added.");
    }


    // Animation loop
    const animate = () => {
      if (!cubeRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) {
        console.warn("ThreeScene: Animate called but refs not ready.");
        animationFrameIdRef.current = requestAnimationFrame(animate); // Keep trying if refs not ready
        return;
      }
      animationFrameIdRef.current = requestAnimationFrame(animate);

      const interpolated = interpolateKeyframes(cubeKeyframes, scrollPercentage);
      cubeRef.current.position.set(...interpolated.position);
      cubeRef.current.rotation.set(...interpolated.rotation);
      cubeRef.current.scale.set(...interpolated.scale);

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    if (mountWidth > 0 && mountHeight > 0) { // Only start animation if canvas has dimensions
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
           if (!animationFrameIdRef.current && cubeRef.current) { // If animation wasn't running
            animate(); // restart animation if it wasn't running and object exists
            console.log("ThreeScene: Animation loop (re)started on resize.");
          }
        } else {
            console.warn("ThreeScene: Resize event, but new dimensions are zero.");
        }
      }
    };
    window.addEventListener('resize', handleResize);
    if (mountWidth > 0 && mountHeight > 0) { // Call once if dimensions are already good
        handleResize(); // Initial size update
    }

    return () => {
      console.log("ThreeScene: useEffect cleanup initiated.");
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
        console.log("ThreeScene: Animation frame cancelled.");
      }
      window.removeEventListener('resize', handleResize);
      console.log("ThreeScene: Resize listener removed.");

      // More thorough cleanup for when the component instance is fully unmounted by React
      // This is important when the `key` prop changes in RootLayout
      if (cubeRef.current) {
        if (cubeRef.current.geometry) cubeRef.current.geometry.dispose();
        if (cubeRef.current.material) {
            if (Array.isArray(cubeRef.current.material)) {
                cubeRef.current.material.forEach(m => m.dispose());
            } else {
                (cubeRef.current.material as THREE.Material).dispose();
            }
        }
        if(sceneRef.current) sceneRef.current.remove(cubeRef.current);
        cubeRef.current = null;
        console.log("ThreeScene: Cube disposed and removed.");
      }
      
      if(lightsRef.current.ambientLight && sceneRef.current) {
        sceneRef.current.remove(lightsRef.current.ambientLight);
        lightsRef.current.ambientLight.dispose(); // AmbientLight doesn't have dispose in older three, but good practice
        lightsRef.current.ambientLight = undefined;
         console.log("ThreeScene: Ambient light removed.");
      }
      if(lightsRef.current.pointLight && sceneRef.current) {
        sceneRef.current.remove(lightsRef.current.pointLight);
        lightsRef.current.pointLight.dispose();
        lightsRef.current.pointLight = undefined;
        console.log("ThreeScene: Point light removed.");
      }
      
      if (rendererRef.current && rendererRef.current.domElement.parentNode === currentMount) {
         currentMount.removeChild(rendererRef.current.domElement);
         console.log("ThreeScene: Renderer DOM element removed.");
      }
      rendererRef.current?.dispose();
      rendererRef.current = null;
      sceneRef.current = null; // Scene is disposed by renderer.dispose() typically
      cameraRef.current = null; // Camera doesn't have dispose method.
      console.log("ThreeScene: Renderer, Scene, Camera refs nulled. Full cleanup complete.");
    };
  }, [scrollPercentage, currentTheme]); // scrollPercentage re-triggers for animation, currentTheme for remount logic from layout

  return <div ref={mountRef} className="fixed inset-0 -z-10 w-screen h-screen bg-transparent" />;
};

export default ThreeScene;
