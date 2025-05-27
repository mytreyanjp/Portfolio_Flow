
'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';

interface ThreeSceneProps {
  scrollPercentage: number;
  currentTheme?: 'light' | 'dark';
}

interface Keyframe {
  scroll: number; // 0 to 1
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
}

// Keyframes for the Light Theme (Cube - Light Purple Vibe)
const lightThemeKeyframes: Keyframe[] = [
  { scroll: 0,    position: new THREE.Vector3(0, -0.2, -1.8), rotation: new THREE.Euler(0.1, 0.1, 0), scale: new THREE.Vector3(1, 1, 1) },
  { scroll: 0.25, position: new THREE.Vector3(-1.5, 0.3, -1.2), rotation: new THREE.Euler(0.15, Math.PI / 7, 0.05), scale: new THREE.Vector3(1.05, 1.05, 1.05) },
  { scroll: 0.5,  position: new THREE.Vector3(0, 0.8, -0.5),  rotation: new THREE.Euler(0.25, Math.PI / 5, 0), scale: new THREE.Vector3(1.15, 1.15, 1.15) },
  { scroll: 0.75, position: new THREE.Vector3(1.5, 0.3, -1.2), rotation: new THREE.Euler(0.15, Math.PI / 3, -0.05), scale: new THREE.Vector3(1.05, 1.05, 1.05) },
  { scroll: 1,    position: new THREE.Vector3(0, -0.2, -1.8), rotation: new THREE.Euler(0.1, Math.PI / 2.5, 0), scale: new THREE.Vector3(1, 1, 1) },
];

// Keyframes for the Dark Theme (Cone - Royal Purple Vibe)
const darkThemeKeyframes: Keyframe[] = [
  { scroll: 0,    position: new THREE.Vector3(0, 0, -2.2), rotation: new THREE.Euler(Math.PI / 16, 0, 0), scale: new THREE.Vector3(0.9, 0.9, 0.9) },
  { scroll: 0.25, position: new THREE.Vector3(1.2, -0.8, -2.8), rotation: new THREE.Euler(Math.PI / 5, Math.PI / 2.2, Math.PI / 7), scale: new THREE.Vector3(1.1, 1.1, 0.7) },
  { scroll: 0.5,  position: new THREE.Vector3(0, 0.6, -1.8),  rotation: new THREE.Euler(Math.PI / 2.5, Math.PI * 0.9, Math.PI / 3.5), scale: new THREE.Vector3(0.7, 0.7, 1.4) },
  { scroll: 0.75, position: new THREE.Vector3(-1.2, 0.8, -2.8), rotation: new THREE.Euler((2.8 * Math.PI) / 4, (1.4 * Math.PI), Math.PI / 2.2), scale: new THREE.Vector3(1.1, 1.1, 0.7) },
  { scroll: 1,    position: new THREE.Vector3(0, 0, -2.2), rotation: new THREE.Euler(Math.PI * 0.9, 2 * Math.PI, Math.PI * 0.9), scale: new THREE.Vector3(0.9, 0.9, 0.9) },
];

function interpolateKeyframes(scrollPercentage: number, object: THREE.Object3D | null, themeKeyframes: Keyframe[]) {
  if (!object || !themeKeyframes || themeKeyframes.length === 0) return;

  let prevKeyframe = themeKeyframes[0];
  let nextKeyframe = themeKeyframes[themeKeyframes.length - 1];

  for (let i = 0; i < themeKeyframes.length - 1; i++) {
    if (scrollPercentage >= themeKeyframes[i].scroll && scrollPercentage <= themeKeyframes[i+1].scroll) {
      prevKeyframe = themeKeyframes[i];
      nextKeyframe = themeKeyframes[i+1];
      break;
    }
  }
  
  if (scrollPercentage < themeKeyframes[0].scroll) {
      object.position.copy(themeKeyframes[0].position);
      object.rotation.copy(themeKeyframes[0].rotation);
      object.scale.copy(themeKeyframes[0].scale);
      return;
  }
  if (scrollPercentage >= themeKeyframes[themeKeyframes.length - 1].scroll) {
      object.position.copy(themeKeyframes[themeKeyframes.length - 1].position);
      object.rotation.copy(themeKeyframes[themeKeyframes.length - 1].rotation);
      object.scale.copy(themeKeyframes[themeKeyframes.length - 1].scale);
      return;
  }

  const t = (scrollPercentage - prevKeyframe.scroll) / (nextKeyframe.scroll - prevKeyframe.scroll || 1);

  object.position.lerpVectors(prevKeyframe.position, nextKeyframe.position, t);

  const qPrev = new THREE.Quaternion().setFromEuler(prevKeyframe.rotation);
  const qNext = new THREE.Quaternion().setFromEuler(nextKeyframe.rotation);
  const qInterp = new THREE.Quaternion().slerpQuaternions(qPrev, qNext, t);
  object.rotation.setFromQuaternion(qInterp);

  object.scale.lerpVectors(prevKeyframe.scale, nextKeyframe.scale, t);
}


const ThreeScene: React.FC<ThreeSceneProps> = ({ scrollPercentage, currentTheme = 'light' }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animatedObjectRef = useRef<THREE.Mesh | null>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null); // Ref for material

  const objectGeometry = useMemo(() => {
    console.log(`ThreeScene: Recalculating geometry for theme: ${currentTheme}`);
    return currentTheme === 'dark'
      ? new THREE.ConeGeometry(0.8, 1.6, 32) 
      : new THREE.BoxGeometry(1.1, 1.1, 1.1); 
  }, [currentTheme]);

  const activeKeyframes = useMemo(() => {
    return currentTheme === 'dark' ? darkThemeKeyframes : lightThemeKeyframes;
  }, [currentTheme]);

  useEffect(() => {
    if (typeof window === 'undefined' || !mountRef.current) return;
    const currentMount = mountRef.current;

    console.log(`ThreeScene MAIN useEffect: Theme: ${currentTheme}, Scroll: ${scrollPercentage}, Mount Dims: ${currentMount.clientWidth}x${currentMount.clientHeight}`);

    // --- Initialize Scene, Camera, Renderer (if not already) ---
    if (!rendererRef.current) {
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
      camera.position.z = 3;
      cameraRef.current = camera;
      
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      rendererRef.current = renderer;
      currentMount.appendChild(renderer.domElement);
      
      // Material (create once)
      materialRef.current = new THREE.MeshStandardMaterial();

      // Lights (create once and add to scene)
      const ambientLight = new THREE.AmbientLight();
      scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight();
      scene.add(directionalLight);
      const accentLight = new THREE.PointLight();
      scene.add(accentLight);

      // Resize handler
      const handleResize = () => {
        if (mountRef.current && rendererRef.current && cameraRef.current) {
          const width = mountRef.current.clientWidth;
          const height = mountRef.current.clientHeight;
          if (width > 0 && height > 0) {
            cameraRef.current.aspect = width / height;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(width, height);
          }
        }
      };
      window.addEventListener('resize', handleResize);
      handleResize(); // Initial size setup

       // Animation loop
      const animate = () => {
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      };
      renderer.setAnimationLoop(animate); // Use setAnimationLoop
    }
    
    // --- Update existing object or create new if geometry changed ---
    if (sceneRef.current && materialRef.current) {
        if (animatedObjectRef.current && animatedObjectRef.current.geometry !== objectGeometry) {
            sceneRef.current.remove(animatedObjectRef.current);
            animatedObjectRef.current.geometry.dispose();
            animatedObjectRef.current = null; 
        }
        if (!animatedObjectRef.current) {
            animatedObjectRef.current = new THREE.Mesh(objectGeometry, materialRef.current);
            sceneRef.current.add(animatedObjectRef.current);
        }
    }
    
    // --- Apply Theme Specifics (colors, lighting properties) ---
    const scene = sceneRef.current;
    const material = materialRef.current; // Use the ref
    const ambientLight = scene?.children.find(c => c instanceof THREE.AmbientLight) as THREE.AmbientLight | undefined;
    const directionalLight = scene?.children.find(c => c instanceof THREE.DirectionalLight) as THREE.DirectionalLight | undefined;
    const accentLight = scene?.children.find(c => c instanceof THREE.PointLight) as THREE.PointLight | undefined;

    if (scene && material && ambientLight && directionalLight && accentLight && animatedObjectRef.current) {
      animatedObjectRef.current.visible = true; // Ensure visibility

      if (currentTheme === 'dark') {
        console.log("ThreeScene: Applying DARK theme visuals.");
        scene.background = new THREE.Color().setHSL(270/360, 0.40, 0.10); // Dark Violet
        
        material.color.setHSL(275/360, 0.60, 0.90); // Light lavender/silver for Cone
        material.metalness = 0.4;
        material.roughness = 0.5;
        
        ambientLight.color.setHex(0xffffff); // White ambient light
        ambientLight.intensity = 0.3;
        
        directionalLight.color.setHSL(270/360, 0.30, 0.35); // Muted purple
        directionalLight.intensity = 0.7;
        directionalLight.position.set(-3, 3, 4).normalize();
        
        accentLight.color.setHSL(300/360, 0.75, 0.75); // Magenta/violet
        accentLight.intensity = 1.5; 
        accentLight.distance = 10;
        accentLight.decay = 2;
        accentLight.position.set(2.5, 2.5, 2.5);

      } else { // Light Theme
        console.log("ThreeScene: Applying LIGHT theme visuals.");
        scene.background = new THREE.Color().setHSL(275/360, 0.80, 0.97); // Very light lavender
        
        material.color.setHSL(270/360, 0.65, 0.35); // Soft purple for Cube
        material.metalness = 0.2;
        material.roughness = 0.7;

        ambientLight.color.setHex(0xffffff); // White ambient light
        ambientLight.intensity = 0.9;

        directionalLight.color.setHSL(275/360, 0.60, 0.90); // Light lavender light
        directionalLight.intensity = 0.8;
        directionalLight.position.set(3, 3, 4).normalize();
        
        accentLight.color.setHSL(285/360, 0.70, 0.80); // Pinkish purple accent
        accentLight.intensity = 1.8; 
        accentLight.distance = 10;
        accentLight.decay = 2;
        accentLight.position.set(-2.5, 2.5, 2.5);
      }
      material.needsUpdate = true;

      // Interpolate object position based on current scroll and theme
      interpolateKeyframes(scrollPercentage, animatedObjectRef.current, activeKeyframes);
    }
    
    // --- Cleanup ---
    // Cleanup is implicitly handled by the `key` prop causing a full remount.
    // The old instance's `useEffect` return function (if it had one for renderer.dispose etc.) would run.
    // For this setup, direct disposal on unmount is complex because `key` causes unmount.
    // The browser will garbage collect Three.js objects if refs are lost.
    // A more robust cleanup would involve explicitly stopping animation loop & disposing renderer in a returned function,
    // but this can be tricky with the `key` prop.
    // For now, relying on remount.

  }, [objectGeometry, activeKeyframes, scrollPercentage, currentTheme]); // Key dependencies

  // Effect for scroll-based animation of the object - already handled in main effect
  // useEffect(() => {
  //   if (animatedObjectRef.current && activeKeyframes.length > 0) {
  //     interpolateKeyframes(scrollPercentage, animatedObjectRef.current, activeKeyframes);
  //   }
  // }, [scrollPercentage, activeKeyframes]);


  return <div ref={mountRef} className="fixed inset-0 -z-10 w-screen h-screen" />;
};

export default ThreeScene;

    