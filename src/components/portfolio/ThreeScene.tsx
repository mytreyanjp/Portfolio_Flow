
'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

interface ThreeSceneProps {
  scrollPercentage: number;
  currentTheme: 'light' | 'dark';
}

// Define keyframes for the GLB model's animation
// IMPORTANT: You will likely need to adjust these values significantly
// to suit your custom GLB model's size, orientation, and desired animation.
// These keyframes are for the '/models/blind_man.glb' model.
const modelKeyframes = [
  { scroll: 0, position: [0, -0.5, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  { scroll: 0.25, position: [0.5, 0, -1], rotation: [0, Math.PI / 4, 0], scale: [1.1, 1.1, 1.1] },
  { scroll: 0.5, position: [0, 0.5, -2], rotation: [0, Math.PI / 2, 0], scale: [1.2, 1.2, 1.2] },
  { scroll: 0.75, position: [-0.5, 0, -1], rotation: [0, (3 * Math.PI) / 4, 0], scale: [1.1, 1.1, 1.1] },
  { scroll: 1, position: [0, -0.5, 0], rotation: [0, Math.PI, 0], scale: [1, 1, 1] },
];

const interpolateKeyframes = (
  keyframes: typeof modelKeyframes,
  scroll: number
): { position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number] } => {
  if (!keyframes || keyframes.length === 0 || typeof scroll !== 'number' || isNaN(scroll)) {
    const defaultKf = keyframes?.[0] || {
      position: [0, 0, 0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
      scale: [1, 1, 1] as [number, number, number],
    };
    return {
      position: [...defaultKf.position],
      rotation: [...defaultKf.rotation],
      scale: [...defaultKf.scale],
    };
  }

  let kf1 = keyframes[0];
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (scroll >= keyframes[i].scroll && scroll <= keyframes[i + 1].scroll) {
      kf1 = keyframes[i];
      break;
    }
  }

  let kf2 = kf1;
  for (let i = 0; i < keyframes.length; i++) {
    if (keyframes[i].scroll > kf1.scroll) {
      kf2 = keyframes[i];
      break;
    }
  }
  if (scroll < kf1.scroll) kf2 = kf1;
  if (scroll > keyframes[keyframes.length - 1].scroll) {
    kf1 = keyframes[keyframes.length -1];
    kf2 = kf1;
  }

  const t = (kf2.scroll - kf1.scroll === 0) ? 1 : (scroll - kf1.scroll) / (kf2.scroll - kf1.scroll);

  return {
    position: [
      kf1.position[0] + (kf2.position[0] - kf1.position[0]) * t,
      kf1.position[1] + (kf2.position[1] - kf1.position[1]) * t,
      kf1.position[2] + (kf2.position[2] - kf1.position[2]) * t,
    ] as [number, number, number],
    rotation: [
      kf1.rotation[0] + (kf2.rotation[0] - kf1.rotation[0]) * t,
      kf1.rotation[1] + (kf2.rotation[1] - kf1.rotation[1]) * t,
      kf1.rotation[2] + (kf2.rotation[2] - kf1.rotation[2]) * t,
    ] as [number, number, number],
    scale: [
      kf1.scale[0] + (kf2.scale[0] - kf1.scale[0]) * t,
      kf1.scale[1] + (kf2.scale[1] - kf1.scale[1]) * t,
      kf1.scale[2] + (kf2.scale[2] - kf1.scale[2]) * t,
    ] as [number, number, number],
  };
};

// Create these loaders only once, outside the component
const gltfLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
// IMPORTANT: You MUST copy the draco decoder files to this path in your public folder
// The path below should point to the directory containing draco_wasm_wrapper.js and draco_decoder.wasm
// This is typically node_modules/three/examples/jsm/libs/draco/gltf/
// So, you'd copy those files to public/libs/draco/gltf/
dracoLoader.setDecoderPath('/libs/draco/gltf/'); 
dracoLoader.setDecoderConfig({ type: 'wasm' }); // Use WASM decoder
gltfLoader.setDRACOLoader(dracoLoader);


const ThreeScene: React.FC<ThreeSceneProps> = ({ scrollPercentage, currentTheme }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animatedObjectRef = useRef<THREE.Group | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lightsRef = useRef<THREE.Light[]>([]);


  useEffect(() => {
    if (!mountRef.current) {
      console.error("ThreeScene: Mount ref is null. Aborting setup.");
      return;
    }
    const currentMount = mountRef.current;
    console.log(`ThreeScene: useEffect triggered. Theme: ${currentTheme}, Scroll: ${scrollPercentage.toFixed(2)}`);

    // Scene setup
    if (!sceneRef.current) {
      sceneRef.current = new THREE.Scene();
      console.log("ThreeScene: Scene created.");
    }
    sceneRef.current.background = null; // Transparent background

    // Camera setup
    if (!cameraRef.current) {
      cameraRef.current = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
      cameraRef.current.position.z = 3;
      console.log("ThreeScene: Camera created.");
    } else {
      if (currentMount.clientWidth > 0 && currentMount.clientHeight > 0) {
        cameraRef.current.aspect = currentMount.clientWidth / currentMount.clientHeight;
        cameraRef.current.updateProjectionMatrix();
      }
    }
    
    // Renderer setup
    if (!rendererRef.current) {
      rendererRef.current = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      rendererRef.current.setClearAlpha(0); // Ensure renderer clear alpha is 0 for transparency
      console.log("ThreeScene: Renderer instance created.");
    }
    if (currentMount.clientWidth > 0 && currentMount.clientHeight > 0) {
      rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
    } else {
      console.warn("ThreeScene: Mount dimensions are zero during renderer setup. Using fallback 640x480.");
      rendererRef.current.setSize(640, 480); // Fallback size
    }

    if (!currentMount.contains(rendererRef.current.domElement)) {
      currentMount.appendChild(rendererRef.current.domElement);
      console.log("ThreeScene: Renderer DOM element appended.");
    }


    // Clean up previous model and lights if they exist
    if (animatedObjectRef.current && sceneRef.current) {
      sceneRef.current.remove(animatedObjectRef.current);
      animatedObjectRef.current.traverse(child => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).geometry.dispose();
          const material = (child as THREE.Mesh).material;
          if (Array.isArray(material)) {
            material.forEach(m => m.dispose());
          } else if (material) {
            material.dispose();
          }
        }
      });
      animatedObjectRef.current = null;
      console.log("ThreeScene: Previous animated object removed and disposed.");
    }

    lightsRef.current.forEach(light => sceneRef.current?.remove(light));
    lightsRef.current.forEach(light => light.dispose?.());
    lightsRef.current = [];
    console.log("ThreeScene: Previous lights removed and disposed.");


    // Lighting (re-add for current theme)
    const newLights: THREE.Light[] = [];
    const ambientLightIntensity = currentTheme === 'dark' ? 0.6 : 1.2;
    const directionalLightIntensity = currentTheme === 'dark' ? 1.0 : 1.5;
    const pointLightIntensity = currentTheme === 'dark' ? 1.2 : 0.8;

    const ambientLight = new THREE.AmbientLight(0xffffff, ambientLightIntensity);
    newLights.push(ambientLight);

    const directionalLightColor = currentTheme === 'dark' ? 0x8A2BE2 : 0xFFDAB9; // Dark: BlueViolet, Light: PeachPuff/Orange-ish
    const directionalLight = new THREE.DirectionalLight(directionalLightColor, directionalLightIntensity);
    directionalLight.position.set(1, 3, 2).normalize();
    newLights.push(directionalLight);
    
    const pointLightColor = currentTheme === 'dark' ? 0x9575CD : 0xFFEBCD; // Dark: Violet, Light: Light Peachy
    const pointLight = new THREE.PointLight(pointLightColor, pointLightIntensity, 150); 
    pointLight.position.set(-2, 1, 3);
    newLights.push(pointLight);

    newLights.forEach(light => sceneRef.current?.add(light));
    lightsRef.current = newLights;
    console.log("ThreeScene: New lights added for theme:", currentTheme);


    // Load GLB Model
    const modelPath = '/models/blind_man.glb'; 
    console.log(`ThreeScene: Attempting to load GLB model from: ${modelPath}`);

    gltfLoader.load(
      modelPath,
      (gltf) => {
        console.log("ThreeScene: GLB model loaded successfully.", gltf);
        if (sceneRef.current) {
          animatedObjectRef.current = gltf.scene;
          // Adjust model scale or initial position if needed for blind_man.glb
          // animatedObjectRef.current.scale.set(0.5, 0.5, 0.5); 
          // animatedObjectRef.current.position.y = -1; 
          
           animatedObjectRef.current.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const meshChild = child as THREE.Mesh;
                 if (meshChild.material instanceof THREE.MeshStandardMaterial) {
                    // Example: Adjust material properties if needed
                    // meshChild.material.color.set(currentTheme === 'dark' ? 0xaaaaaa : 0xdddddd);
                    // meshChild.material.metalness = 0.1;
                    // meshChild.material.roughness = 0.8;
                 }
            }
          });
          sceneRef.current.add(animatedObjectRef.current);
          console.log("ThreeScene: GLB model added to scene.");
        }
      },
      undefined, // onProgress callback (optional)
      (error) => {
        console.error('ThreeScene: Error loading GLB model:', error);
      }
    );

    // Animation Loop
    const animate = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
        return;
      }
      animationFrameIdRef.current = requestAnimationFrame(animate);

      if (animatedObjectRef.current) {
        const interpolated = interpolateKeyframes(modelKeyframes, scrollPercentage);
        animatedObjectRef.current.position.set(...interpolated.position);
        animatedObjectRef.current.rotation.set(...interpolated.rotation);
        animatedObjectRef.current.scale.set(...interpolated.scale);
      }
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    animate();
    console.log("ThreeScene: Animation loop (re)started.");

    // Resize Handler
    const handleResize = () => {
      if (mountRef.current && rendererRef.current && cameraRef.current) {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        if (width > 0 && height > 0) {
          rendererRef.current.setSize(width, height);
          cameraRef.current.aspect = width / height;
          cameraRef.current.updateProjectionMatrix();
        }
      }
    };
    window.addEventListener('resize', handleResize);
    if(currentMount.clientWidth > 0 && currentMount.clientHeight > 0) handleResize(); // Initial call

    // Cleanup function
    return () => {
      console.log("ThreeScene: useEffect cleanup initiated.");
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      window.removeEventListener('resize', handleResize);
      
      if (animatedObjectRef.current && sceneRef.current) {
         sceneRef.current.remove(animatedObjectRef.current);
         animatedObjectRef.current.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                (child as THREE.Mesh).geometry.dispose();
                const material = (child as THREE.Mesh).material;
                if (Array.isArray(material)) {
                    material.forEach(m => m.dispose());
                } else if (material) { 
                    material.dispose();
                }
            }
        });
        animatedObjectRef.current = null;
      }
      
      lightsRef.current.forEach(light => sceneRef.current?.remove(light));
      lightsRef.current.forEach(light => light.dispose?.());
      lightsRef.current = [];

      // Note: Scene, Camera, and Renderer refs are persisted across re-renders due to theme/scroll change
      // They are only fully disposed if the component unmounts due to `key` change in layout.tsx
      // However, if the component itself is unmounted (e.g. navigating away from page.tsx),
      // the following should be called if they are not managed by a higher level `key` change
      if (currentMount.contains(rendererRef.current?.domElement || null)) {
          currentMount.removeChild(rendererRef.current!.domElement);
      }
      rendererRef.current?.dispose();
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      console.log("ThreeScene: Full cleanup for unmount/key change completed.");
    };
  }, [scrollPercentage, currentTheme]); // Key dependencies for re-running the effect

  return <div ref={mountRef} className="fixed inset-0 -z-10 w-screen h-screen bg-transparent" />;
};

export default ThreeScene;
