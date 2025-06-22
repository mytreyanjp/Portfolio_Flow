
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as _THREE from 'three';
import { GLTFLoader as _GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader as _DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OBJLoader as _OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { FBXLoader as _FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ZoomInIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button'; // For a potential reset button

const THREE = _THREE;
const GLTFLoader = _GLTFLoader;
const DRACOLoader = _DRACOLoader;
const OBJLoader = _OBJLoader;
const FBXLoader = _FBXLoader;

interface ProjectModelViewerProps {
  modelPath: string | undefined | null;
  containerRef: React.RefObject<HTMLDivElement>;
  onModelErrorOrMissing?: () => void;
}

const DRACO_DECODER_PATH = '/libs/draco/gltf/';


const dracoLoaderInstance = new DRACOLoader();
dracoLoaderInstance.setDecoderPath(DRACO_DECODER_PATH);
dracoLoaderInstance.setDecoderConfig({ type: 'wasm' });

const gltfLoaderInstance = new GLTFLoader();
gltfLoaderInstance.setDRACOLoader(dracoLoaderInstance);
gltfLoaderInstance.setCrossOrigin('anonymous');

// Interaction constants
const SCROLL_OFFSET_Y_FACTOR = 0.3;
const SCROLL_ZOOM_FACTOR_MIN = 3.0;
const SCROLL_ZOOM_FACTOR_MAX = 4.0;

const LERP_SPEED_ROTATION = 0.08;
const LERP_SPEED_MODEL_Y = 0.05;
const LERP_SPEED_CAMERA_Z = 0.05;

const MOUSE_ROTATION_SENSITIVITY_X = 0.4;
const MOUSE_ROTATION_SENSITIVITY_Y = 0.3;

const GYRO_MAX_INPUT_DEG = 30;
const GYRO_TARGET_MODEL_MAX_ROT_RAD_X = 0.45;
const GYRO_TARGET_MODEL_MAX_ROT_RAD_Y = 0.6;

const JUMP_HEIGHT = 0.15;
const JUMP_DURATION = 300;

// Consistent target size for scaling models
const TARGET_MODEL_VIEW_SIZE = 2.5;


const ProjectModelViewer: React.FC<ProjectModelViewerProps> = ({ modelPath, containerRef, onModelErrorOrMissing }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailedError, setDetailedError] = useState<any>(null);

  const modelGroupRef = useRef<THREE.Group | null>(null);
  const targetRotationRef = useRef({ x: 0, y: 0 });
  const targetCameraZRef = useRef<number>(3.0);
  const targetCameraXRef = useRef<number>(0);

  const initialModelYAfterCenteringRef = useRef<number>(0);
  const isWindowFocusedRef = useRef(true);
  const scrollPercentageRef = useRef(0);

  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lightsRef = useRef<THREE.Light[]>([]);
  const isIntersectingRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const [isGyroActive, setIsGyroActive] = useState(false);
  const initialGyroOffsetRef = useRef<{ beta: number | null; gamma: number | null }>({ beta: null, gamma: null });

  const isJumpingRef = useRef(false);
  const jumpStartTimeRef = useRef(0);

  const handleModelClick = useCallback(() => {
    if (!isJumpingRef.current && modelGroupRef.current) {
        isJumpingRef.current = true;
        jumpStartTimeRef.current = Date.now();
    }
  }, []);

  console.log("ProjectModelViewer: Component rendering with modelPath:", modelPath);

  useEffect(() => {
    const effectModelPath = modelPath;
    console.log("ProjectModelViewer: useEffect initializing for modelPath:", effectModelPath);
    let isMounted = true;

    if (!effectModelPath || typeof effectModelPath !== 'string' || effectModelPath.trim() === '') {
      console.warn("ProjectModelViewer: No valid model path provided.");
      setError("No model path provided.");
      setIsLoading(false);
      onModelErrorOrMissing?.();
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      return;
    }
    
    const fileExtension = effectModelPath.split('.').pop()?.toLowerCase();
    console.log(`ProjectModelViewer: Determined file extension: ${fileExtension}`);

    console.log(`ProjectModelViewer: Initializing for modelPath: ${effectModelPath}`);
    setError(null);
    setDetailedError(null);
    setIsLoading(true);

    initialGyroOffsetRef.current = { beta: null, gamma: null };
    isJumpingRef.current = false;
    targetRotationRef.current = {x: 0, y: 0};
    targetCameraZRef.current = SCROLL_ZOOM_FACTOR_MIN;
    targetCameraXRef.current = 0; // Reset horizontal offset to center the model
    isWindowFocusedRef.current = (typeof document !== 'undefined' && document.hasFocus());
    scrollPercentageRef.current = 0;


    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      if (!isMounted || !modelGroupRef.current || event.beta === null || event.gamma === null || !isWindowFocusedRef.current || !isIntersectingRef.current) {
          return;
      }
      if (!isGyroActive) setIsGyroActive(true);
      const { beta, gamma } = event;
      if (initialGyroOffsetRef.current.beta === null) {
          initialGyroOffsetRef.current.beta = beta;
          initialGyroOffsetRef.current.gamma = gamma;
           if (modelGroupRef.current) {
            targetRotationRef.current.x = modelGroupRef.current.rotation.x;
            targetRotationRef.current.y = modelGroupRef.current.rotation.y;
          }
          return;
      }
      let relativeBeta = beta - (initialGyroOffsetRef.current.beta || 0);
      let relativeGamma = gamma - (initialGyroOffsetRef.current.gamma || 0);
      let normBeta = THREE.MathUtils.clamp(relativeBeta / GYRO_MAX_INPUT_DEG, -1, 1);
      let normGamma = THREE.MathUtils.clamp(relativeGamma / GYRO_MAX_INPUT_DEG, -1, 1);
      targetRotationRef.current.x = normBeta * GYRO_TARGET_MODEL_MAX_ROT_RAD_X;
      targetRotationRef.current.y = -normGamma * GYRO_TARGET_MODEL_MAX_ROT_RAD_Y;
    };

    let deviceOrientationListenerAttached = false;
    if (typeof window.DeviceOrientationEvent !== 'undefined') {
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            window.addEventListener('deviceorientation', handleDeviceOrientation);
            deviceOrientationListenerAttached = true;
        } else {
            window.addEventListener('deviceorientation', handleDeviceOrientation);
            deviceOrientationListenerAttached = true;
        }
    }

    const handleGlobalMouseMove = (event: MouseEvent) => {
      if (!isMounted || isGyroActive || !isWindowFocusedRef.current || !isIntersectingRef.current) return;
      const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
      targetRotationRef.current.y = mouseX * MOUSE_ROTATION_SENSITIVITY_X;
      targetRotationRef.current.x = mouseY * MOUSE_ROTATION_SENSITIVITY_Y;
    };

    const handleScroll = () => {
        if (!isMounted || !isIntersectingRef.current || isGyroActive) return;
        const currentScroll = window.scrollY;
        const totalScrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
        scrollPercentageRef.current = totalScrollableHeight > 0 ? Math.max(0, Math.min(1, currentScroll / totalScrollableHeight)) : 0;
        // The model will no longer move vertically. Only zoom is affected.
        targetCameraZRef.current = SCROLL_ZOOM_FACTOR_MIN + (SCROLL_ZOOM_FACTOR_MAX - SCROLL_ZOOM_FACTOR_MIN) * scrollPercentageRef.current;
    };

    const handleWindowFocus = () => { isWindowFocusedRef.current = true; };
    const handleWindowBlur = () => { isWindowFocusedRef.current = false; };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);

    const currentMountForClick = mountRef.current;
    if (currentMountForClick) {
        currentMountForClick.addEventListener('click', handleModelClick);
    }


    if (containerRef.current && !observerRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          isIntersectingRef.current = entry.isIntersecting;
          if(!entry.isIntersecting) {
            if (isGyroActive) {
              initialGyroOffsetRef.current = { beta: null, gamma: null };
              setIsGyroActive(false);
            }
          }
          if (entry.isIntersecting) handleScroll();
        }, { threshold: 0.01 }
      );
      observer.observe(containerRef.current);
      observerRef.current = observer;
    }

    // --- Renderer and Scene setup ---
    const currentMount = mountRef.current;
    if (!currentMount) {
        setError("Initialization failed: Mounting point not ready.");
        setIsLoading(false);
        onModelErrorOrMissing?.();
        return;
    }

    if (!sceneRef.current) sceneRef.current = new THREE.Scene();
    if (!cameraRef.current) {
        cameraRef.current = new THREE.PerspectiveCamera(50, currentMount.clientWidth > 0 ? currentMount.clientWidth / currentMount.clientHeight : 1, 0.1, 100);
    }
    cameraRef.current.position.set(targetCameraXRef.current, 0, targetCameraZRef.current);


    if (!rendererRef.current) {
        rendererRef.current = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        rendererRef.current.setClearAlpha(0);
    }

    if (currentMount.contains(rendererRef.current.domElement)) {
        currentMount.removeChild(rendererRef.current.domElement);
    }
    currentMount.appendChild(rendererRef.current.domElement);
    // Set initial size explicitly after appending
    if (currentMount.clientWidth > 0 && currentMount.clientHeight > 0) {
        rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight, false);
        cameraRef.current.aspect = currentMount.clientWidth / currentMount.clientHeight;
        cameraRef.current.updateProjectionMatrix();
    }
    
    // --- Lighting setup ---
    lightsRef.current.forEach(light => sceneRef.current?.remove(light));
    lightsRef.current = [];

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    sceneRef.current.add(ambientLight);
    const mainDirectionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
    mainDirectionalLight.position.set(3, 5, 4);
    sceneRef.current.add(mainDirectionalLight);
    const fillLight = new THREE.DirectionalLight(0xffffff, 1.0);
    fillLight.position.set(-3, -2, -3);
    sceneRef.current.add(fillLight);
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
    hemiLight.position.set(0, 20, 0);
    sceneRef.current.add(hemiLight);
    lightsRef.current = [ambientLight, mainDirectionalLight, fillLight, hemiLight];
    
    // --- Model loading setup ---
    if (modelGroupRef.current && sceneRef.current) {
        sceneRef.current.remove(modelGroupRef.current);
        modelGroupRef.current = null;
    }
    
    const onProgress = (xhr: ProgressEvent) => {
        if (!isMounted) return;
        console.log(`ProjectModelViewer: Model loading progress: ${(xhr.loaded / xhr.total) * 100}% for ${effectModelPath}`);
    };

    const commonLoadSuccess = (loadedAsset: any) => {
      if (!isMounted) return;

      const objectToAdd = loadedAsset.scene || loadedAsset;
      if (!objectToAdd || typeof objectToAdd.isObject3D !== 'boolean' || !objectToAdd.isObject3D) {
        const errorMessage = 'Loaded asset does not contain a valid 3D object.';
        console.error(`ProjectModelViewer: ${errorMessage}`, loadedAsset);
        setError(errorMessage);
        setDetailedError(loadedAsset);
        setIsLoading(false);
        onModelErrorOrMissing?.();
        return;
      }
      
      console.log(`ProjectModelViewer: Model loaded successfully (${fileExtension})!`, loadedAsset);
      modelGroupRef.current = objectToAdd as THREE.Group;
      sceneRef.current!.add(modelGroupRef.current);
      const box = new THREE.Box3().setFromObject(modelGroupRef.current);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      console.log(`ProjectModelViewer: Original Max Dim: ${maxDim}, Scale Factor: ${TARGET_MODEL_VIEW_SIZE / maxDim}`);
      let scaleFactor = (maxDim > 0.001) ? TARGET_MODEL_VIEW_SIZE / maxDim : 1.0;
      modelGroupRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);
      
      const scaledBox = new THREE.Box3().setFromObject(modelGroupRef.current);
      const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
      modelGroupRef.current.position.sub(scaledCenter);

      initialModelYAfterCenteringRef.current = modelGroupRef.current.position.y;
      if (cameraRef.current) cameraRef.current.lookAt(0, 0, 0);
      handleScroll();
      setIsLoading(false);
      setError(null);
    };

    const commonLoadError = (loaderError: ErrorEvent | any, format: string) => {
        if (!isMounted) return;
        console.error(`ProjectModelViewer: Error loading ${format} model from ${effectModelPath}:`, loaderError);
        let userFriendlyMessage = `Failed to load ${format} model.`;
        if (loaderError.message?.includes("NetworkError")) userFriendlyMessage = "Network error: Could not fetch the model. Check URL and CORS.";
        else if (loaderError.message?.toLowerCase().includes("parse") || loaderError.message?.toLowerCase().includes("syntaxerror")) userFriendlyMessage = `Model file .${fileExtension} might be corrupted or in an unsupported format.`;
        setError(userFriendlyMessage);
        setDetailedError(loaderError);
        setIsLoading(false);
        onModelErrorOrMissing?.();
    };

    console.log(`ProjectModelViewer: Attempting to load model: ${effectModelPath}`);
    if (fileExtension === 'glb' || fileExtension === 'gltf') {
        console.log(`ProjectModelViewer: DRACO decoder path is set to: ${DRACO_DECODER_PATH}.`);
        gltfLoaderInstance.load(effectModelPath, commonLoadSuccess, onProgress, (error) => commonLoadError(error, 'glTF/GLB'));
    } else if (fileExtension === 'obj') {
        new OBJLoader().load(effectModelPath, commonLoadSuccess, onProgress, (error) => commonLoadError(error, '.obj'));
    } else if (fileExtension === 'fbx') {
        new FBXLoader().load(effectModelPath, commonLoadSuccess, onProgress, (error) => commonLoadError(error, '.fbx'));
    } else {
        console.warn(`ProjectModelViewer: Unsupported file extension: ${fileExtension}`);
        setError(`Unsupported model format: .${fileExtension}. Please use .glb, .gltf, .obj, or .fbx.`);
        setIsLoading(false);
        onModelErrorOrMissing?.();
        return;
    }
    
    // --- Animation loop ---
    const animate = () => {
        if (!isMounted) return;
        animationFrameIdRef.current = requestAnimationFrame(animate);

        const renderer = rendererRef.current;
        const camera = cameraRef.current;
        const scene = sceneRef.current;
        const model = modelGroupRef.current;

        if (renderer && camera && scene && currentMount) {
             // Dynamic Resizing Check
            const width = currentMount.clientWidth;
            const height = currentMount.clientHeight;
            if (width > 0 && height > 0) {
              const canvas = renderer.domElement;
              const needResize = canvas.width !== Math.floor(width * renderer.getPixelRatio()) || 
                                 canvas.height !== Math.floor(height * renderer.getPixelRatio());

              if (needResize) {
                  renderer.setSize(width, height, false);
                  camera.aspect = width / height;
                  camera.updateProjectionMatrix();
              }
            }

            if (model && isIntersectingRef.current) {
                model.rotation.x += (targetRotationRef.current.x - model.rotation.x) * LERP_SPEED_ROTATION;
                model.rotation.y += (targetRotationRef.current.y - model.rotation.y) * LERP_SPEED_ROTATION;

                let finalTargetModelY = initialModelYAfterCenteringRef.current;
                if (isJumpingRef.current) {
                    const elapsedJumpTime = Date.now() - jumpStartTimeRef.current;
                    if (elapsedJumpTime < JUMP_DURATION) {
                        finalTargetModelY += JUMP_HEIGHT * Math.sin((elapsedJumpTime / JUMP_DURATION) * Math.PI);
                    } else {
                        isJumpingRef.current = false;
                    }
                }
                model.position.y += (finalTargetModelY - model.position.y) * LERP_SPEED_MODEL_Y;
                camera.position.x += (targetCameraXRef.current - camera.position.x) * LERP_SPEED_CAMERA_Z;
                camera.position.z += (targetCameraZRef.current - camera.position.z) * LERP_SPEED_CAMERA_Z;
            }
            if (currentMount.clientWidth > 0 && currentMount.clientHeight > 0) {
                renderer.render(scene, camera);
            }
        }
    };
    
    if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    animate();

    return () => {
      console.log(`ProjectModelViewer: Cleanup for modelPath: ${effectModelPath}`);
      isMounted = false;
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);

      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('blur', handleWindowBlur);
      if (deviceOrientationListenerAttached) window.removeEventListener('deviceorientation', handleDeviceOrientation);

      if (currentMountForClick) {
        currentMountForClick.removeEventListener('click', handleModelClick);
      }

      initialGyroOffsetRef.current = { beta: null, gamma: null };
      setIsGyroActive(false);
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [modelPath, onModelErrorOrMissing, containerRef, handleModelClick]);

  useEffect(() => {
    if (mountRef.current) {
      mountRef.current.style.cursor = isGyroActive ? 'grab' : 'default';
      if (isGyroActive) mountRef.current.style.cursor = 'grabbing';
    }
  }, [isGyroActive]);


  return (
    <div
      ref={mountRef}
      className={cn(
        "w-full h-full overflow-hidden relative",
        (isLoading || error) && "flex items-center justify-center", 
        error && "bg-destructive/10" 
      )}
    >
      {isLoading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/10 z-10 pointer-events-none">
          <Skeleton className="w-full h-full" />
          <p className="absolute text-xs text-muted-foreground bottom-2">Loading 3D Model...</p>
        </div>
      )}
      {error && (
        <div className="flex flex-col items-center justify-center text-destructive p-2 text-center z-10">
          <AlertTriangle className="h-10 w-10 mb-2" />
          <p className="text-sm font-semibold">Model Error</p>
          <p className="text-xs mb-1">{error}</p>
          {detailedError && (
            <details className="text-xs text-destructive/80 mt-1 text-left bg-destructive/5 p-1 rounded max-w-full overflow-auto">
                <summary className="cursor-pointer">Details</summary>
                <pre className="whitespace-pre-wrap text-[10px]">{typeof detailedError === 'string' ? detailedError : JSON.stringify(detailedError, Object.getOwnPropertyNames(detailedError).filter(key => key !== 'target'), 2)}</pre>
            </details>
           )}
        </div>
      )}
    </div>
  );
};

export default ProjectModelViewer;
