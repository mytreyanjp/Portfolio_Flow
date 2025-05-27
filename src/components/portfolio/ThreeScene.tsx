
'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';

interface ThreeSceneProps {
  scrollPercentage: number;
  currentTheme: 'light' | 'dark';
}

interface Keyframe {
  scroll: number;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

// Keyframes for the Light Theme (Cone)
const lightThemeKeyframes: Keyframe[] = [
  { scroll: 0,    position: [0, -0.5, 0],    rotation: [0, 0, 0],                   scale: [0.8, 1.2, 0.8] },
  { scroll: 0.25, position: [0.5, 0, -0.5],  rotation: [Math.PI / 8, Math.PI / 6, 0], scale: [0.9, 1.4, 0.9] },
  { scroll: 0.5,  position: [0, 0.5, -1],    rotation: [Math.PI / 4, Math.PI / 3, Math.PI / 8], scale: [1, 1.5, 1] },
  { scroll: 0.75, position: [-0.5, 0, -0.5], rotation: [3 * Math.PI / 8, Math.PI / 2, Math.PI / 4], scale: [0.9, 1.4, 0.9] },
  { scroll: 1,    position: [0, -0.5, 0],    rotation: [Math.PI / 2, 2 * Math.PI / 3, 3 * Math.PI / 8], scale: [0.8, 1.2, 0.8] },
];

// Keyframes for the Dark Theme (Cube)
const darkThemeKeyframes: Keyframe[] = [
  { scroll: 0,    position: [0, 0, 0],       rotation: [0, 0, 0],                         scale: [1, 1, 1] },
  { scroll: 0.25, position: [-0.8, 0.5, -0.8], rotation: [0, Math.PI / 3, Math.PI / 6],   scale: [1.1, 1.1, 1.1] },
  { scroll: 0.5,  position: [0, 0, -1.5],    rotation: [Math.PI / 4, Math.PI / 2, Math.PI / 4], scale: [1.3, 1.3, 1.3] },
  { scroll: 0.75, position: [0.8, -0.5, -0.8], rotation: [Math.PI / 2, 2 * Math.PI / 3, Math.PI / 3], scale: [1.1, 1.1, 1.1] },
  { scroll: 1,    position: [0, 0, 0],       rotation: [Math.PI, Math.PI, Math.PI / 2], scale: [1, 1, 1] },
];

function interpolateKeyframes(scroll: number, keyframes: Keyframe[]): { position: THREE.Vector3; rotation: THREE.Euler; scale: THREE.Vector3 } {
  if (!keyframes || keyframes.length === 0) {
    return { position: new THREE.Vector3(0,0,0), rotation: new THREE.Euler(0,0,0), scale: new THREE.Vector3(1,1,1) };
  }
  if (scroll <= keyframes[0].scroll) return {
    position: new THREE.Vector3(...keyframes[0].position),
    rotation: new THREE.Euler(...keyframes[0].rotation as [number,number,number, (string | undefined)?]),
    scale: new THREE.Vector3(...keyframes[0].scale)
  };
  if (scroll >= keyframes[keyframes.length - 1].scroll) return {
    position: new THREE.Vector3(...keyframes[keyframes.length - 1].position),
    rotation: new THREE.Euler(...keyframes[keyframes.length - 1].rotation as [number,number,number, (string | undefined)?]),
    scale: new THREE.Vector3(...keyframes[keyframes.length - 1].scale)
  };

  let i = 0;
  while (keyframes[i + 1] && keyframes[i + 1].scroll < scroll) { i++; }
  const k1 = keyframes[i];
  const k2 = keyframes[i + 1];
  if (!k1 || !k2) return { position: new THREE.Vector3(0,0,0), rotation: new THREE.Euler(0,0,0), scale: new THREE.Vector3(1,1,1) };

  const t = (scroll - k1.scroll) / (k2.scroll - k1.scroll);
  const position = new THREE.Vector3().lerpVectors(new THREE.Vector3(...k1.position), new THREE.Vector3(...k2.position), t);
  const rotation = new THREE.Euler(
    k1.rotation[0] + (k2.rotation[0] - k1.rotation[0]) * t,
    k1.rotation[1] + (k2.rotation[1] - k1.rotation[1]) * t,
    k1.rotation[2] + (k2.rotation[2] - k1.rotation[2]) * t
  );
  const scale = new THREE.Vector3().lerpVectors(new THREE.Vector3(...k1.scale), new THREE.Vector3(...k2.scale), t);
  return { position, rotation, scale };
}

const ThreeScene: React.FC<ThreeSceneProps> = ({ scrollPercentage, currentTheme }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const animatedObjectRef = useRef<THREE.Mesh | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  const objectGeometry = useMemo(() => {
    console.log("ThreeScene: Recalculating objectGeometry for theme:", currentTheme);
    return currentTheme === 'dark'
        ? new THREE.BoxGeometry(1, 1, 1) // Cube for dark theme
        : new THREE.ConeGeometry(0.7, 1.5, 32); // Cone for light theme
  }, [currentTheme]);

  const activeKeyframes = useMemo(() => {
    console.log("ThreeScene: Recalculating activeKeyframes for theme:", currentTheme);
    return currentTheme === 'dark' ? darkThemeKeyframes : lightThemeKeyframes;
  }, [currentTheme]);

  useEffect(() => {
    console.log(`ThreeScene: useEffect triggered. Theme: ${currentTheme}, Scroll: ${scrollPercentage.toFixed(2)}`);
    if (!mountRef.current) {
      console.error("ThreeScene: Mount ref is null. Aborting setup.");
      return;
    }
    const currentMount = mountRef.current;

    if (currentMount.clientWidth === 0 || currentMount.clientHeight === 0) {
      console.warn(`ThreeScene: Mount dimensions are zero (${currentMount.clientWidth}x${currentMount.clientHeight}). Three.js setup might fail or be invisible. Waiting for resize.`);
      // We won't return here, as resize handler might fix it.
      // If it's persistently zero, it's an issue with the layout CSS for mountRef.
    } else {
      console.log("ThreeScene: Mount dimensions:", currentMount.clientWidth, "x", currentMount.clientHeight);
    }

    // Initialize Scene, Camera, Renderer FOR THIS INSTANCE
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      currentMount.clientWidth > 0 && currentMount.clientHeight > 0 ? currentMount.clientWidth / currentMount.clientHeight : 1, // Default aspect if dimensions are zero
      0.1,
      1000
    );
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    if (currentMount.clientWidth > 0 && currentMount.clientHeight > 0) {
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    } else {
        renderer.setSize(300, 150); // Fallback size if dimensions are zero initially
        console.warn("ThreeScene: Renderer initialized with fallback size due to zero mount dimensions.");
    }
    renderer.setClearAlpha(0); // Transparent background

    // Clear previous canvas if any and append new one
    currentMount.innerHTML = '';
    currentMount.appendChild(renderer.domElement);
    console.log("ThreeScene: Renderer initialized and appended to DOM.");

    // Dispose previous animated object IF IT EXISTS (shouldn't if key prop works perfectly)
    if (animatedObjectRef.current) {
        scene.remove(animatedObjectRef.current); // Should remove from the *new* scene if somehow persisted
        animatedObjectRef.current.geometry.dispose();
        if (animatedObjectRef.current.material instanceof THREE.Material) {
            animatedObjectRef.current.material.dispose();
        }
        console.log("ThreeScene: Disposed of a lingering animatedObjectRef (should be rare with key prop).");
    }
    animatedObjectRef.current = null; // Ensure it's reset

    // Create object material based on theme
    const objectMaterial = new THREE.MeshStandardMaterial({
      color: currentTheme === 'dark' ? 0x6A0DAD : 0xFFD700, // Dark: Purple, Light: Gold
      metalness: currentTheme === 'dark' ? 0.5 : 0.2,
      roughness: currentTheme === 'dark' ? 0.4 : 0.7,
    });
    console.log("ThreeScene: Material created for theme:", currentTheme, "Color:", objectMaterial.color.getHexString());

    const newAnimatedObject = new THREE.Mesh(objectGeometry, objectMaterial);
    scene.add(newAnimatedObject);
    animatedObjectRef.current = newAnimatedObject;
    console.log("ThreeScene: New animated object created and added to scene. Type:", currentTheme === 'dark' ? 'Cube' : 'Cone');

    // Lights
    const currentLights: THREE.Light[] = [];
    let ambientLight: THREE.AmbientLight;
    let directionalLight: THREE.DirectionalLight;
    let pointLight: THREE.PointLight;

    if (currentTheme === 'dark') {
      ambientLight = new THREE.AmbientLight(0x400080, 1.5); // Darker purple ambient
      directionalLight = new THREE.DirectionalLight(0x9370DB, 1.2); // MediumPurple
      directionalLight.position.set(1, 2, 3);
      pointLight = new THREE.PointLight(0xE6E6FA, 20, 100); // Lavender point light
      pointLight.position.set(-2, -1, 2);
    } else { // Light theme
      ambientLight = new THREE.AmbientLight(0xFFE4B5, 2.0); // Moccasin ambient (soft yellow)
      directionalLight = new THREE.DirectionalLight(0xFFDEAD, 1.0); // NavajoWhite
      directionalLight.position.set(-1, 2, 2);
      pointLight = new THREE.PointLight(0xADD8E6, 30, 100); // LightBlue point light
      pointLight.position.set(2, 1, 1);
    }
    scene.add(ambientLight); currentLights.push(ambientLight);
    scene.add(directionalLight); currentLights.push(directionalLight);
    scene.add(pointLight); currentLights.push(pointLight);
    console.log("ThreeScene: Lights created and added for theme:", currentTheme);

    // Animation Loop
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      if (animatedObjectRef.current) {
        const { position, rotation, scale } = interpolateKeyframes(scrollPercentage, activeKeyframes);
        animatedObjectRef.current.position.copy(position);
        animatedObjectRef.current.rotation.copy(rotation);
        animatedObjectRef.current.scale.copy(scale);
      }
      renderer.render(scene, camera);
    };
    animate();
    console.log("ThreeScene: Animation loop started.");

    // Resize Handler
    const handleResize = () => {
      if (mountRef.current && renderer && camera) { // Check renderer & camera from this scope
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        if (width > 0 && height > 0) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
          console.log("ThreeScene: Resized to", width, "x", height);
        } else {
          console.warn("ThreeScene: Resize handler - zero dimensions for mountRef.");
        }
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call

    // Cleanup for THIS INSTANCE when it unmounts
    return () => {
      console.log("ThreeScene: Cleanup function running for instance with theme:", currentTheme);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
        console.log("ThreeScene: Animation frame cancelled.");
      }
      window.removeEventListener('resize', handleResize);
      console.log("ThreeScene: Resize listener removed.");

      if (animatedObjectRef.current) {
        scene.remove(animatedObjectRef.current);
        animatedObjectRef.current.geometry.dispose();
        if (animatedObjectRef.current.material instanceof THREE.Material) {
          animatedObjectRef.current.material.dispose();
        }
        animatedObjectRef.current = null;
        console.log("ThreeScene: Animated object disposed from scene.");
      }

      currentLights.forEach(light => {
        scene.remove(light);
        // @ts-ignore
        if (typeof light.dispose === 'function') { // Some lights have dispose
            // @ts-ignore
            light.dispose();
        }
      });
      console.log("ThreeScene: Lights removed from scene and disposed if possible.");

      // Dispose scene children
      scene.traverse(object => {
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
      console.log("ThreeScene: Scene's children geometries/materials disposed.");

      if (renderer.domElement.parentNode === currentMount) {
        currentMount.removeChild(renderer.domElement);
        console.log("ThreeScene: Renderer DOM element removed.");
      }
      renderer.dispose();
      console.log("ThreeScene: Renderer disposed.");
      console.log("ThreeScene: Cleanup complete for instance.");
    };
  }, [currentTheme, scrollPercentage, objectGeometry, activeKeyframes]);

  return <div ref={mountRef} className="fixed inset-0 -z-10 w-screen h-screen" />;
};

export default ThreeScene;

    