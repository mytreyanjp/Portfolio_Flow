
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

const PENCIL_COLOR_RGB = '50, 50, 50'; // Dark gray for pencil
const FADE_START_DELAY_MS = 2000; 
const FADE_DURATION_MS = 1500;   
const TOTAL_FADE_TIME_MS = FADE_START_DELAY_MS + FADE_DURATION_MS;
const MIN_DISTANCE_BETWEEN_POINTS = 2; 

// New constants for spray paint effect
const SPRAY_AREA_DIAMETER = 20; // How wide the spray effect is
const SPRAY_PARTICLES_PER_POINT = 15; // Number of particles per mouse point
const SPRAY_PARTICLE_MIN_RADIUS = 0.5;
const SPRAY_PARTICLE_MAX_RADIUS = 2.5;


interface Point {
  x: number;
  y: number;
  timestamp: number;
}

interface LightModeDrawingCanvasProps {
  isDrawingActive: boolean;
}

const LightModeDrawingCanvas: React.FC<LightModeDrawingCanvasProps> = ({ isDrawingActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const drawnPointsListRef = useRef<Point[]>([]);
  const [pointsCount, setPointsCount] = useState(0); // Used to trigger re-evaluation of animation loop
  
  const isDrawingActiveRef = useRef(isDrawingActive);
  useEffect(() => {
    isDrawingActiveRef.current = isDrawingActive;
  }, [isDrawingActive]);

  const lastMousePositionRef = useRef<Point | null>(null);

  const animatePoints = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      animationFrameIdRef.current = null;
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const now = Date.now();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const currentDisplayPoints = drawnPointsListRef.current;
    const stillRelevantPoints = currentDisplayPoints.filter(point => (now - point.timestamp) < TOTAL_FADE_TIME_MS);
    
    drawnPointsListRef.current = stillRelevantPoints;
        
    if (stillRelevantPoints.length !== pointsCount) {
        setPointsCount(stillRelevantPoints.length); 
    }

    const getOpacity = (point: Point) => {
        const age = now - point.timestamp;
        let opacity = 1;
        if (age > FADE_START_DELAY_MS) {
            opacity = Math.max(0, 1 - (age - FADE_START_DELAY_MS) / FADE_DURATION_MS);
        }
        return opacity;
    };

    if (stillRelevantPoints.length > 0) {
      stillRelevantPoints.forEach(point => {
        const baseOpacity = getOpacity(point);
        if (baseOpacity <= 0) return;

        for (let i = 0; i < SPRAY_PARTICLES_PER_POINT; i++) {
          const angle = Math.random() * 2 * Math.PI;
          // Distribute points more towards the center for a denser core
          const radiusMagnitude = Math.random() * (SPRAY_AREA_DIAMETER / 2);
          const offsetX = Math.cos(angle) * radiusMagnitude;
          const offsetY = Math.sin(angle) * radiusMagnitude;
          
          const particleRadius = SPRAY_PARTICLE_MIN_RADIUS + Math.random() * (SPRAY_PARTICLE_MAX_RADIUS - SPRAY_PARTICLE_MIN_RADIUS);
          // Vary particle opacity slightly for a more natural look
          const particleOpacity = baseOpacity * (0.6 + Math.random() * 0.4);

          ctx.fillStyle = `rgba(${PENCIL_COLOR_RGB}, ${particleOpacity})`;
          ctx.beginPath();
          ctx.arc(point.x + offsetX, point.y + offsetY, particleRadius, 0, 2 * Math.PI);
          ctx.fill();
        }
      });
    }

    if (isDrawingActiveRef.current || stillRelevantPoints.length > 0) {
      animationFrameIdRef.current = requestAnimationFrame(animatePoints);
    } else {
      animationFrameIdRef.current = null;
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear if no longer active and no points
    }
  }, [pointsCount]); // animatePoints itself is stable due to useCallback, pointsCount triggers re-check

  const localHandleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDrawingActiveRef.current) {
      lastMousePositionRef.current = null; 
      return;
    }

    const currentPosition = { x: event.clientX, y: event.clientY, timestamp: Date.now() };

    if (lastMousePositionRef.current) {
      const dx = currentPosition.x - lastMousePositionRef.current.x;
      const dy = currentPosition.y - lastMousePositionRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < MIN_DISTANCE_BETWEEN_POINTS) {
        return; 
      }
    }
    
    drawnPointsListRef.current = [...drawnPointsListRef.current, currentPosition];
    setPointsCount(prevCount => prevCount + 1); 
    lastMousePositionRef.current = currentPosition;
  }, []); 

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const fitToContainer = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    
    fitToContainer();
    window.addEventListener('resize', fitToContainer);
    document.addEventListener('mousemove', localHandleMouseMove);

    // Initial kick-off for animation if active
    if (isDrawingActiveRef.current && !animationFrameIdRef.current) {
        animationFrameIdRef.current = requestAnimationFrame(animatePoints);
    }

    return () => {
      window.removeEventListener('resize', fitToContainer);
      document.removeEventListener('mousemove', localHandleMouseMove);
      if (animationFrameIdRef.current) { 
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [localHandleMouseMove, animatePoints]); // Ensure animatePoints is included if its definition might change based on other refs/state

  useEffect(() => {
    // This effect specifically manages starting/stopping the animation loop
    // based on isDrawingActive or if there are points to render/fade.
    const needsAnimation = isDrawingActiveRef.current || pointsCount > 0;
    if (needsAnimation && !animationFrameIdRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(animatePoints);
    } else if (!needsAnimation && animationFrameIdRef.current) {
      // This case might be handled inside animatePoints itself, 
      // but an explicit check here can also be useful.
      // If animatePoints clears its own frame, this might be redundant.
    }
  }, [isDrawingActive, pointsCount, animatePoints]);

  const shouldRenderCanvas = isDrawingActive || pointsCount > 0;

  if (!shouldRenderCanvas && !isDrawingActiveRef.current) { // Only hide if not active AND no points
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 1, 
        opacity: (isDrawingActiveRef.current || pointsCount > 0) ? 1 : 0, // Ensure visible if active or has points
        transition: 'opacity 0.3s ease-in-out',
      }}
      aria-hidden="true"
    />
  );
};

export default LightModeDrawingCanvas;
