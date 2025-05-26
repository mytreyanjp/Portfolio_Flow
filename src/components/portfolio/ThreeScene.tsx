
'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';

interface ThreeSceneProps {
  scrollPercentage: number;
  currentTheme?: 'light' | 'dark'; // Added theme prop
}

interface Keyframe {
  scroll: number; // 0 to 1
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
}

const keyframes: Keyframe[] = [
  { scroll: 0,    position: new THREE.Vector3(0, 0, -2), rotation: new THREE.Euler(0, 0, 0), scale: new THREE.Vector3(1, 1, 1) },
  { scroll: 0.25, position: new THREE.Vector3(-3, 1, -1.5), rotation: new THREE.Euler(Math.PI / 6, Math.PI / 4, Math.PI / 8), scale: new THREE.Vector3(1.2, 1.2, 1.2) },
  { scroll: 0.5,  position: new THREE.Vector3(0, 1.5, 0),  rotation: new THREE.Euler(Math.PI / 3, Math.PI / 2, Math.PI / 4), scale: new THREE.Vector3(1.5, 1.5, 1.5) },
  { scroll: 0.75, position: new THREE.Vector3(3, -1, -1.5), rotation: new THREE.Euler(Math.PI / 2, (2 * Math.PI) / 3, Math.PI / 3), scale: new THREE.Vector3(1.2, 1.2, 1.2) },
  { scroll: 1,    position: new THREE.Vector3(0, -0.5, -2), rotation: new THREE.Euler(Math.PI, Math.PI, Math.PI / 2), scale: new THREE.Vector3(1, 1, 1) },
];

function interpolateKeyframes(scrollPercentage: number, object: THREE.Object3D | null) {
  if (!object) return;

  let prevKeyframe = keyframes[0];
  let nextKeyframe = keyframes[keyframes.length - 1];

  for (let i = 0; i < keyframes.length - 1; i++) {
    if (scrollPercentage >= keyframes[i].scroll && scrollPercentage <= keyframes[i+1].scroll) {
      prevKeyframe = keyframes[i];
      nextKeyframe = keyframes[i+1];
      break;
    }
  }
  
  if (scrollPercentage < keyframes[0].scroll) {
      object.position.copy(keyframes[0].position);
      object.rotation.copy(keyframes[0].rotation);
      object.scale.copy(keyframes[0].scale);
      return;
  }
  if (scrollPercentage >= keyframes[keyframes.length - 1].scroll) {
      object.position.copy(keyframes[keyframes.length - 1].position);
      object.rotation.copy(keyframes[keyframes.length - 1].rotation);
      object.scale.copy(keyframes[keyframes.length - 1].scale);
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
  const animatedObjectRef = useRef<THREE.Mesh | null>(null); // Renamed from cubeRef

  // Theme-dependent properties
  const sceneBackgroundColor = useMemo(() => {
    return currentTheme === 'dark' ? new THREE.Color(0x301934) : new THREE.Color(0xF0F8FF); // Dark Purple vs AliceBlue
  }, [currentTheme]);

  const objectGeometry = useMemo(() => {
    return currentTheme === 'dark' 
      ? new THREE.ConeGeometry(0.7, 1.5, 32) // Cone for dark theme
      : new THREE.BoxGeometry(1, 1, 1);    // Cube for light theme
  }, [currentTheme]);

  const objectMaterialColor = useMemo(() => {
    return currentTheme === 'dark' ? 0xD8BFD8 : 0xECD8AE; // Light Lavender vs Sandy
  }, [currentTheme]);


  useEffect(() => {
    if (typeof window === 'undefined' || !mountRef.current) return;

    const currentMount = mountRef.current;

    // Scene
    const scene = new THREE.Scene();
    scene.background = sceneBackgroundColor;
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.z = 3.5; 
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, currentTheme === 'dark' ? 0.5 : 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, currentTheme === 'dark' ? 0.4 : 0.7);
    directionalLight.position.set(5, 5, 5).normalize();
    scene.add(directionalLight);
    
    const accentLightColor = currentTheme === 'dark' ? 0xC8A2C8 : 0xFFD700; // Lilac vs Gold
    const accentLight = new THREE.PointLight(accentLightColor, currentTheme === 'dark' ? 1.0 : 1.2, 100); 
    accentLight.position.set(currentTheme === 'dark' ? 2 : -2, 2, 2);
    scene.add(accentLight);


    // Animated Object (Cube or Cone)
    const material = new THREE.MeshStandardMaterial({ 
        color: objectMaterialColor,
        metalness: 0.3,
        roughness: 0.6,
    }); 
    const animatedObject = new THREE.Mesh(objectGeometry, material);
    scene.add(animatedObject);
    animatedObjectRef.current = animatedObject;

    // Initial positioning based on scroll 0
    interpolateKeyframes(0, animatedObjectRef.current);


    // Animation loop
    const animate = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !animatedObjectRef.current) return;
      requestAnimationFrame(animate);
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (currentMount && rendererRef.current && cameraRef.current) {
        cameraRef.current.aspect = currentMount.clientWidth / currentMount.clientHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (currentMount && rendererRef.current?.domElement) {
        if (currentMount.contains(rendererRef.current.domElement)) {
            currentMount.removeChild(rendererRef.current.domElement);
        }
      }
      rendererRef.current?.dispose();
      // Dispose geometries and materials if they are being recreated
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
  // IMPORTANT: Re-run setup if theme changes to recreate objects with new geometry/colors
  }, [currentTheme, sceneBackgroundColor, objectGeometry, objectMaterialColor]); 

  // Effect to update object based on scrollPercentage prop
  useEffect(() => {
    if (animatedObjectRef.current) {
      interpolateKeyframes(scrollPercentage, animatedObjectRef.current);
    }
  }, [scrollPercentage]);

  // Effect to update scene background and object materials if theme changes dynamically
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.background = sceneBackgroundColor;
    }
    if (animatedObjectRef.current && animatedObjectRef.current.material) {
      // If material is an array, handle it properly. For now, assume single material.
      ((animatedObjectRef.current.material as THREE.MeshStandardMaterial)).color.setHex(objectMaterialColor);
      
      // If geometry needs to change and is not handled by full re-render, update here
      // This is more complex if the geometry type changes fundamentally.
      // The current setup relies on the main useEffect re-running due to prop changes.
    }
    // Update lights based on theme
    if (sceneRef.current) {
        const ambient = sceneRef.current.children.find(c => c.type === 'AmbientLight') as THREE.AmbientLight;
        if (ambient) ambient.intensity = currentTheme === 'dark' ? 0.5 : 0.8;

        const directional = sceneRef.current.children.find(c => c.type === 'DirectionalLight') as THREE.DirectionalLight;
        if (directional) directional.intensity = currentTheme === 'dark' ? 0.4 : 0.7;
        
        const point = sceneRef.current.children.find(c => c.type === 'PointLight') as THREE.PointLight;
        if(point) {
            point.color.setHex(currentTheme === 'dark' ? 0xC8A2C8 : 0xFFD700);
            point.intensity = currentTheme === 'dark' ? 1.0 : 1.2;
            point.position.set(currentTheme === 'dark' ? 2 : -2, 2, 2);
        }
    }

  }, [currentTheme, sceneBackgroundColor, objectMaterialColor]);


  return <div ref={mountRef} className="fixed inset-0 -z-10 w-screen h-screen" />;
};

export default ThreeScene;
