
'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';

interface ThreeSceneProps {
  scrollPercentage: number;
  currentTheme?: 'light' | 'dark';
}

const ThreeScene: React.FC<ThreeSceneProps> = ({ scrollPercentage, currentTheme = 'light' }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animatedObjectRef = useRef<THREE.Mesh | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  console.log(`ThreeScene: Component rendering/re-rendering. Theme: ${currentTheme}, Scroll: ${scrollPercentage.toFixed(2)}`);

  useEffect(() => {
    if (typeof window === 'undefined' || !mountRef.current) {
      console.warn('ThreeScene: Mount ref not available or window is undefined. Effect aborted.');
      return;
    }
    const currentMount = mountRef.current;
    console.log(`ThreeScene: useEffect triggered. Theme: ${currentTheme}, Scroll: ${scrollPercentage.toFixed(2)}`);

    // --- Initial check for mount dimensions ---
    if (currentMount.clientWidth === 0 || currentMount.clientHeight === 0) {
      console.warn(
        `ThreeScene: Mount dimensions are zero (${currentMount.clientWidth}x${currentMount.clientHeight}). Renderer might not initialize correctly yet.`
      );
      // We'll let it proceed, as resize handler might fix it
    }

    // --- Initialize Scene, Camera, Renderer ---
    // This setup happens once per component instance (forced by key prop on theme change)
    console.log('ThreeScene: Initializing Renderer, Scene, Camera, Lights...');
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      currentMount.clientWidth / Math.max(1, currentMount.clientHeight), // Avoid division by zero
      0.1,
      1000
    );
    camera.position.z = 3;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(currentMount.clientWidth, Math.max(1, currentMount.clientHeight)); // Avoid zero height
    rendererRef.current = renderer;
    
    // Clear previous canvas if any, then append new one
    while (currentMount.firstChild) {
        currentMount.removeChild(currentMount.firstChild);
    }
    currentMount.appendChild(renderer.domElement);
    console.log('ThreeScene: Renderer DOM element appended.');

    // --- Create Object and Lights (Theme Dependent) ---
    const geometry = new THREE.BoxGeometry(1, 1, 1); // Simple cube for now
    const material = new THREE.MeshStandardMaterial(); // Color set below
    const cube = new THREE.Mesh(geometry, material);
    animatedObjectRef.current = cube;
    scene.add(cube);
    console.log('ThreeScene: Cube added to scene.');

    const ambientLight = new THREE.AmbientLight(); // Color/intensity set below
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(); // Color/intensity/position set below
    scene.add(pointLight);
    console.log('ThreeScene: Lights added to scene.');

    // --- Apply Theme Specifics and Scroll Transformations ---
    if (currentTheme === 'dark') {
      scene.background = new THREE.Color().setHSL(270 / 360, 0.40, 0.10); // Dark Violet
      material.color.set(0x9370DB); // Medium Purple
      ambientLight.color.set(0x404040);
      ambientLight.intensity = 1;
      pointLight.color.set(0x9370DB);
      pointLight.intensity = 2;
      pointLight.position.set(1, 2, 2);
      console.log('ThreeScene: Dark theme properties applied.');
    } else { // Light theme
      scene.background = new THREE.Color().setHSL(275 / 360, 0.80, 0.97); // Very light lavender
      material.color.set(0x00ff00); // Green
      ambientLight.color.set(0xffffff);
      ambientLight.intensity = 1.5;
      pointLight.color.set(0xffffff);
      pointLight.intensity = 1;
      pointLight.position.set(-1, 2, 2);
      console.log('ThreeScene: Light theme properties applied.');
    }
    material.needsUpdate = true;
    
    if (animatedObjectRef.current) {
      animatedObjectRef.current.rotation.x = scrollPercentage * Math.PI;
      animatedObjectRef.current.rotation.y = scrollPercentage * Math.PI * 0.5;
      animatedObjectRef.current.position.y = (scrollPercentage - 0.5) * 2; // Move up/down with scroll
      animatedObjectRef.current.scale.setScalar(1 + scrollPercentage * 0.5);
      animatedObjectRef.current.visible = true;
      console.log(`ThreeScene: Object transform updated. Visible: ${animatedObjectRef.current.visible}`);
    } else {
        console.error("ThreeScene: Animated object is null after creation!");
    }


    // --- Animation Loop ---
    const animate = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) {
        console.warn("ThreeScene: Animate called but refs are null. Stopping loop.");
        return;
      }
      animationFrameIdRef.current = requestAnimationFrame(animate);
      // Dynamic object updates can go here if not tied to scrollPercentage
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };
    console.log('ThreeScene: Starting animation loop.');
    animate();


    // --- Resize Handler ---
    const handleResize = () => {
      console.log("ThreeScene: Resize event detected.");
      if (mountRef.current && rendererRef.current && cameraRef.current) {
        const width = mountRef.current.clientWidth;
        const height = Math.max(1, mountRef.current.clientHeight); // Ensure height is at least 1
        if (width > 0 && height > 0) {
          cameraRef.current.aspect = width / height;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(width, height);
          console.log(`ThreeScene: Resized to ${width}x${height}`);
        } else {
          console.warn(`ThreeScene: Resize handler called with zero/invalid dimensions (${width}x${height})`);
        }
      } else {
        console.warn("ThreeScene: Resize handler - refs not available.");
      }
    };
    window.addEventListener('resize', handleResize);
    if (currentMount.clientWidth === 0 || currentMount.clientHeight === 0) {
        console.log('ThreeScene: Manually calling handleResize due to initial zero dimensions.');
        handleResize(); // Call once to set initial size if mountRef was 0x0
    }


    // --- Cleanup ---
    return () => {
      console.log(`ThreeScene: Cleanup for theme: ${currentTheme}.`);
      window.removeEventListener('resize', handleResize);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
        console.log('ThreeScene: Animation loop stopped.');
      }
      if (rendererRef.current) {
        // rendererRef.current.dispose(); // Dispose can cause issues if not managed carefully with React's lifecycle
        if (rendererRef.current.domElement.parentNode) {
            rendererRef.current.domElement.parentNode.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current = null;
        console.log('ThreeScene: Renderer DOM element removed.');
      }
       // More thorough cleanup of scene objects
      if (sceneRef.current) {
        sceneRef.current.traverse(object => {
          if (object instanceof THREE.Mesh) {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
              } else {
                object.material.dispose();
              }
            }
          }
        });
        sceneRef.current.clear(); // Removes all children
        sceneRef.current = null;
      }
      cameraRef.current = null;
      animatedObjectRef.current = null; // Clear the ref to the object
      console.log('ThreeScene: Scene and objects cleaned up.');
    };
  // Main dependencies: ensure re-run on theme or scroll change
  }, [currentTheme, scrollPercentage]); 

  // The className here ensures the div takes up space and is positioned behind other content.
  return <div ref={mountRef} className="fixed inset-0 -z-10 w-screen h-screen" />;
};

export default ThreeScene;
