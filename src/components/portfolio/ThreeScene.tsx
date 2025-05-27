
'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface ThreeSceneProps {
  scrollPercentage: number;
  currentTheme: 'light' | 'dark'; // Still accept theme to trigger remount via key in layout
}

const ThreeScene: React.FC<ThreeSceneProps> = ({ scrollPercentage, currentTheme }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  // Keep refs for cleanup, even if scene/camera/renderer are local to useEffect
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cubeRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    console.log(`%cThreeScene: useEffect triggered. Theme: ${currentTheme}, Scroll: ${scrollPercentage.toFixed(2)}`, "color: blue; font-weight: bold;");
    
    if (!mountRef.current) {
      console.error("ThreeScene: Mount ref is null. Aborting setup.");
      return;
    }
    const currentMount = mountRef.current;

    const mountWidth = currentMount.clientWidth;
    const mountHeight = currentMount.clientHeight;
    console.log(`ThreeScene: Mount dimensions: ${mountWidth}px x ${mountHeight}px`);

    if (mountWidth === 0 || mountHeight === 0) {
      console.warn("ThreeScene: Mount dimensions are zero. Renderer will use fallback size. Check CSS for the mount point.");
    }

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdddddd); // Consistent light gray background
    sceneRef.current = scene;
    console.log("ThreeScene: Scene created with light gray background.");

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      (mountWidth > 0 && mountHeight > 0) ? mountWidth / mountHeight : 1, // Aspect ratio
      0.1, // Near clipping plane
      1000 // Far clipping plane
    );
    camera.position.z = 2; // Move camera back a bit
    cameraRef.current = camera;
    console.log("ThreeScene: Camera created and positioned.");

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    // Use fallback size if mount dimensions are zero, otherwise use actual dimensions
    renderer.setSize(mountWidth > 0 ? mountWidth : 300, mountHeight > 0 ? mountHeight : 150);
    rendererRef.current = renderer;

    // Clear previous canvas if any and append new one
    currentMount.innerHTML = ''; 
    currentMount.appendChild(renderer.domElement);
    console.log("ThreeScene: Renderer initialized and appended to DOM. Canvas size:", renderer.getSize(new THREE.Vector2()));

    // Object
    const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5); // Simple cube
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Bright red
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    cubeRef.current = cube;
    console.log("ThreeScene: Red cube created and added to scene.");
    
    // Log scene children
    // console.log("ThreeScene: Scene children:", scene.children);

    // Animation loop
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      cube.rotation.x += 0.005;
      cube.rotation.y += 0.005;
      renderer.render(scene, camera);
    };
    
    if (mountWidth > 0 && mountHeight > 0) {
        animate();
        console.log("ThreeScene: Animation loop started.");
    } else {
        console.warn("ThreeScene: Animation loop NOT started due to zero mount dimensions. Will attempt on resize.");
    }


    // Resize handler
    const handleResize = () => {
      if (mountRef.current && rendererRef.current && cameraRef.current) {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        console.log(`ThreeScene: Resize event. New dimensions: ${width}px x ${height}px`);
        if (width > 0 && height > 0) {
          cameraRef.current.aspect = width / height;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(width, height);
          console.log("ThreeScene: Camera and renderer resized.");
          // If animation wasn't started due to initial zero-size, try starting it now.
          if (!animationFrameIdRef.current) {
            animate(); // Call the outer scope animate
            console.log("ThreeScene: Animation loop started on resize.");
          }
        } else {
          console.warn("ThreeScene: Resize handler - zero dimensions detected.");
        }
      }
    };
    window.addEventListener('resize', handleResize);
    // Initial call to set size correctly if dimensions were initially available
    if (mountWidth > 0 && mountHeight > 0) {
        handleResize(); 
    }


    // Cleanup function
    return () => {
      console.log(`%cThreeScene: Cleanup for theme: ${currentTheme}`, "color: red; font-weight: bold;");
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
        console.log("ThreeScene: Animation frame cancelled.");
      }
      window.removeEventListener('resize', handleResize);
      console.log("ThreeScene: Resize listener removed.");

      if (cubeRef.current) {
        if (cubeRef.current.geometry) cubeRef.current.geometry.dispose();
        if (cubeRef.current.material) {
          // MeshBasicMaterial might not have a complex material array
          if (Array.isArray(cubeRef.current.material)) {
            cubeRef.current.material.forEach(m => m.dispose());
          } else {
            (cubeRef.current.material as THREE.Material).dispose();
          }
        }
        if(sceneRef.current) sceneRef.current.remove(cubeRef.current);
        cubeRef.current = null;
        console.log("ThreeScene: Cube disposed and removed from scene.");
      }
      
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
      console.log("ThreeScene: Scene and Camera refs nulled. Cleanup complete.");
    };
  }, [currentTheme, scrollPercentage]); // scrollPercentage is kept for consistency with props, currentTheme ensures re-run on key change

  return <div ref={mountRef} className="fixed inset-0 -z-10 w-screen h-screen bg-transparent" />;
};

export default ThreeScene;
