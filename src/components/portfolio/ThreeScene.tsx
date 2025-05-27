
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

const lightThemeKeyframes: Keyframe[] = [ // Cone
  { scroll: 0, position: [0, -1, 0], rotation: [0, 0, 0], scale: [0.8, 1.2, 0.8] },
  { scroll: 0.25, position: [1, 0, -1], rotation: [Math.PI / 4, Math.PI / 4, 0], scale: [1, 1.5, 1] },
  { scroll: 0.5, position: [0, 1, -2], rotation: [Math.PI / 2, Math.PI / 2, Math.PI / 4], scale: [1.2, 1.8, 1.2] },
  { scroll: 0.75, position: [-1, 0, -1], rotation: [3 * Math.PI / 4, 3 * Math.PI / 4, Math.PI / 2], scale: [1, 1.5, 1] },
  { scroll: 1, position: [0, -1, 0], rotation: [Math.PI, Math.PI, 3 * Math.PI / 4], scale: [0.8, 1.2, 0.8] },
];

const darkThemeKeyframes: Keyframe[] = [ // Cube
  { scroll: 0, position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  { scroll: 0.25, position: [-0.5, 0.5, -0.5], rotation: [0, Math.PI / 3, Math.PI / 6], scale: [1.2, 1.2, 1.2] },
  { scroll: 0.5, position: [0, 0, -1.5], rotation: [Math.PI / 4, Math.PI / 2, Math.PI / 4], scale: [1.5, 1.5, 1.5] },
  { scroll: 0.75, position: [0.5, -0.5, -0.5], rotation: [Math.PI / 2, 2 * Math.PI / 3, Math.PI / 3], scale: [1.2, 1.2, 1.2] },
  { scroll: 1, position: [0, 0, 0], rotation: [Math.PI, Math.PI, Math.PI / 2], scale: [1, 1, 1] },
];

function interpolateKeyframes(scroll: number, keyframes: Keyframe[]): { position: THREE.Vector3; rotation: THREE.Euler; scale: THREE.Vector3 } {
  if (scroll <= keyframes[0].scroll) return {
    position: new THREE.Vector3(...keyframes[0].position),
    rotation: new THREE.Euler(...keyframes[0].rotation as [number, number, number, (string | undefined)?]),
    scale: new THREE.Vector3(...keyframes[0].scale)
  };
  if (scroll >= keyframes[keyframes.length - 1].scroll) return {
    position: new THREE.Vector3(...keyframes[keyframes.length - 1].position),
    rotation: new THREE.Euler(...keyframes[keyframes.length - 1].rotation as [number, number, number, (string | undefined)?]),
    scale: new THREE.Vector3(...keyframes[keyframes.length - 1].scale)
  };

  let i = 0;
  while (keyframes[i + 1].scroll < scroll) {
    i++;
  }

  const k1 = keyframes[i];
  const k2 = keyframes[i + 1];
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
  const animationFrameIdRef = useRef<number | null>(null);

  const objectGeometry = useMemo(() => {
    if (currentTheme === 'dark') {
      return new THREE.BoxGeometry(1, 1, 1); // Cube for dark theme
    } else {
      return new THREE.ConeGeometry(0.7, 1.5, 32); // Cone for light theme
    }
  }, [currentTheme]);

  const activeKeyframes = useMemo(() => {
    return currentTheme === 'dark' ? darkThemeKeyframes : lightThemeKeyframes;
  }, [currentTheme]);


  useEffect(() => {
    if (typeof window === 'undefined' || !mountRef.current) {
      return;
    }
    const currentMount = mountRef.current;

    // Initialize Scene, Camera, Renderer if they don't exist
    if (!sceneRef.current) {
      sceneRef.current = new THREE.Scene();
    }
    if (!cameraRef.current) {
      cameraRef.current = new THREE.PerspectiveCamera(
        75,
        currentMount.clientWidth / Math.max(1, currentMount.clientHeight),
        0.1,
        1000
      );
      cameraRef.current.position.z = 3;
    } else {
        // Update camera aspect ratio if it exists (on resize or remount)
         cameraRef.current.aspect = currentMount.clientWidth / Math.max(1, currentMount.clientHeight);
         cameraRef.current.updateProjectionMatrix();
    }

    if (!rendererRef.current) {
      rendererRef.current = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      rendererRef.current.setPixelRatio(window.devicePixelRatio);
      currentMount.appendChild(rendererRef.current.domElement);
    }
    rendererRef.current.setSize(currentMount.clientWidth, Math.max(1, currentMount.clientHeight));


    // Manage Animated Object (Cube or Cone)
    if (animatedObjectRef.current) {
      sceneRef.current.remove(animatedObjectRef.current);
      animatedObjectRef.current.geometry.dispose();
      if (animatedObjectRef.current.material instanceof THREE.Material) {
        animatedObjectRef.current.material.dispose();
      }
    }
    const material = new THREE.MeshStandardMaterial();
    animatedObjectRef.current = new THREE.Mesh(objectGeometry, material);
    sceneRef.current.add(animatedObjectRef.current);

    // Manage Lights
    if (!ambientLightRef.current) {
      ambientLightRef.current = new THREE.AmbientLight();
      sceneRef.current.add(ambientLightRef.current);
    }
    if (!directionalLightRef.current) {
      directionalLightRef.current = new THREE.DirectionalLight();
      sceneRef.current.add(directionalLightRef.current);
    }
    if (!accentLightRef.current) {
      accentLightRef.current = new THREE.PointLight();
      sceneRef.current.add(accentLightRef.current);
    }

    // Apply Theme Specifics
    if (currentTheme === 'dark') { // Royal Purple Dark Theme
      sceneRef.current.background = new THREE.Color().setHSL(270 / 360, 0.40, 0.10); // Dark Violet
      if (animatedObjectRef.current && animatedObjectRef.current.material instanceof THREE.MeshStandardMaterial) {
        animatedObjectRef.current.material.color.set(0x9370DB); // Medium Purple for Cube
        animatedObjectRef.current.material.metalness = 0.3;
        animatedObjectRef.current.material.roughness = 0.6;
      }
      ambientLightRef.current.color.set(0x503075); // Muted purple ambient
      ambientLightRef.current.intensity = 0.8;
      directionalLightRef.current.color.setHSL(280 / 360, 0.70, 0.60); // Rich royal purple
      directionalLightRef.current.intensity = 1.5;
      directionalLightRef.current.position.set(1, 2, 3);
      accentLightRef.current.color.setHSL(300 / 360, 0.75, 0.70); // Magenta/violet accent
      accentLightRef.current.intensity = 20; // PointLight intensity is power
      accentLightRef.current.distance = 50;
      accentLightRef.current.position.set(-2, -1, 1);
    } else { // Light Purple Theme
      sceneRef.current.background = new THREE.Color().setHSL(275 / 360, 0.80, 0.97); // Very light lavender
      if (animatedObjectRef.current && animatedObjectRef.current.material instanceof THREE.MeshStandardMaterial) {
        animatedObjectRef.current.material.color.set(0xBDA0CB); // Soft purple / Light lavender for Cone
        animatedObjectRef.current.material.metalness = 0.2;
        animatedObjectRef.current.material.roughness = 0.7;
      }
      ambientLightRef.current.color.set(0xE0D8F0); // Light lavender ambient
      ambientLightRef.current.intensity = 1.2;
      directionalLightRef.current.color.setHSL(270 / 360, 0.65, 0.85); // Lighter main purple
      directionalLightRef.current.intensity = 1.0;
      directionalLightRef.current.position.set(-1, 2, 2);
      accentLightRef.current.color.setHSL(285 / 360, 0.70, 0.80); // Brighter pinkish purple accent
      accentLightRef.current.intensity = 15;
      accentLightRef.current.distance = 40;
      accentLightRef.current.position.set(2, 1, 0);
    }
    if (animatedObjectRef.current && animatedObjectRef.current.material instanceof THREE.MeshStandardMaterial) {
       animatedObjectRef.current.material.needsUpdate = true;
    }


    // Animation Loop
    const animate = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !animatedObjectRef.current) {
        return;
      }
      animationFrameIdRef.current = requestAnimationFrame(animate);

      const { position, rotation, scale } = interpolateKeyframes(scrollPercentage, activeKeyframes);
      animatedObjectRef.current.position.copy(position);
      animatedObjectRef.current.rotation.copy(rotation);
      animatedObjectRef.current.scale.copy(scale);
      
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    animate();


    // Resize Handler
    const handleResize = () => {
      if (mountRef.current && rendererRef.current && cameraRef.current) {
        const width = mountRef.current.clientWidth;
        const height = Math.max(1, mountRef.current.clientHeight);
        if (width > 0 && height > 0) {
          cameraRef.current.aspect = width / height;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(width, height);
        }
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Call once to set initial size

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      // When component unmounts (due to key change or navigating away from app)
      if (rendererRef.current && rendererRef.current.domElement.parentNode === currentMount) {
         // currentMount.removeChild(rendererRef.current.domElement); // This can cause issues if React unmounts the parent first
      }
      // More thorough cleanup handled by React unmounting the component due to `key` prop in layout
    };
  }, [currentTheme, scrollPercentage, objectGeometry, activeKeyframes]); // Key dependencies

  return <div ref={mountRef} className="fixed inset-0 -z-10 w-screen h-screen" />;
};

export default ThreeScene;
