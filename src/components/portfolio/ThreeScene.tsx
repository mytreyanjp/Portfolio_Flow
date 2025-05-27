
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
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animatedObjectRef = useRef<THREE.Mesh | null>(null); // For Cube or Cone
  
  const lightRefs = useRef<THREE.Light[]>([]); // To store references to lights for easy removal

  // Memoize geometry and keyframes to prevent re-computation on every render
  const objectGeometry = useMemo(() => {
    // console.log("ThreeScene: Recalculating objectGeometry for theme:", currentTheme);
    return currentTheme === 'dark' 
        ? new THREE.BoxGeometry(1, 1, 1) // Cube for dark theme
        : new THREE.ConeGeometry(0.7, 1.5, 32); // Cone for light theme
  }, [currentTheme]);

  const activeKeyframes = useMemo(() => {
    // console.log("ThreeScene: Recalculating activeKeyframes for theme:", currentTheme);
    return currentTheme === 'dark' ? darkThemeKeyframes : lightThemeKeyframes;
  }, [currentTheme]);

  useEffect(() => {
    if (typeof window === 'undefined' || !mountRef.current) {
      // console.log("ThreeScene: useEffect - window or mountRef not available yet for theme:", currentTheme);
      return;
    }
    const currentMount = mountRef.current;
    // console.log("ThreeScene: useEffect triggered. Theme:", currentTheme, "Scroll:", scrollPercentage);

    // Initialize Scene, Camera, Renderer (only once per component instance)
    if (!sceneRef.current) sceneRef.current = new THREE.Scene();
    if (!cameraRef.current) {
      cameraRef.current = new THREE.PerspectiveCamera(75, currentMount.clientWidth / Math.max(1, currentMount.clientHeight), 0.1, 1000);
      cameraRef.current.position.z = 3; // Consistent camera Z position
    }
    if (!rendererRef.current) {
      rendererRef.current = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      rendererRef.current.setPixelRatio(window.devicePixelRatio);
      rendererRef.current.setClearAlpha(0); // For transparent background
      currentMount.appendChild(rendererRef.current.domElement);
    }
    rendererRef.current.setSize(currentMount.clientWidth, Math.max(1, currentMount.clientHeight));
    // Scene background is transparent, set by alpha:true and setClearAlpha(0)

    // --- Cleanup previous object and lights ---
    if (animatedObjectRef.current && sceneRef.current) {
      sceneRef.current.remove(animatedObjectRef.current);
      animatedObjectRef.current.geometry.dispose();
      if (animatedObjectRef.current.material instanceof THREE.Material) {
        animatedObjectRef.current.material.dispose();
      }
      animatedObjectRef.current = null;
    }
    lightRefs.current.forEach(light => sceneRef.current?.remove(light));
    lightRefs.current = [];


    // --- Create new object based on current theme ---
    const materialColor = currentTheme === 'dark' ? 0x9370DB : 0xBDA0CB; // Dark: MediumPurple, Light: Soft Lavender for objects
    const material = new THREE.MeshStandardMaterial({ 
        color: materialColor, 
        metalness: currentTheme === 'dark' ? 0.4 : 0.3, 
        roughness: currentTheme === 'dark' ? 0.5 : 0.6 
    });
    
    animatedObjectRef.current = new THREE.Mesh(objectGeometry, material); // objectGeometry is memoized
    sceneRef.current.add(animatedObjectRef.current);
    // console.log("ThreeScene: New object created. Type:", currentTheme === 'dark' ? 'Cube' : 'Cone');

    // --- Create new lights based on current theme ---
    let ambientLight: THREE.AmbientLight;
    let directionalLight: THREE.DirectionalLight;
    let accentLight: THREE.PointLight;

    if (currentTheme === 'dark') { // Royal Purple Dark Theme
      ambientLight = new THREE.AmbientLight(0x503075, 1.0);
      directionalLight = new THREE.DirectionalLight(new THREE.Color().setHSL(280 / 360, 0.70, 0.60), 1.8);
      directionalLight.position.set(1, 2, 3);
      accentLight = new THREE.PointLight(new THREE.Color().setHSL(300 / 360, 0.75, 0.70), 30, 50);
      accentLight.position.set(-2, -1, 1);
    } else { // Light Purple Theme
      ambientLight = new THREE.AmbientLight(0xE0D8F0, 1.5);
      directionalLight = new THREE.DirectionalLight(new THREE.Color().setHSL(270 / 360, 0.65, 0.85), 1.2);
      directionalLight.position.set(-1, 2, 2);
      accentLight = new THREE.PointLight(new THREE.Color().setHSL(285 / 360, 0.70, 0.80), 25, 40);
      accentLight.position.set(2, 1, 0);
    }
    sceneRef.current.add(ambientLight);
    sceneRef.current.add(directionalLight);
    sceneRef.current.add(accentLight);
    lightRefs.current.push(ambientLight, directionalLight, accentLight);
    // console.log("ThreeScene: Lights (re)created for theme:", currentTheme);

    // --- Animation Loop ---
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (animatedObjectRef.current && rendererRef.current && sceneRef.current && cameraRef.current) {
        const { position, rotation, scale } = interpolateKeyframes(scrollPercentage, activeKeyframes); // activeKeyframes is memoized
        animatedObjectRef.current.position.copy(position);
        animatedObjectRef.current.rotation.copy(rotation);
        animatedObjectRef.current.scale.copy(scale);
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // --- Resize Handler ---
    const handleResize = () => {
      if (mountRef.current && rendererRef.current && cameraRef.current) {
        const width = mountRef.current.clientWidth;
        const height = Math.max(1, mountRef.current.clientHeight); // Ensure height is at least 1
        if (width > 0 && height > 0) {
          cameraRef.current.aspect = width / height;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(width, height);
        }
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call

    // --- Cleanup ---
    return () => {
      // console.log("ThreeScene: Cleanup for instance (theme:", currentTheme, ")");
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      
      // The key prop in layout.tsx handles full unmount/remount, so renderer/scene/camera are disposed by that.
      // Here, we just ensure the currently managed object and lights are removed from the scene.
      if (animatedObjectRef.current && sceneRef.current) {
        sceneRef.current.remove(animatedObjectRef.current);
        animatedObjectRef.current.geometry.dispose();
        if (animatedObjectRef.current.material instanceof THREE.Material) {
          animatedObjectRef.current.material.dispose();
        }
        animatedObjectRef.current = null;
      }
      lightRefs.current.forEach(light => sceneRef.current?.remove(light));
      lightRefs.current = [];

      // Dispose renderer, scene, camera etc. when component unmounts (due to key change)
      if (rendererRef.current) {
        // Check if domElement is still part of the DOM before trying to remove
        if (rendererRef.current.domElement.parentNode === currentMount) {
            // currentMount.removeChild(rendererRef.current.domElement); // Not needed if renderer is disposed
        }
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
      if (cameraRef.current) {
        cameraRef.current = null;
      }
      if (sceneRef.current) {
        // Dispose any other scene resources if necessary
        sceneRef.current = null;
      }
    };
  // The key prop in RootLayout.tsx causes this component to remount on theme change.
  // objectGeometry and activeKeyframes change with currentTheme.
  }, [currentTheme, scrollPercentage, objectGeometry, activeKeyframes]); 

  return <div ref={mountRef} className="fixed inset-0 -z-10 w-screen h-screen" />;
};

export default ThreeScene;

