'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const ThreeScene: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mountRef.current) return;

    const currentMount = mountRef.current;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x303030); // Match background color

    // Camera
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.z = 5;

    // Renderer
    const newRenderer = new THREE.WebGLRenderer({ antialias: true });
    newRenderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    newRenderer.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(newRenderer.domElement);
    setRenderer(newRenderer);
    
    // Controls
    const controls = new OrbitControls(camera, newRenderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.maxPolarAngle = Math.PI / 2;


    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);
    
    const pointLight2 = new THREE.PointLight(0x9575CD, 1); // Accent color light
    pointLight2.position.set(-3, -2, 3);
    scene.add(pointLight2);


    // Cube (representing a project or interactive element)
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x3F51B5 }); // Primary color
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      cube.rotation.x += 0.005;
      cube.rotation.y += 0.005;
      controls.update();
      newRenderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (currentMount) {
        camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
        camera.updateProjectionMatrix();
        newRenderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (currentMount && newRenderer.domElement) {
         // Check if domElement is still a child before removing
        if (currentMount.contains(newRenderer.domElement)) {
            currentMount.removeChild(newRenderer.domElement);
        }
      }
      newRenderer.dispose();
      controls.dispose();
    };
  }, []);

  return <div ref={mountRef} className="w-full h-[400px] md:h-[500px] rounded-lg shadow-2xl overflow-hidden border border-primary/30" data-ai-hint="abstract 3d" />;
};

export default ThreeScene;
