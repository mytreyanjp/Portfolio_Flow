
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

  useEffect(() => {
    if (typeof window === 'undefined' || !mountRef.current) {
      console.warn('ThreeScene: Mount ref not available or window is undefined.');
      return;
    }
    const currentMount = mountRef.current;
    console.log(`ThreeScene: useEffect triggered. Theme: ${currentTheme}, Scroll: ${scrollPercentage.toFixed(2)}`);

    // --- Initial check for mount dimensions ---
    if (currentMount.clientWidth === 0 || currentMount.clientHeight === 0) {
      console.warn(
        `ThreeScene: Mount dimensions are zero (${currentMount.clientWidth}x${currentMount.clientHeight}). Renderer might not initialize correctly yet.`
      );
      // We'll let it proceed, as resize handler might fix it, but this is a common issue.
    }

    // --- Initialize Scene, Camera, Renderer (if not already initialized) ---
    if (!rendererRef.current) {
      console.log('ThreeScene: Initializing Renderer, Scene, Camera, Lights...');
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(
        75,
        currentMount.clientWidth / currentMount.clientHeight || 1, // Fallback aspect
        0.1,
        1000
      );
      camera.position.z = 3; // Position camera to see object at origin
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
      rendererRef.current = renderer;
      currentMount.appendChild(renderer.domElement);

      // Simple cube for debugging
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x111111 }); // Bright green
      const cube = new THREE.Mesh(geometry, material);
      animatedObjectRef.current = cube;
      scene.add(cube);
      console.log('ThreeScene: Cube added to scene.');

      // Basic Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Strong ambient
      scene.add(ambientLight);
      const pointLight = new THREE.PointLight(0xffffff, 1, 100);
      pointLight.position.set(2, 2, 2);
      scene.add(pointLight);
      console.log('ThreeScene: Lights added.');
    }

    // --- Update existing elements based on props ---
    const scene = sceneRef.current!;
    const camera = cameraRef.current!;
    const renderer = rendererRef.current!;
    const object = animatedObjectRef.current!;

    // Theme-specific background color
    if (currentTheme === 'dark') {
      scene.background = new THREE.Color().setHSL(270 / 360, 0.40, 0.10); // Dark Violet
      if (object) object.material.color.set(0x9370DB); // Medium Purple for dark theme object
    } else {
      scene.background = new THREE.Color().setHSL(275 / 360, 0.80, 0.97); // Very light lavender
      if (object) object.material.color.set(0x00ff00); // Green for light theme object
    }
    if (object && (object.material as THREE.MeshStandardMaterial).needsUpdate) {
        (object.material as THREE.MeshStandardMaterial).needsUpdate = true;
    }


    console.log(`ThreeScene: Scene background set for ${currentTheme}`);

    // Simple rotation based on scroll for debugging visibility
    if (object) {
      object.rotation.x = scrollPercentage * Math.PI;
      object.rotation.y = scrollPercentage * Math.PI * 0.5;
      object.visible = true; // Ensure it's visible
      console.log(`ThreeScene: Object rotation updated, visible: ${object.visible}`);
    } else {
      console.error("ThreeScene: Animated object is null!");
    }


    // --- Animation Loop ---
    const animate = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
      animationFrameIdRef.current = requestAnimationFrame(animate);
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };
    // Start animation loop if not already running
    if (animationFrameIdRef.current === null) {
        console.log('ThreeScene: Starting animation loop.');
        animate();
    }


    // --- Resize Handler ---
    const handleResize = () => {
      if (mountRef.current && rendererRef.current && cameraRef.current) {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        if (width > 0 && height > 0) {
          cameraRef.current.aspect = width / height;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(width, height);
          console.log(`ThreeScene: Resized to ${width}x${height}`);
        } else {
          console.warn(`ThreeScene: Resize handler called with zero dimensions (${width}x${height})`);
        }
      }
    };
    window.addEventListener('resize', handleResize);
    // Call resize initially to ensure dimensions are set if mountRef was initially 0x0
    if (currentMount.clientWidth > 0 && currentMount.clientHeight > 0) {
        // Already good
    } else {
        console.log('ThreeScene: Manually calling handleResize due to initial zero dimensions.');
        handleResize();
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
      // Don't dispose renderer/scene here if we want it to persist across simple prop changes
      // The key={resolvedTheme} on Layout.tsx will handle full unmount/remount for theme changes.
      // However, if this useEffect itself re-runs due to other prop changes (like scrollPercentage),
      // we don't want to tear down everything.
      // For full teardown, rely on the component unmounting.
    };
  }, [currentTheme, scrollPercentage]); // Keep dependencies minimal for this debugging version

  return <div ref={mountRef} className="fixed inset-0 -z-10 w-screen h-screen" />;
};

export default ThreeScene;
