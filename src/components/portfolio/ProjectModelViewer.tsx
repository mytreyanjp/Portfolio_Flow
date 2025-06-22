
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as _THREE from 'three';
import { GLTFLoader as _GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader as _DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OBJLoader as _OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { FBXLoader as _FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Orbit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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
const SCROLL_ZOOM_FACTOR_MIN = 2.0;
const SCROLL_ZOOM_FACTOR_MAX = 3.5;

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
  const [showGyroButton, setShowGyroButton] = useState(false);
  const [gyroPermissionState, setGyroPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');


  // State refs for animation
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const lightsRef = useRef<THREE.Light[]>([]);

  // Interaction refs
  const targetRotationRef = useRef({ x: 0, y: 0 });
  const targetCameraZRef = useRef<number>(SCROLL_ZOOM_FACTOR_MIN);
  const initialModelYAfterCenteringRef = useRef<number>(0);
  const isWindowFocusedRef = useRef(true);
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

  const handleGyroRequest = useCallback(async () => {
      if (typeof (DeviceOrientationEvent as any).requestPermission !== 'function') {
        // This case handles non-iOS browsers that don't need explicit permission.
        setGyroPermissionState('granted');
        return;
      }
      // This handles iOS 13+
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          setGyroPermissionState('granted');
        } else {
          setGyroPermissionState('denied');
        }
      } catch (err) {
        console.error("Gyro permission request error:", err);
        setGyroPermissionState('denied');
      }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let animationFrameId: number | null = null;
    let deviceOrientationListenerAttached = false;
    let isIntersecting = false;
    
    const intersectionObs = new IntersectionObserver(([entry]) => { isIntersecting = entry.isIntersecting; }, { threshold: 0.01 });

    const effectModelPath = modelPath;
    const currentMount = mountRef.current;
    const parentContainer = containerRef.current;

    if (!effectModelPath || !currentMount || !parentContainer) {
      setError(effectModelPath ? "Initialization failed: Mounting point not ready." : "No model path provided.");
      setIsLoading(false);
      onModelErrorOrMissing?.();
      return;
    }
    
    setError(null);
    setDetailedError(null);
    setIsLoading(true);

    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
        if (!isWindowFocusedRef.current || !isMounted || !isIntersecting) return;
        const { beta, gamma } = event;
        if (beta === null || gamma === null) return;
        if (initialGyroOffsetRef.current.beta === null) initialGyroOffsetRef.current = { beta, gamma };
        const deltaBeta = beta - initialGyroOffsetRef.current.beta;
        const deltaGamma = gamma - initialGyroOffsetRef.current.gamma;
        targetRotationRef.current.x = (Math.min(Math.max(deltaBeta, -GYRO_MAX_INPUT_DEG), GYRO_MAX_INPUT_DEG) / GYRO_MAX_INPUT_DEG) * GYRO_TARGET_MODEL_MAX_ROT_RAD_X;
        targetRotationRef.current.y = ((Math.min(Math.max(deltaGamma, -GYRO_MAX_INPUT_DEG), GYRO_MAX_INPUT_DEG) / GYRO_MAX_INPUT_DEG) * GYRO_TARGET_MODEL_MAX_ROT_RAD_Y);
    };
    
    const handleGlobalMouseMove = (event: MouseEvent) => {
        if (isGyroActive || !isWindowFocusedRef.current || !isMounted || !isIntersecting) return;
        const normalizedX = (event.clientX / window.innerWidth) * 2 - 1;
        const normalizedY = (event.clientY / window.innerHeight) * 2 - 1;
        targetRotationRef.current.y = normalizedX * MOUSE_ROTATION_SENSITIVITY_X;
        targetRotationRef.current.x = normalizedY * MOUSE_ROTATION_SENSITIVITY_Y;
    };
    
    const handleScroll = () => {
        if (!isWindowFocusedRef.current || !isMounted || !isIntersecting) return;
        const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
        targetCameraZRef.current = SCROLL_ZOOM_FACTOR_MIN + (SCROLL_ZOOM_FACTOR_MAX - SCROLL_ZOOM_FACTOR_MIN) * scrollPercent;
    };

    const handleWindowFocus = () => { isWindowFocusedRef.current = true; };
    const handleWindowBlur = () => { isWindowFocusedRef.current = false; };
    
    const initThree = () => {
      if (!isMounted || !currentMount) return;
      
      isWindowFocusedRef.current = (typeof document !== 'undefined' && document.hasFocus());
      targetRotationRef.current = { x: 0, y: 0 };
      targetCameraZRef.current = SCROLL_ZOOM_FACTOR_MIN;
      initialGyroOffsetRef.current = { beta: null, gamma: null };
      isJumpingRef.current = false;

      if ('DeviceOrientationEvent' in window) {
        setShowGyroButton(true);
      } else {
        setGyroPermissionState('unsupported');
      }

      const scene = new THREE.Scene();
      sceneRef.current = scene;
      
      const camera = new THREE.PerspectiveCamera(50, currentMount.clientWidth > 0 ? currentMount.clientWidth / currentMount.clientHeight : 1, 0.1, 100);
      camera.position.set(0, 0, targetCameraZRef.current);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight, false);
      renderer.setClearAlpha(0);
      rendererRef.current = renderer;

      currentMount.appendChild(renderer.domElement);

      const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
      const mainDirectionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
      mainDirectionalLight.position.set(3, 5, 4);
      const fillLight = new THREE.DirectionalLight(0xffffff, 1.0);
      fillLight.position.set(-3, -2, -3);
      const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
      hemiLight.position.set(0, 20, 0);
      scene.add(ambientLight, mainDirectionalLight, fillLight, hemiLight);
      lightsRef.current = [ambientLight, mainDirectionalLight, fillLight, hemiLight];

      const fileExtension = effectModelPath.split('.').pop()?.toLowerCase();
      const commonLoadSuccess = (loadedAsset: any) => {
        if (!isMounted || !sceneRef.current || !modelGroupRef) return;
        const objectToAdd = loadedAsset.scene || loadedAsset;
        if (!objectToAdd || typeof objectToAdd.isObject3D !== 'boolean' || !objectToAdd.isObject3D) {
          setError('Loaded asset does not contain a valid 3D object.');
          setIsLoading(false); onModelErrorOrMissing?.(); return;
        }
        modelGroupRef.current = objectToAdd as THREE.Group;
        scene.add(modelGroupRef.current);
        const box = new THREE.Box3().setFromObject(modelGroupRef.current);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        let scaleFactor = (maxDim > 0.001) ? TARGET_MODEL_VIEW_SIZE / maxDim : 1.0;
        modelGroupRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);
        const scaledBox = new THREE.Box3().setFromObject(modelGroupRef.current);
        const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
        modelGroupRef.current.position.sub(scaledCenter);
        initialModelYAfterCenteringRef.current = modelGroupRef.current.position.y;
        if (cameraRef.current) cameraRef.current.lookAt(0, 0, 0);
        setIsLoading(false); setError(null);
      };
      const commonLoadError = (err: any, format: string) => {
        if (!isMounted) return;
        setError(`Failed to load ${format} model.`);
        setDetailedError(err); setIsLoading(false); onModelErrorOrMissing?.();
      };
      if (fileExtension === 'glb' || fileExtension === 'gltf') gltfLoaderInstance.load(effectModelPath, commonLoadSuccess, undefined, (e) => commonLoadError(e, 'glTF/GLB'));
      else if (fileExtension === 'obj') new OBJLoader().load(effectModelPath, commonLoadSuccess, undefined, (e) => commonLoadError(e, '.obj'));
      else if (fileExtension === 'fbx') new FBXLoader().load(effectModelPath, commonLoadSuccess, undefined, (e) => commonLoadError(e, '.fbx'));
      else { setError(`Unsupported format: .${fileExtension}`); setIsLoading(false); onModelErrorOrMissing?.(); return; }

      const resizeRendererToDisplaySize = (renderer: THREE.WebGLRenderer) => {
        const canvas = renderer.domElement;
        const pixelRatio = window.devicePixelRatio;
        const width = Math.floor(canvas.clientWidth * pixelRatio);
        const height = Math.floor(canvas.clientHeight * pixelRatio);
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
          renderer.setSize(width, height, false);
        }
        return needResize;
      };

      const animate = () => {
        if (!isMounted) return;
        animationFrameId = requestAnimationFrame(animate);
        const localRenderer = rendererRef.current;
        const localCamera = cameraRef.current;
        const localScene = sceneRef.current;
        const model = modelGroupRef.current;
        if (localRenderer && localCamera && localScene && currentMount) {
          if (resizeRendererToDisplaySize(localRenderer)) {
            const canvas = localRenderer.domElement;
            localCamera.aspect = canvas.clientWidth / canvas.clientHeight;
            localCamera.updateProjectionMatrix();
          }

          if (model && isIntersecting) {
            model.rotation.x += (targetRotationRef.current.x - model.rotation.x) * LERP_SPEED_ROTATION;
            model.rotation.y += (targetRotationRef.current.y - model.rotation.y) * LERP_SPEED_ROTATION;
            let finalTargetModelY = initialModelYAfterCenteringRef.current;
            if (isJumpingRef.current) {
              const elapsedJumpTime = Date.now() - jumpStartTimeRef.current;
              if (elapsedJumpTime < JUMP_DURATION) finalTargetModelY += JUMP_HEIGHT * Math.sin((elapsedJumpTime / JUMP_DURATION) * Math.PI);
              else isJumpingRef.current = false;
            }
            model.position.y += (finalTargetModelY - model.position.y) * LERP_SPEED_MODEL_Y;
            localCamera.position.z += (targetCameraZRef.current - localCamera.position.z) * LERP_SPEED_CAMERA_Z;
          }
          if (currentMount.clientWidth > 0 && currentMount.clientHeight > 0) {
            localRenderer.render(localScene, localCamera);
          }
        }
      };
      
      animate();
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('focus', handleWindowFocus);
      window.addEventListener('blur', handleWindowBlur);
      currentMount.addEventListener('click', handleModelClick);
      
      if (gyroPermissionState === 'granted' && !deviceOrientationListenerAttached) {
        window.addEventListener('deviceorientation', handleDeviceOrientation);
        deviceOrientationListenerAttached = true;
        setIsGyroActive(true);
      }
    };
    
    initThree();
    intersectionObs.observe(parentContainer);

    return () => {
      isMounted = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      intersectionObs.disconnect();
      
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('blur', handleWindowBlur);
      if (currentMount) {
        currentMount.removeEventListener('click', handleModelClick);
      }
      if (deviceOrientationListenerAttached) window.removeEventListener('deviceorientation', handleDeviceOrientation);

      if (modelGroupRef.current && sceneRef.current) {
        sceneRef.current.remove(modelGroupRef.current);
        modelGroupRef.current.traverse(child => {
          if ((child as THREE.Mesh).isMesh) {
            (child as THREE.Mesh).geometry.dispose();
            const material = (child as THREE.Mesh).material;
            if (Array.isArray(material)) material.forEach(m => m.dispose());
            else if (material) material.dispose();
          }
        });
        modelGroupRef.current = null;
      }
      
      lightsRef.current.forEach(l => sceneRef.current?.remove(l));
      lightsRef.current.forEach(l => l.dispose?.());
      lightsRef.current = [];

      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (currentMount && rendererRef.current.domElement && currentMount.contains(rendererRef.current.domElement)) {
          currentMount.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current = null;
      }
      sceneRef.current = null;
      cameraRef.current = null;
    };
  }, [modelPath, onModelErrorOrMissing, containerRef, handleModelClick, gyroPermissionState, isGyroActive]);


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
      {showGyroButton && gyroPermissionState === 'prompt' && !isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
            <Button variant="outline" size="sm" onClick={handleGyroRequest} className="bg-background/70 backdrop-blur-sm">
                <Orbit className="mr-2 h-4 w-4" />
                Enable Gyro Control
            </Button>
        </div>
      )}
    </div>
  );
};

export default ProjectModelViewer;
