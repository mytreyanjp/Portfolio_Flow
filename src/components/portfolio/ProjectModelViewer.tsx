
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
const SCROLL_ZOOM_FACTOR_MIN = 2.0;
const SCROLL_ZOOM_FACTOR_MAX = 3.0;

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

  useEffect(() => {
    let isMounted = true;
    let animationFrameId: number | null = null;
    let resizeObs: ResizeObserver | null = null;
    let intersecObs: IntersectionObserver | null = null;
    let deviceOrientationListenerAttached = false;
    let isIntersecting = false;

    const effectModelPath = modelPath;
    const currentMount = mountRef.current;
    const parentContainer = containerRef.current;

    // --- Initial validation ---
    if (!effectModelPath || !currentMount || !parentContainer) {
      setError(effectModelPath ? "Initialization failed: Mounting point not ready." : "No model path provided.");
      setIsLoading(false);
      onModelErrorOrMissing?.();
      return;
    }
    
    // --- Reset state for new model ---
    setError(null);
    setDetailedError(null);
    setIsLoading(true);

    // --- Cleanup function for the entire effect ---
    const cleanup = () => {
      isMounted = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      resizeObs?.disconnect();
      intersecObs?.disconnect();
      
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('blur', handleWindowBlur);
      currentMount.removeEventListener('click', handleModelClick);
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
      }
      
      lightsRef.current.forEach(l => sceneRef.current?.remove(l));
      lightsRef.current.forEach(l => l.dispose?.());

      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (currentMount.contains(rendererRef.current.domElement)) {
          currentMount.removeChild(rendererRef.current.domElement);
        }
      }
      
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      modelGroupRef.current = null;
      lightsRef.current = [];
    };

    const handleDeviceOrientation = (event: DeviceOrientationEvent) => { /* ... */ };
    const handleGlobalMouseMove = (event: MouseEvent) => { /* ... */ };
    const handleScroll = () => { /* ... */ };
    const handleWindowFocus = () => isWindowFocusedRef.current = true;
    const handleWindowBlur = () => isWindowFocusedRef.current = false;
    
    // --- Main initialization logic ---
    const initThree = () => {
      if (!isMounted || !currentMount) return;
      
      isWindowFocusedRef.current = (typeof document !== 'undefined' && document.hasFocus());
      targetRotationRef.current = { x: 0, y: 0 };
      targetCameraZRef.current = SCROLL_ZOOM_FACTOR_MIN;
      initialGyroOffsetRef.current = { beta: null, gamma: null };
      isJumpingRef.current = false;

      const scene = new THREE.Scene();
      sceneRef.current = scene;
      
      const camera = new THREE.PerspectiveCamera(50, currentMount.clientWidth / currentMount.clientHeight, 0.1, 100);
      camera.position.set(0, 0, targetCameraZRef.current);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight, false);
      renderer.setClearAlpha(0);
      rendererRef.current = renderer;

      if (currentMount.firstChild) currentMount.removeChild(currentMount.firstChild);
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

      const animate = () => {
        if (!isMounted) return;
        animationFrameId = requestAnimationFrame(animate);
        const localRenderer = rendererRef.current;
        const localCamera = cameraRef.current;
        const localScene = sceneRef.current;
        const model = modelGroupRef.current;
        if (localRenderer && localCamera && localScene && currentMount) {
          const { clientWidth: width, clientHeight: height } = currentMount;
          if (width > 0 && height > 0) {
            const canvas = localRenderer.domElement;
            const needResize = canvas.width !== Math.floor(width * localRenderer.getPixelRatio()) || canvas.height !== Math.floor(height * localRenderer.getPixelRatio());
            if (needResize) {
              localRenderer.setSize(width, height, false);
              localCamera.aspect = width / height;
              localCamera.updateProjectionMatrix();
            }
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
          if (width > 0 && height > 0) localRenderer.render(localScene, localCamera);
        }
      };
      animate();
    };

    let initCalled = false;
    resizeObs = new ResizeObserver(entries => {
      if (initCalled) return;
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          initThree();
          initCalled = true;
          resizeObs?.disconnect();
        }
      }
    });
    resizeObs.observe(currentMount);
    
    intersecObs = new IntersectionObserver(([entry]) => { isIntersecting = entry.isIntersecting; }, { threshold: 0.01 });
    intersecObs.observe(parentContainer);

    return cleanup;
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
