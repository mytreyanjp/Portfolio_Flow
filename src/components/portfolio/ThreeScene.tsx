
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

// Keyframes for the Light Theme (Cone - Light Purple)
const lightThemeKeyframes: Keyframe[] = [
  // Example: A gentle sway and rotation for the Cone
  { scroll: 0,    position: [0, -0.5, 0],    rotation: [0, 0, 0],                   scale: [0.8, 1.2, 0.8] },
  { scroll: 0.25, position: [0.5, 0, -0.5],  rotation: [Math.PI / 8, Math.PI / 6, 0], scale: [0.9, 1.4, 0.9] },
  { scroll: 0.5,  position: [0, 0.5, -1],    rotation: [Math.PI / 4, Math.PI / 3, Math.PI / 8], scale: [1, 1.5, 1] },
  { scroll: 0.75, position: [-0.5, 0, -0.5], rotation: [3 * Math.PI / 8, Math.PI / 2, Math.PI / 4], scale: [0.9, 1.4, 0.9] },
  { scroll: 1,    position: [0, -0.5, 0],    rotation: [Math.PI / 2, 2 * Math.PI / 3, 3 * Math.PI / 8], scale: [0.8, 1.2, 0.8] },
];

// Keyframes for the Dark Theme (Cube - Royal Purple)
const darkThemeKeyframes: Keyframe[] = [
  // Example: More dynamic rotation and movement for the Cube
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
  const animatedObjectRef = useRef<THREE.Mesh | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const directionalLightRef = useRef<THREE.DirectionalLight | null>(null);
  const accentLightRef = useRef<THREE.PointLight | null>(null);

  const objectGeometry = useMemo(() => {
    // console.log("ThreeScene: Recalculating objectGeometry for theme:", currentTheme);
    return currentTheme === 'dark' ? new THREE.BoxGeometry(1, 1, 1) : new THREE.ConeGeometry(0.7, 1.5, 32);
  }, [currentTheme]);

  const activeKeyframes = useMemo(() => {
    // console.log("ThreeScene: Recalculating activeKeyframes for theme:", currentTheme);
    return currentTheme === 'dark' ? darkThemeKeyframes : lightThemeKeyframes;
  }, [currentTheme]);

  useEffect(() => {
    if (typeof window === 'undefined' || !mountRef.current) {
      // console.log("ThreeScene: useEffect - window or mountRef not available yet.");
      return;
    }
    const currentMount = mountRef.current;
    // console.log("ThreeScene: useEffect triggered. Theme:", currentTheme, "Scroll:", scrollPercentage);

    // Initialize Scene, Camera, Renderer, and Lights
    sceneRef.current = new THREE.Scene();
    cameraRef.current = new THREE.PerspectiveCamera(75, currentMount.clientWidth / Math.max(1, currentMount.clientHeight), 0.1, 1000);
    cameraRef.current.position.z = 3;

    rendererRef.current = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // alpha: true for transparent background
    rendererRef.current.setPixelRatio(window.devicePixelRatio);
    rendererRef.current.setSize(currentMount.clientWidth, Math.max(1, currentMount.clientHeight));
    rendererRef.current.setClearAlpha(0); // Make CSS background show through
    currentMount.appendChild(rendererRef.current.domElement);
    
    ambientLightRef.current = new THREE.AmbientLight();
    sceneRef.current.add(ambientLightRef.current);
    directionalLightRef.current = new THREE.DirectionalLight();
    sceneRef.current.add(directionalLightRef.current);
    accentLightRef.current = new THREE.PointLight();
    sceneRef.current.add(accentLightRef.current);

    // Create Animated Object
    const material = new THREE.MeshStandardMaterial();
    animatedObjectRef.current = new THREE.Mesh(objectGeometry, material);
    sceneRef.current.add(animatedObjectRef.current);
    // console.log("ThreeScene: Animated object created/updated. Type:", currentTheme === 'dark' ? 'Cube' : 'Cone');

    // Apply Theme Specifics
    if (currentTheme === 'dark') { // Royal Purple Dark Theme (Cube)
      // console.log("ThreeScene: Applying Dark Theme specifics");
      if (animatedObjectRef.current.material instanceof THREE.MeshStandardMaterial) {
        animatedObjectRef.current.material.color.set(0x9370DB); // Medium Purple
        animatedObjectRef.current.material.metalness = 0.4;
        animatedObjectRef.current.material.roughness = 0.5;
      }
      ambientLightRef.current.color.set(0x503075); 
      ambientLightRef.current.intensity = 1.0; 
      directionalLightRef.current.color.setHSL(280 / 360, 0.70, 0.60); 
      directionalLightRef.current.intensity = 1.8; 
      directionalLightRef.current.position.set(1, 2, 3);
      accentLightRef.current.color.setHSL(300 / 360, 0.75, 0.70); 
      accentLightRef.current.intensity = 30; // Increased
      accentLightRef.current.distance = 50;
      accentLightRef.current.position.set(-2, -1, 1);
    } else { // Light Purple Theme (Cone)
      // console.log("ThreeScene: Applying Light Theme specifics");
       if (animatedObjectRef.current.material instanceof THREE.MeshStandardMaterial) {
        animatedObjectRef.current.material.color.set(0xBDA0CB); // Soft purple / Light lavender
        animatedObjectRef.current.material.metalness = 0.3;
        animatedObjectRef.current.material.roughness = 0.6;
      }
      ambientLightRef.current.color.set(0xE0D8F0); 
      ambientLightRef.current.intensity = 1.5;
      directionalLightRef.current.color.setHSL(270 / 360, 0.65, 0.85);
      directionalLightRef.current.intensity = 1.2;
      directionalLightRef.current.position.set(-1, 2, 2);
      accentLightRef.current.color.setHSL(285 / 360, 0.70, 0.80);
      accentLightRef.current.intensity = 25; // Increased
      accentLightRef.current.distance = 40;
      accentLightRef.current.position.set(2, 1, 0);
    }
    if (animatedObjectRef.current?.material instanceof THREE.MeshStandardMaterial) {
        animatedObjectRef.current.material.needsUpdate = true;
    }
    
    // Animation Loop
    const animate = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !animatedObjectRef.current) return;
      const { position, rotation, scale } = interpolateKeyframes(scrollPercentage, activeKeyframes);
      animatedObjectRef.current.position.copy(position);
      animatedObjectRef.current.rotation.copy(rotation);
      animatedObjectRef.current.scale.copy(scale);
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };
    rendererRef.current.setAnimationLoop(animate);

    // Handle window resize
    const handleResize = () => {
      if (mountRef.current && rendererRef.current && cameraRef.current) {
        const width = mountRef.current.clientWidth;
        const height = Math.max(1, mountRef.current.clientHeight);
        if (width > 0 && height > 0) {
          cameraRef.current.aspect = width / height;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(width, height);
          // console.log("ThreeScene: Resized to", width, "x", height);
        }
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial size set

    // Cleanup
    return () => {
      // console.log("ThreeScene: Cleanup for instance (theme:", currentTheme, ")");
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current) {
        rendererRef.current.setAnimationLoop(null);
        rendererRef.current.dispose(); // Dispose renderer
        if (rendererRef.current.domElement.parentNode === currentMount) {
             currentMount.removeChild(rendererRef.current.domElement); // Remove canvas
        }
      }
      if (sceneRef.current) {
        if (animatedObjectRef.current) {
          sceneRef.current.remove(animatedObjectRef.current);
          animatedObjectRef.current.geometry.dispose();
          if (animatedObjectRef.current.material instanceof THREE.Material) {
            animatedObjectRef.current.material.dispose();
          }
        }
        // Dispose other scene children if necessary
      }
      // Nullify refs
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      animatedObjectRef.current = null;
      ambientLightRef.current = null;
      directionalLightRef.current = null;
      accentLightRef.current = null;
    };
  }, [currentTheme, scrollPercentage, objectGeometry, activeKeyframes]); // Key dependencies

  return <div ref={mountRef} className="fixed inset-0 -z-10 w-screen h-screen" />;
};

export default ThreeScene;
