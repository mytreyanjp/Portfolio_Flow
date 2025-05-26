
'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
// OrbitControls are removed as they are not typically used for a background element.
// If you need them for debugging, you can re-add them.
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface ThreeSceneProps {
  scrollPercentage: number;
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
  
  object.rotation.x = THREE.MathUtils.lerp(prevKeyframe.rotation.x, nextKeyframe.rotation.x, t);
  object.rotation.y = THREE.MathUtils.lerp(prevKeyframe.rotation.y, nextKeyframe.rotation.y, t);
  object.rotation.z = THREE.MathUtils.lerp(prevKeyframe.rotation.z, nextKeyframe.rotation.z, t);
  
  object.scale.lerpVectors(prevKeyframe.scale, nextKeyframe.scale, t);
}


const ThreeScene: React.FC<ThreeSceneProps> = ({ scrollPercentage }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cubeRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mountRef.current) return;

    const currentMount = mountRef.current;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1A1A1A); // A slightly darker background
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.z = 3.5; // Adjusted camera position
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5).normalize();
    scene.add(directionalLight);
    
    const accentLight = new THREE.PointLight(0x9575CD, 1.5, 100); // Accent color light
    accentLight.position.set(-2, 2, 2);
    scene.add(accentLight);


    // Cube
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x3F51B5, // Primary color
        metalness: 0.3,
        roughness: 0.6,
    }); 
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    cubeRef.current = cube;

    // Initial positioning based on scroll 0
    interpolateKeyframes(0, cubeRef.current);


    // Animation loop
    const animate = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !cubeRef.current) return;
      requestAnimationFrame(animate);
      
      // Update object based on current scrollPercentage
      // This will be handled by the useEffect listening to scrollPercentage prop changes
      
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
      sceneRef.current = null;
      cameraRef.current = null;
      cubeRef.current = null;
    };
  }, []); // Empty dependency array: setup runs once

  // Effect to update cube based on scrollPercentage prop
  useEffect(() => {
    if (cubeRef.current) {
      interpolateKeyframes(scrollPercentage, cubeRef.current);
    }
  }, [scrollPercentage]);

  return <div ref={mountRef} className="fixed inset-0 -z-10 w-screen h-screen" />;
};

export default ThreeScene;
