
'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';

interface ThreeSceneProps {
  scrollPercentage: number;
  currentTheme: 'light' | 'dark';
}

// Define the structure for an animation keyframe
interface Keyframe {
  scroll: number; // Scroll percentage (0.0 to 1.0)
  position: [number, number, number]; // [x, y, z]
  rotation: [number, number, number]; // [x, y, z] in radians
  scale: [number, number, number];    // [x, y, z]
}

// Keyframes for the Light Theme (Cone - Light Purple)
// Modify these values to change the Cone's animation path in the light theme.
const lightThemeKeyframes: Keyframe[] = [
  { scroll: 0,    position: [0, -1, 0],    rotation: [0, 0, 0],                   scale: [0.8, 1.2, 0.8] },
  { scroll: 0.25, position: [1, 0, -1],     rotation: [Math.PI / 4, Math.PI / 4, 0], scale: [1, 1.5, 1] },
  { scroll: 0.5,  position: [0, 1, -2],     rotation: [Math.PI / 2, Math.PI / 2, Math.PI / 4], scale: [1.2, 1.8, 1.2] },
  { scroll: 0.75, position: [-1, 0, -1],    rotation: [3 * Math.PI / 4, 3 * Math.PI / 4, Math.PI / 2], scale: [1, 1.5, 1] },
  { scroll: 1,    position: [0, -1, 0],    rotation: [Math.PI, Math.PI, 3 * Math.PI / 4], scale: [0.8, 1.2, 0.8] },
];

// Keyframes for the Dark Theme (Cube - Royal Purple)
// Modify these values to change the Cube's animation path in the dark theme.
const darkThemeKeyframes: Keyframe[] = [
  { scroll: 0,    position: [0, 0, 0],       rotation: [0, 0, 0],                         scale: [1, 1, 1] },
  { scroll: 0.25, position: [-0.5, 0.5, -0.5], rotation: [0, Math.PI / 3, Math.PI / 6],   scale: [1.2, 1.2, 1.2] },
  { scroll: 0.5,  position: [0, 0, -1.5],    rotation: [Math.PI / 4, Math.PI / 2, Math.PI / 4], scale: [1.5, 1.5, 1.5] },
  { scroll: 0.75, position: [0.5, -0.5, -0.5], rotation: [Math.PI / 2, 2 * Math.PI / 3, Math.PI / 3], scale: [1.2, 1.2, 1.2] },
  { scroll: 1,    position: [0, 0, 0],       rotation: [Math.PI, Math.PI, Math.PI / 2], scale: [1, 1, 1] },
];


// Interpolation function to calculate current state based on scroll percentage
function interpolateKeyframes(scroll: number, keyframes: Keyframe[]): { position: THREE.Vector3; rotation: THREE.Euler; scale: THREE.Vector3 } {
  if (!keyframes || keyframes.length === 0) {
    return {
      position: new THREE.Vector3(0, 0, 0),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 1)
    };
  }
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
  while (keyframes[i + 1] && keyframes[i + 1].scroll < scroll) {
    i++;
  }

  const k1 = keyframes[i];
  const k2 = keyframes[i + 1];

  if (!k1 || !k2) {
     return {
      position: new THREE.Vector3(0, 0, 0),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 1)
    };
  }

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
    console.log("ThreeScene: Recalculating objectGeometry for theme:", currentTheme);
    if (currentTheme === 'dark') {
      return new THREE.BoxGeometry(1, 1, 1); // Cube for dark theme
    } else {
      return new THREE.ConeGeometry(0.7, 1.5, 32); // Cone for light theme
    }
  }, [currentTheme]);

  const activeKeyframes = useMemo(() => {
    console.log("ThreeScene: Recalculating activeKeyframes for theme:", currentTheme);
    return currentTheme === 'dark' ? darkThemeKeyframes : lightThemeKeyframes;
  }, [currentTheme]);


  useEffect(() => {
    if (typeof window === 'undefined' || !mountRef.current) {
      console.log("ThreeScene: useEffect - window or mountRef not available yet.");
      return;
    }
    const currentMount = mountRef.current;
    console.log("ThreeScene: useEffect triggered. Theme:", currentTheme, "Scroll:", scrollPercentage);
    console.log("ThreeScene: Mount dimensions:", currentMount.clientWidth, "x", currentMount.clientHeight);

    // Initialize Scene, Camera, Renderer, and Lights if they don't exist
    if (!sceneRef.current) sceneRef.current = new THREE.Scene();
    if (!cameraRef.current) {
      cameraRef.current = new THREE.PerspectiveCamera(75, 1, 0.1, 1000); // Aspect ratio updated in resize
      cameraRef.current.position.z = 3;
    }
    if (!rendererRef.current) {
      rendererRef.current = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      rendererRef.current.setPixelRatio(window.devicePixelRatio);
      rendererRef.current.setClearAlpha(0); // Make background transparent
      currentMount.appendChild(rendererRef.current.domElement);
    }
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
    
    // Handle window resize
    const handleResize = () => {
      if (mountRef.current && rendererRef.current && cameraRef.current) {
        const width = mountRef.current.clientWidth;
        const height = Math.max(1, mountRef.current.clientHeight);
        if (width > 0 && height > 0) {
          cameraRef.current.aspect = width / height;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(width, height);
          console.log("ThreeScene: Resized to", width, "x", height);
        }
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial size set

    // Manage Animated Object
    if (animatedObjectRef.current && animatedObjectRef.current.geometry !== objectGeometry) {
      sceneRef.current.remove(animatedObjectRef.current);
      animatedObjectRef.current.geometry.dispose();
      if (animatedObjectRef.current.material instanceof THREE.Material) {
        animatedObjectRef.current.material.dispose();
      }
      animatedObjectRef.current = null;
    }

    if (!animatedObjectRef.current) {
      const material = new THREE.MeshStandardMaterial();
      animatedObjectRef.current = new THREE.Mesh(objectGeometry, material);
      sceneRef.current.add(animatedObjectRef.current);
      console.log("ThreeScene: New animated object created. Type:", currentTheme === 'dark' ? 'Cube' : 'Cone');
    }

    // Apply Theme Specifics
    // Scene background is transparent (alpha: true for renderer, renderer.setClearAlpha(0))
    sceneRef.current.background = null;

    if (animatedObjectRef.current && animatedObjectRef.current.material instanceof THREE.MeshStandardMaterial) {
      if (currentTheme === 'dark') { // Royal Purple Dark Theme (Cube)
        console.log("ThreeScene: Applying Dark Theme specifics");
        animatedObjectRef.current.material.color.set(0x9370DB); // Medium Purple for Cube
        animatedObjectRef.current.material.metalness = 0.4;
        animatedObjectRef.current.material.roughness = 0.5;
        
        ambientLightRef.current.color.set(0x503075); // Darker ambient for mood
        ambientLightRef.current.intensity = 1.0; 
        directionalLightRef.current.color.setHSL(280 / 360, 0.70, 0.60); // Royal purple main light
        directionalLightRef.current.intensity = 1.8; 
        directionalLightRef.current.position.set(1, 2, 3);
        accentLightRef.current.color.setHSL(300 / 360, 0.75, 0.70); // Magenta/violet accent
        accentLightRef.current.intensity = 25; 
        accentLightRef.current.distance = 50;
        accentLightRef.current.position.set(-2, -1, 1);

      } else { // Light Purple Theme (Cone)
        console.log("ThreeScene: Applying Light Theme specifics");
        animatedObjectRef.current.material.color.set(0xBDA0CB); // Soft purple / Light lavender for Cone
        animatedObjectRef.current.material.metalness = 0.3;
        animatedObjectRef.current.material.roughness = 0.6;

        ambientLightRef.current.color.set(0xE0D8F0); // Light lavender ambient
        ambientLightRef.current.intensity = 1.5;
        directionalLightRef.current.color.setHSL(270 / 360, 0.65, 0.85); // Main light purple
        directionalLightRef.current.intensity = 1.2;
        directionalLightRef.current.position.set(-1, 2, 2);
        accentLightRef.current.color.setHSL(285 / 360, 0.70, 0.80); // Brighter purple accent
        accentLightRef.current.intensity = 20;
        accentLightRef.current.distance = 40;
        accentLightRef.current.position.set(2, 1, 0);
      }
      animatedObjectRef.current.material.needsUpdate = true;
    }

    // Animation Loop
    const animate = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !animatedObjectRef.current) {
        return;
      }
      
      const { position, rotation, scale } = interpolateKeyframes(scrollPercentage, activeKeyframes);
      animatedObjectRef.current.position.copy(position);
      animatedObjectRef.current.rotation.copy(rotation);
      animatedObjectRef.current.scale.copy(scale);
      
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    // Use setAnimationLoop for better performance and WebXR compatibility
    if (rendererRef.current) {
        rendererRef.current.setAnimationLoop(animate);
    }

    // Cleanup
    return () => {
      console.log("ThreeScene: Cleanup for instance (theme:", currentTheme, ")");
      window.removeEventListener('resize', handleResize);
      
      if (rendererRef.current) {
        rendererRef.current.setAnimationLoop(null); // Stop the animation loop
      }
      // The key prop in RootLayout handles full unmount, so more aggressive cleanup here might be redundant
      // unless specific issues arise from not disposing these on quick re-renders before unmount.
      // For now, if animatedObjectRef is still valid, ensure it's removed from scene
      // if (sceneRef.current && animatedObjectRef.current) {
      //    sceneRef.current.remove(animatedObjectRef.current);
      //    animatedObjectRef.current.geometry.dispose();
      //    if (animatedObjectRef.current.material instanceof THREE.Material) {
      //      animatedObjectRef.current.material.dispose();
      //    }
      //    animatedObjectRef.current = null;
      // }
      // Full disposal of renderer, scene, lights, etc., is best handled when the component
      // is guaranteed to unmount, which the key prop helps ensure.
    };
  }, [currentTheme, scrollPercentage, objectGeometry, activeKeyframes]); // Key dependencies

  return <div ref={mountRef} className="fixed inset-0 -z-10 w-screen h-screen" />;
};

export default ThreeScene;

    