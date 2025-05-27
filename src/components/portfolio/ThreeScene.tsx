
'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';

interface ThreeSceneProps {
  scrollPercentage: number;
  currentTheme: 'light' | 'dark';
}

// Keyframes for the Cone (Light Theme)
const lightThemeKeyframes = [
  { scroll: 0, position: [0, -0.2, 0], rotation: [0, 0, Math.PI / 4], scale: [0.7, 0.7, 0.7] },
  { scroll: 0.25, position: [0.3, 0.1, 0], rotation: [Math.PI / 8, Math.PI / 3, Math.PI / 2], scale: [0.85, 0.85, 0.85] },
  { scroll: 0.5, position: [0, 0.3, 0], rotation: [Math.PI / 4, Math.PI / 1.5, Math.PI * 0.75], scale: [1, 1, 1] },
  { scroll: 0.75, position: [-0.3, 0.1, 0], rotation: [Math.PI / 8, Math.PI, Math.PI], scale: [0.85, 0.85, 0.85] },
  { scroll: 1, position: [0, -0.2, 0], rotation: [0, Math.PI * 2, Math.PI * 1.25], scale: [0.7, 0.7, 0.7] },
];

// Keyframes for the Cube (Dark Theme)
const darkThemeKeyframes = [
  { scroll: 0, position: [0, -0.5, 0], rotation: [0, 0, 0], scale: [0.8, 0.8, 0.8] },
  { scroll: 0.25, position: [0.5, 0, 0], rotation: [0, Math.PI / 2, 0], scale: [1, 1, 1] },
  { scroll: 0.5, position: [0, 0.5, 0], rotation: [Math.PI / 2, Math.PI, Math.PI / 2], scale: [1.2, 1.2, 1.2] },
  { scroll: 0.75, position: [-0.5, 0, 0], rotation: [Math.PI, Math.PI * 1.5, Math.PI], scale: [1, 1, 1] },
  { scroll: 1, position: [0, -0.5, 0], rotation: [Math.PI * 2, Math.PI * 2, Math.PI * 2], scale: [0.8, 0.8, 0.8] },
];


const interpolateKeyframes = (
    keyframes: typeof lightThemeKeyframes | typeof darkThemeKeyframes, 
    scroll: number
  ) => {
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
      break;
    } else if (scroll > keyframes[keyframes.length - 1].scroll) {
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
  const lightsRef = useRef<{ ambientLight?: THREE.AmbientLight; directionalLight?: THREE.DirectionalLight; pointLight?: THREE.PointLight }>({});
  const animationFrameIdRef = useRef<number | null>(null);

  const objectGeometry = useMemo(() => {
    if (currentTheme === 'light') {
      return new THREE.ConeGeometry(0.4, 0.8, 32); // Cone for light theme
    } else {
      return new THREE.BoxGeometry(0.7, 0.7, 0.7); // Cube for dark theme
    }
  }, [currentTheme]);

  const activeKeyframes = useMemo(() => {
    return currentTheme === 'light' ? lightThemeKeyframes : darkThemeKeyframes;
  }, [currentTheme]);

  useEffect(() => {
    console.log(`ThreeScene: useEffect triggered. Theme: ${currentTheme}, Scroll: ${scrollPercentage.toFixed(2)}`);
    if (!mountRef.current) {
      console.error("ThreeScene: Mount ref is null. Aborting setup.");
      return;
    }
    const currentMount = mountRef.current;

    // Initialize core Three.js objects if they don't exist for this instance
    if (!sceneRef.current) sceneRef.current = new THREE.Scene();
    if (!cameraRef.current) {
      cameraRef.current = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      cameraRef.current.position.z = 2;
    }
    if (!rendererRef.current) {
      rendererRef.current = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      rendererRef.current.setPixelRatio(window.devicePixelRatio);
      currentMount.appendChild(rendererRef.current.domElement);
      console.log("ThreeScene: Renderer initialized and appended to DOM.");
    }
    
    rendererRef.current.setClearAlpha(0); // Transparent background for the canvas itself

    const mountWidth = currentMount.clientWidth;
    const mountHeight = currentMount.clientHeight;

    if (mountWidth > 0 && mountHeight > 0) {
      rendererRef.current.setSize(mountWidth, mountHeight);
      cameraRef.current.aspect = mountWidth / mountHeight;
      cameraRef.current.updateProjectionMatrix();
      console.log(`ThreeScene: Renderer and camera sized to: ${mountWidth}x${mountHeight}`);
    } else {
      console.warn("ThreeScene: Mount dimensions are zero. Using fallback 300x150. Check CSS for mount point.");
      rendererRef.current.setSize(300, 150);
      cameraRef.current.aspect = 300/150;
      cameraRef.current.updateProjectionMatrix();
    }

    // --- Theme-specific setup ---
    let objectMaterialColor: THREE.Color;
    let ambientLightColor: THREE.Color;
    let directionalLightColor: THREE.Color;
    let pointLightColor: THREE.Color;

    if (currentTheme === 'light') {
      // Light Purple Theme
      objectMaterialColor = new THREE.Color().setHSL(270 / 360, 0.65, 0.75); // Soft purple for cone
      ambientLightColor = new THREE.Color(0xffffff);
      directionalLightColor = new THREE.Color().setHSL(275 / 360, 0.5, 0.8); // Soft lavender light
      pointLightColor = new THREE.Color().setHSL(285 / 360, 0.7, 0.75); // Pinkish purple accent
    } else {
      // Royal Purple Dark Theme
      objectMaterialColor = new THREE.Color().setHSL(280 / 360, 0.70, 0.60); // Rich royal purple for cube
      ambientLightColor = new THREE.Color(0x404040); // Dimmer ambient for dark
      directionalLightColor = new THREE.Color().setHSL(270 / 360, 0.30, 0.35); // Muted purple/blueish
      pointLightColor = new THREE.Color().setHSL(300 / 360, 0.75, 0.70); // Magenta/violet accent
    }

    // Cleanup previous object if it exists
    if (animatedObjectRef.current) {
      if (animatedObjectRef.current.geometry) animatedObjectRef.current.geometry.dispose();
      if (animatedObjectRef.current.material) {
        (animatedObjectRef.current.material as THREE.Material).dispose();
      }
      sceneRef.current.remove(animatedObjectRef.current);
      animatedObjectRef.current = null;
    }
    
    const material = new THREE.MeshStandardMaterial({
      color: objectMaterialColor,
      metalness: currentTheme === 'light' ? 0.2 : 0.4,
      roughness: currentTheme === 'light' ? 0.7 : 0.5,
    });
    animatedObjectRef.current = new THREE.Mesh(objectGeometry, material);
    sceneRef.current.add(animatedObjectRef.current);
    console.log(`ThreeScene: ${currentTheme === 'light' ? 'Cone' : 'Cube'} created and added.`);

    // Cleanup previous lights
    if (lightsRef.current.ambientLight) sceneRef.current.remove(lightsRef.current.ambientLight);
    if (lightsRef.current.directionalLight) sceneRef.current.remove(lightsRef.current.directionalLight);
    if (lightsRef.current.pointLight) sceneRef.current.remove(lightsRef.current.pointLight);

    lightsRef.current.ambientLight = new THREE.AmbientLight(ambientLightColor, currentTheme === 'light' ? 0.8 : 0.6);
    sceneRef.current.add(lightsRef.current.ambientLight);

    lightsRef.current.directionalLight = new THREE.DirectionalLight(directionalLightColor, currentTheme === 'light' ? 1.2 : 1.0);
    lightsRef.current.directionalLight.position.set(1, 1, 1);
    sceneRef.current.add(lightsRef.current.directionalLight);

    lightsRef.current.pointLight = new THREE.PointLight(pointLightColor, currentTheme === 'light' ? 1.5 : 1.2, 10);
    lightsRef.current.pointLight.position.set(currentTheme === 'light' ? -1 : 0.5, -0.5, 1);
    sceneRef.current.add(lightsRef.current.pointLight);
    console.log("ThreeScene: Lights configured for theme:", currentTheme);

    // Animation loop
    const animate = () => {
      if (!animatedObjectRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) {
        if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = requestAnimationFrame(animate); // keep trying if refs not ready
        return;
      }
      animationFrameIdRef.current = requestAnimationFrame(animate);

      const interpolated = interpolateKeyframes(activeKeyframes, scrollPercentage);
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
          console.log("ThreeScene: Resized to", width, "x", height);
           if (!animationFrameIdRef.current && animatedObjectRef.current) { 
            animate(); // restart animation if it wasn't running and object exists
            console.log("ThreeScene: Animation loop started on resize.");
          }
        }
      }
    };
    window.addEventListener('resize', handleResize);
    if (mountWidth > 0 && mountHeight > 0) { // Call once if dimensions are already good
        handleResize();
    }
    
    return () => {
      console.log(`ThreeScene: useEffect cleanup for theme: ${currentTheme}`);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      window.removeEventListener('resize', handleResize);

      if (animatedObjectRef.current) {
        if (animatedObjectRef.current.geometry) animatedObjectRef.current.geometry.dispose();
        if (animatedObjectRef.current.material) {
          (animatedObjectRef.current.material as THREE.Material).dispose();
        }
        if(sceneRef.current) sceneRef.current.remove(animatedObjectRef.current);
        animatedObjectRef.current = null;
      }
      if(lightsRef.current.ambientLight && sceneRef.current) sceneRef.current.remove(lightsRef.current.ambientLight);
      if(lightsRef.current.directionalLight && sceneRef.current) sceneRef.current.remove(lightsRef.current.directionalLight);
      if(lightsRef.current.pointLight && sceneRef.current) sceneRef.current.remove(lightsRef.current.pointLight);
      lightsRef.current = {};
      
      // Full cleanup if component is truly unmounting (due to key change)
      if (rendererRef.current && currentMount && rendererRef.current.domElement.parentNode === currentMount) {
         currentMount.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
      rendererRef.current = null; // Allow re-creation
      sceneRef.current = null;
      cameraRef.current = null;
      console.log("ThreeScene: Full cleanup complete.");
    };
  }, [currentTheme, objectGeometry, activeKeyframes, scrollPercentage]); // scrollPercentage re-triggers for animation

  return <div ref={mountRef} className="fixed inset-0 -z-10 w-screen h-screen bg-transparent" />;
};

export default ThreeScene;
