
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

// Cone for Light Theme (Light Purple)
const lightThemeKeyframes: Keyframe[] = [
  { scroll: 0, position: [0, -1, 0], rotation: [0, 0, 0], scale: [0.8, 1.2, 0.8] },
  { scroll: 0.25, position: [1, 0, -1], rotation: [Math.PI / 4, Math.PI / 4, 0], scale: [1, 1.5, 1] },
  { scroll: 0.5, position: [0, 1, -2], rotation: [Math.PI / 2, Math.PI / 2, Math.PI / 4], scale: [1.2, 1.8, 1.2] },
  { scroll: 0.75, position: [-1, 0, -1], rotation: [3 * Math.PI / 4, 3 * Math.PI / 4, Math.PI / 2], scale: [1, 1.5, 1] },
  { scroll: 1, position: [0, -1, 0], rotation: [Math.PI, Math.PI, 3 * Math.PI / 4], scale: [0.8, 1.2, 0.8] },
];

// Cube for Dark Theme (Royal Purple)
const darkThemeKeyframes: Keyframe[] = [
  { scroll: 0, position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  { scroll: 0.25, position: [-0.5, 0.5, -0.5], rotation: [0, Math.PI / 3, Math.PI / 6], scale: [1.2, 1.2, 1.2] },
  { scroll: 0.5, position: [0, 0, -1.5], rotation: [Math.PI / 4, Math.PI / 2, Math.PI / 4], scale: [1.5, 1.5, 1.5] },
  { scroll: 0.75, position: [0.5, -0.5, -0.5], rotation: [Math.PI / 2, 2 * Math.PI / 3, Math.PI / 3], scale: [1.2, 1.2, 1.2] },
  { scroll: 1, position: [0, 0, 0], rotation: [Math.PI, Math.PI, Math.PI / 2], scale: [1, 1, 1] },
];

function interpolateKeyframes(scroll: number, keyframes: Keyframe[]): { position: THREE.Vector3; rotation: THREE.Euler; scale: THREE.Vector3 } {
  if (!keyframes || keyframes.length === 0) {
    // Return a default state if keyframes are undefined or empty
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

  if (!k1 || !k2) { // Should not happen if scroll is within bounds
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

    if (currentMount.clientWidth === 0 || currentMount.clientHeight === 0) {
      console.warn("ThreeScene: Mount dimensions are zero. Renderer might not display correctly yet.");
    }

    // Initialize Scene, Camera, Renderer ONCE or if they don't exist
    if (!sceneRef.current) {
      sceneRef.current = new THREE.Scene();
      console.log("ThreeScene: Scene created");
    }
    if (!cameraRef.current) {
      cameraRef.current = new THREE.PerspectiveCamera(
        75,
        currentMount.clientWidth / Math.max(1, currentMount.clientHeight), // Avoid division by zero
        0.1,
        1000
      );
      cameraRef.current.position.z = 3;
      console.log("ThreeScene: Camera created");
    } else {
      // Update camera aspect ratio if it exists (on resize or remount)
      if (currentMount.clientWidth > 0 && currentMount.clientHeight > 0) {
         cameraRef.current.aspect = currentMount.clientWidth / currentMount.clientHeight;
         cameraRef.current.updateProjectionMatrix();
      }
    }

    if (!rendererRef.current) {
      rendererRef.current = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // Enable alpha for transparency
      rendererRef.current.setPixelRatio(window.devicePixelRatio);
      currentMount.appendChild(rendererRef.current.domElement);
      console.log("ThreeScene: Renderer created and appended");
    }
    if (currentMount.clientWidth > 0 && currentMount.clientHeight > 0) {
       rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
    }
    rendererRef.current.setClearAlpha(0); // Make sure background is transparent

    // Manage Lights ONCE or if they don't exist
    if (!ambientLightRef.current) {
      ambientLightRef.current = new THREE.AmbientLight();
      sceneRef.current.add(ambientLightRef.current);
      console.log("ThreeScene: AmbientLight created");
    }
    if (!directionalLightRef.current) {
      directionalLightRef.current = new THREE.DirectionalLight();
      sceneRef.current.add(directionalLightRef.current);
      console.log("ThreeScene: DirectionalLight created");
    }
    if (!accentLightRef.current) {
      accentLightRef.current = new THREE.PointLight();
      sceneRef.current.add(accentLightRef.current);
      console.log("ThreeScene: AccentLight created");
    }

    // Manage Animated Object (Cube or Cone)
    // If geometry type changes, remove old and add new
    if (animatedObjectRef.current && animatedObjectRef.current.geometry !== objectGeometry) {
      console.log("ThreeScene: Geometry changed, removing old object.");
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
      console.log("ThreeScene: New animated object created and added. Type:", currentTheme === 'dark' ? 'Cube' : 'Cone');
    }


    // Apply Theme Specifics
    // Scene background is now transparent (alpha: true for renderer, no scene.background color set)
    sceneRef.current.background = null; // Explicitly set to null for transparency

    if (currentTheme === 'dark') { // Royal Purple Dark Theme (Cube)
      console.log("ThreeScene: Applying Dark Theme specifics");
      if (animatedObjectRef.current && animatedObjectRef.current.material instanceof THREE.MeshStandardMaterial) {
        animatedObjectRef.current.material.color.set(0x9370DB); // Medium Purple for Cube
        animatedObjectRef.current.material.metalness = 0.4;
        animatedObjectRef.current.material.roughness = 0.5;
        animatedObjectRef.current.material.needsUpdate = true;
      }
      ambientLightRef.current.color.set(0x503075);
      ambientLightRef.current.intensity = 1.0; // Slightly increased
      directionalLightRef.current.color.setHSL(280 / 360, 0.70, 0.60);
      directionalLightRef.current.intensity = 1.8; // Slightly increased
      directionalLightRef.current.position.set(1, 2, 3);
      accentLightRef.current.color.setHSL(300 / 360, 0.75, 0.70);
      accentLightRef.current.intensity = 25; // PointLight intensity is power
      accentLightRef.current.distance = 50;
      accentLightRef.current.position.set(-2, -1, 1);
    } else { // Light Purple Theme (Cone)
      console.log("ThreeScene: Applying Light Theme specifics");
      if (animatedObjectRef.current && animatedObjectRef.current.material instanceof THREE.MeshStandardMaterial) {
        animatedObjectRef.current.material.color.set(0xBDA0CB); // Soft purple / Light lavender for Cone
        animatedObjectRef.current.material.metalness = 0.3;
        animatedObjectRef.current.material.roughness = 0.6;
        animatedObjectRef.current.material.needsUpdate = true;
      }
      ambientLightRef.current.color.set(0xE0D8F0);
      ambientLightRef.current.intensity = 1.5; // Slightly increased
      directionalLightRef.current.color.setHSL(270 / 360, 0.65, 0.85);
      directionalLightRef.current.intensity = 1.2; // Slightly increased
      directionalLightRef.current.position.set(-1, 2, 2);
      accentLightRef.current.color.setHSL(285 / 360, 0.70, 0.80);
      accentLightRef.current.intensity = 20;
      accentLightRef.current.distance = 40;
      accentLightRef.current.position.set(2, 1, 0);
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
        const height = Math.max(1, mountRef.current.clientHeight); // Ensure height is not 0
        if (width > 0 && height > 0) {
          cameraRef.current.aspect = width / height;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(width, height);
          console.log("ThreeScene: Resized to", width, "x", height);
        } else {
          console.warn("ThreeScene: Resize handler called with zero dimensions.");
        }
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Call once to set initial size

    // Cleanup for THIS INSTANCE when it unmounts (e.g., due to key change)
    return () => {
      console.log("ThreeScene: Cleanup for instance (theme:", currentTheme, ")");
      window.removeEventListener('resize', handleResize);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      // More comprehensive cleanup should happen if renderer, scene, etc. are recreated on each effect run.
      // If they are intended to persist across scrollPercentage changes but re-init on theme change,
      // this cleanup needs to be more careful.
      // Given the key prop in layout, renderer, scene etc. should be cleaned up when the component unmounts fully.
       if (animatedObjectRef.current) {
          sceneRef.current?.remove(animatedObjectRef.current);
          animatedObjectRef.current.geometry.dispose();
          if (animatedObjectRef.current.material instanceof THREE.Material) {
            animatedObjectRef.current.material.dispose();
          }
          animatedObjectRef.current = null;
          console.log("ThreeScene: Cleaned up animated object.");
      }
      // Don't dispose of renderer, scene, lights here if they are meant to persist for this component instance
      // and only get re-created when the component remounts due to key change.
      // The key prop in layout.tsx should handle the full unmount/remount.
    };
  }, [currentTheme, scrollPercentage, objectGeometry, activeKeyframes]); // Key dependencies

  return <div ref={mountRef} className="fixed inset-0 -z-10 w-screen h-screen" />;
};

export default ThreeScene;
