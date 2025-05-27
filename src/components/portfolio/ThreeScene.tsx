
'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';

interface ThreeSceneProps {
  scrollPercentage: number;
  currentTheme: 'light' | 'dark';
}

const ThreeScene: React.FC<ThreeSceneProps> = ({ scrollPercentage, currentTheme }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  
  // Refs for Three.js objects that need to persist across renders of the useEffect hook
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animatedObjectRef = useRef<THREE.Mesh | null>(null); // For the cube/cone

  console.log(`%cThreeScene: Component rendering/re-rendering. Theme: ${currentTheme}, Scroll: ${scrollPercentage.toFixed(2)}`, "color: orange;");

  useEffect(() => {
    console.log(`%cThreeScene: useEffect triggered. Theme: ${currentTheme}, Scroll: ${scrollPercentage.toFixed(2)}`, "color: blue; font-weight: bold;");

    if (!mountRef.current) {
      console.error("ThreeScene: Mount ref is null. Aborting setup.");
      return;
    }
    const currentMount = mountRef.current;

    // --- Scene, Camera, Renderer Setup (once per mount unless they also depend on theme deeply) ---
    // Scene
    if (!sceneRef.current) {
      sceneRef.current = new THREE.Scene();
      console.log("ThreeScene: Scene created.");
    }
    // Camera
    if (!cameraRef.current) {
      cameraRef.current = new THREE.PerspectiveCamera(75, 1, 0.1, 1000); // Aspect ratio will be set by renderer size
      cameraRef.current.position.z = 2;
      console.log("ThreeScene: Camera created.");
    }
    // Renderer
    if (!rendererRef.current) {
      rendererRef.current = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // alpha: true for transparent background
      rendererRef.current.setPixelRatio(window.devicePixelRatio);
      currentMount.appendChild(rendererRef.current.domElement);
      console.log("ThreeScene: Renderer initialized and appended to DOM.");
    }

    // Ensure dimensions are set
    const mountWidth = currentMount.clientWidth;
    const mountHeight = currentMount.clientHeight;
    console.log(`ThreeScene: Mount dimensions: ${mountWidth}px x ${mountHeight}px`);

    if (mountWidth > 0 && mountHeight > 0) {
      rendererRef.current.setSize(mountWidth, mountHeight);
      cameraRef.current.aspect = mountWidth / mountHeight;
      cameraRef.current.updateProjectionMatrix();
    } else {
      console.warn("ThreeScene: Mount dimensions are zero. Renderer will use fallback size or might not render correctly. Check CSS for the mount point.");
      // Use a small fallback if dimensions are truly zero, just to avoid Three.js errors
      rendererRef.current.setSize(300, 150);
      cameraRef.current.aspect = 300 / 150;
      cameraRef.current.updateProjectionMatrix();
    }
    
    // --- Theme specific settings and Object Creation ---
    // Clear previous object if it exists
    if (animatedObjectRef.current) {
      console.log("ThreeScene: Removing previous animated object from scene and disposing resources.");
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

    // Radically simplified object: always a red cube
    const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Bright red
    animatedObjectRef.current = new THREE.Mesh(geometry, material);
    if(sceneRef.current) sceneRef.current.add(animatedObjectRef.current);
    console.log("ThreeScene: Red cube (MeshBasicMaterial) created and added to scene.");

    // Scene background (transparent for simplicity)
    if(rendererRef.current) rendererRef.current.setClearAlpha(0); // Make background transparent
    if(sceneRef.current) sceneRef.current.background = null; // Ensure no explicit background color set on scene
    console.log("ThreeScene: Scene background set to transparent.");


    // --- Animation Loop ---
    const animate = () => {
      if (!animatedObjectRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) {
        // console.warn("ThreeScene: Animate loop called but refs are missing."); // Can be noisy
        animationFrameIdRef.current = requestAnimationFrame(animate); // Keep trying
        return;
      }
      animationFrameIdRef.current = requestAnimationFrame(animate);
      
      // Simple rotation based on scroll
      animatedObjectRef.current.rotation.x = scrollPercentage * Math.PI * 2;
      animatedObjectRef.current.rotation.y = scrollPercentage * Math.PI * 2;

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

    // --- Resize Handler ---
    const handleResize = () => {
      if (mountRef.current && rendererRef.current && cameraRef.current) {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        // console.log(`ThreeScene: Resize event. New dimensions: ${width}px x ${height}px`); // Can be noisy
        if (width > 0 && height > 0) {
          rendererRef.current.setSize(width, height);
          cameraRef.current.aspect = width / height;
          cameraRef.current.updateProjectionMatrix();
          // console.log("ThreeScene: Camera and renderer resized.");
           // If animation wasn't started due to initial zero-size, try starting it now.
          if (!animationFrameIdRef.current && animatedObjectRef.current) { // Ensure object exists
            animate();
            console.log("ThreeScene: Animation loop started on resize.");
          }
        } else {
          // console.warn("ThreeScene: Resize handler - zero dimensions detected.");
        }
      }
    };
    window.addEventListener('resize', handleResize);
    
    // Initial call to set size correctly
    if (mountWidth > 0 && mountHeight > 0) {
        handleResize();
    }

    // --- Cleanup Function ---
    return () => {
      console.log(`%cThreeScene: useEffect cleanup triggered for theme: ${currentTheme}`, "color: red; font-weight: bold;");
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
        console.log("ThreeScene: Animation frame cancelled.");
      }
      window.removeEventListener('resize', handleResize);
      console.log("ThreeScene: Resize listener removed.");

      // Dispose of the animated object created in this effect instance
      if (animatedObjectRef.current) {
        console.log("ThreeScene: Disposing animated object from cleanup.");
        if (animatedObjectRef.current.geometry) animatedObjectRef.current.geometry.dispose();
        if (animatedObjectRef.current.material) {
            if (Array.isArray(animatedObjectRef.current.material)) {
                animatedObjectRef.current.material.forEach(m => m.dispose());
            } else {
                (animatedObjectRef.current.material as THREE.Material).dispose();
            }
        }
        if(sceneRef.current) sceneRef.current.remove(animatedObjectRef.current); // remove from current scene
        animatedObjectRef.current = null;
      }
      
      if (rendererRef.current) {
        if (rendererRef.current.domElement.parentNode === currentMount) {
          currentMount.removeChild(rendererRef.current.domElement);
          console.log("ThreeScene: Renderer DOM element removed from mount point.");
        }
        rendererRef.current.dispose();
        rendererRef.current = null; // Nullify the ref for the next instance
        console.log("ThreeScene: Renderer disposed.");
      }
      if(sceneRef.current) {
          sceneRef.current = null; // Nullify the ref for the next instance
          console.log("ThreeScene: Scene ref nulled.");
      }
      if(cameraRef.current) {
          cameraRef.current = null; // Nullify the ref for the next instance
          console.log("ThreeScene: Camera ref nulled.");
      }
      console.log("ThreeScene: Cleanup complete.");
    };
  }, [currentTheme, scrollPercentage]); // scrollPercentage ensures transformations update

  return <div ref={mountRef} className="fixed inset-0 -z-10 w-screen h-screen bg-transparent" />;
};

export default ThreeScene;
