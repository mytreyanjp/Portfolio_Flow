
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

  const sceneBackgroundColor = useMemo(() => {
    // Light theme: Very light, almost white lavender (matches CSS --background H:275 S:80 L:97)
    // Dark theme: Very dark purple (matches CSS --background H:270 S:40 L:10)
    return currentTheme === 'dark' 
      ? new THREE.Color().setHSL(270/360, 0.40, 0.10) 
      : new THREE.Color().setHSL(275/360, 0.80, 0.97);
  }, [currentTheme]);

  const objectGeometry = useMemo(() => {
    return currentTheme === 'dark' 
      ? new THREE.ConeGeometry(0.8, 1.6, 32) 
      : new THREE.BoxGeometry(1.1, 1.1, 1.1);
  }, [currentTheme]);

  const objectMaterialColor = useMemo(() => {
    // Light theme object: Soft purple (lighter than UI primary: H:270 S:65 L:75)
    // Dark theme object: Light lavender (matches dark theme text H:275 S:60 L:90)
    return currentTheme === 'dark' 
      ? new THREE.Color().setHSL(275/360, 0.60, 0.90)
      : new THREE.Color().setHSL(270/360, 0.65, 0.75);
  }, [currentTheme]);

  const activeKeyframes = useMemo(() => {
    return currentTheme === 'dark' ? darkThemeKeyframes : lightThemeKeyframes;
  }, [currentTheme]);


  useEffect(() => {
    if (typeof window === 'undefined' || !mountRef.current) return;

    const currentMount = mountRef.current;

    const scene = new THREE.Scene();
    scene.background = sceneBackgroundColor;
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.z = 3; 
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Light theme ambient: 0.9; Dark theme ambient: 0.6
    const ambientLight = new THREE.AmbientLight(0xffffff, currentTheme === 'dark' ? 0.6 : 0.9);
    scene.add(ambientLight);

    // Directional Light
    // Light theme: Softer, H:275 S:60 L:90; Dark theme: Muted, H:270 S:30 L:35
    const directionalLightColor = currentTheme === 'dark' 
        ? new THREE.Color().setHSL(270/360, 0.30, 0.35)
        : new THREE.Color().setHSL(275/360, 0.60, 0.90);
    const directionalLightIntensity = currentTheme === 'dark' ? 0.7 : 0.8;
    const directionalLight = new THREE.DirectionalLight(directionalLightColor, directionalLightIntensity);
    directionalLight.position.set(currentTheme === 'dark' ? -3 : 3, 3, 4).normalize();
    scene.add(directionalLight);
    
    // Accent Light
    // Light theme: Brighter purple accent, H:285 S:70 L:80; Dark theme: Brighter magenta accent, H:300 S:75 L:75
    const accentLightColor = currentTheme === 'dark' 
        ? new THREE.Color().setHSL(300/360, 0.75, 0.75) 
        : new THREE.Color().setHSL(285/360, 0.70, 0.80);
    const accentLight = new THREE.PointLight(accentLightColor, currentTheme === 'dark' ? 1.2 : 1.5, 120); 
    accentLight.position.set(currentTheme === 'dark' ? 2.5 : -2.5, 2.5, 2.5);
    scene.add(accentLight);

    const material = new THREE.MeshStandardMaterial({ 
        color: objectMaterialColor,
        metalness: currentTheme === 'dark' ? 0.4 : 0.2,
        roughness: currentTheme === 'dark' ? 0.5 : 0.7,
    }); 
    const animatedObject = new THREE.Mesh(objectGeometry, material);
    scene.add(animatedObject);
    animatedObjectRef.current = animatedObject;

    interpolateKeyframes(0, animatedObjectRef.current, activeKeyframes);


    const animate = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !animatedObjectRef.current) return;
      requestAnimationFrame(animate);
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };
    animate();

    const handleResize = () => {
      if (currentMount && rendererRef.current && cameraRef.current) {
        cameraRef.current.aspect = currentMount.clientWidth / currentMount.clientHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (currentMount && rendererRef.current?.domElement) {
        if (currentMount.contains(rendererRef.current.domElement)) {
            currentMount.removeChild(rendererRef.current.domElement);
        }
      }
      rendererRef.current?.dispose();
      if (animatedObjectRef.current) {
        if(animatedObjectRef.current.geometry) animatedObjectRef.current.geometry.dispose();
        if(Array.isArray(animatedObjectRef.current.material)) {
            animatedObjectRef.current.material.forEach(mat => mat.dispose());
        } else if (animatedObjectRef.current.material) {
            (animatedObjectRef.current.material as THREE.Material).dispose();
        }
      }
      sceneRef.current = null;
      cameraRef.current = null;
      animatedObjectRef.current = null;
    };
  // IMPORTANT: Add all dependencies that influence the scene setup
  }, [currentTheme, sceneBackgroundColor, objectGeometry, objectMaterialColor, activeKeyframes]); 

  useEffect(() => {
    if (animatedObjectRef.current) {
      interpolateKeyframes(scrollPercentage, animatedObjectRef.current, activeKeyframes);
    }
  }, [scrollPercentage, activeKeyframes]);

  // Effect to update scene elements when theme changes, if not already handled by re-creation
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.background = sceneBackgroundColor;
    }
    if (animatedObjectRef.current && animatedObjectRef.current.material) {
      const material = animatedObjectRef.current.material as THREE.MeshStandardMaterial;
      material.color = objectMaterialColor; // Directly assign the THREE.Color object
      material.metalness = currentTheme === 'dark' ? 0.4 : 0.2;
      material.roughness = currentTheme === 'dark' ? 0.5 : 0.7;
      material.needsUpdate = true;
    }
    if (sceneRef.current) {
        const ambient = sceneRef.current.children.find(c => c instanceof THREE.AmbientLight) as THREE.AmbientLight | undefined;
        if (ambient) ambient.intensity = currentTheme === 'dark' ? 0.6 : 0.9;

        const directional = sceneRef.current.children.find(c => c instanceof THREE.DirectionalLight) as THREE.DirectionalLight | undefined;
        if (directional) {
            directional.intensity = currentTheme === 'dark' ? 0.7 : 0.8;
            directional.color = currentTheme === 'dark' 
                ? new THREE.Color().setHSL(270/360, 0.30, 0.35)
                : new THREE.Color().setHSL(275/360, 0.60, 0.90);
            directional.position.set(currentTheme === 'dark' ? -3 : 3, 3, 4).normalize();
        }
        
        const point = sceneRef.current.children.find(c => c instanceof THREE.PointLight) as THREE.PointLight | undefined;
        if(point) {
            point.color = currentTheme === 'dark' 
                ? new THREE.Color().setHSL(300/360, 0.75, 0.75) 
                : new THREE.Color().setHSL(285/360, 0.70, 0.80);
            point.intensity = currentTheme === 'dark' ? 1.2 : 1.5;
            point.position.set(currentTheme === 'dark' ? 2.5 : -2.5, 2.5, 2.5);
        }
    }

  // IMPORTANT: Add all dependencies that influence these updates
  }, [currentTheme, sceneBackgroundColor, objectMaterialColor]);


  return <div ref={mountRef} className="fixed inset-0 -z-10 w-screen h-screen" />;
};

export default ThreeScene;
