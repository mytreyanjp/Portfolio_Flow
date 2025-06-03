
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

const LINE_COLOR_RGB = '50, 50, 50'; // Dark gray for pencil line
const LINE_WIDTH = 3; 
const FADE_START_DELAY_MS = 1000; 
const FADE_DURATION_MS = 2000;   
const TOTAL_FADE_TIME_MS = FADE_START_DELAY_MS + FADE_DURATION_MS;

const LERP_FACTOR_CURSOR_FOLLOW = 0.15; // Lower = smoother, more "drag"
const MIN_DISTANCE_TO_ADD_LERPED_POINT = 1.5; // Min distance the lerped point must move to add a new segment
const MAX_POINTS_IN_TAIL = 200;


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
  const drawnPointsListRef = useRef<Point[]>([]); // Stores the smoothed points for the tail
  
  const isDrawingActiveRef = useRef(isDrawingActive);
  useEffect(() => {
    isDrawingActiveRef.current = isDrawingActive;
  }, [isDrawingActive]);

  const lastRawMousePositionRef = useRef<Point | null>(null);
  const [hasPointsToRender, setHasPointsToRender] = useState(false);


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

    // Add new smoothed point if drawing is active
    if (isDrawingActiveRef.current && lastRawMousePositionRef.current) {
      const rawMousePos = lastRawMousePositionRef.current;
      if (drawnPointsListRef.current.length === 0) {
        drawnPointsListRef.current.push({ x: rawMousePos.x, y: rawMousePos.y, timestamp: now });
      } else {
        const lastSmoothPoint = drawnPointsListRef.current[drawnPointsListRef.current.length - 1];
        const newSmoothX = lastSmoothPoint.x + (rawMousePos.x - lastSmoothPoint.x) * LERP_FACTOR_CURSOR_FOLLOW;
        const newSmoothY = lastSmoothPoint.y + (rawMousePos.y - lastSmoothPoint.y) * LERP_FACTOR_CURSOR_FOLLOW;

        const dx = newSmoothX - lastSmoothPoint.x;
        const dy = newSmoothY - lastSmoothPoint.y;
        const distanceMoved = Math.sqrt(dx * dx + dy * dy);

        if (distanceMoved >= MIN_DISTANCE_TO_ADD_LERPED_POINT) {
          drawnPointsListRef.current.push({ x: newSmoothX, y: newSmoothY, timestamp: now });
        } else {
          // Optionally, update the last point slightly if not moving enough to add a new one
          // This can make the tail end "settle" but might be too jittery.
          // For now, only add if significant movement.
        }
      }
    }
    
    // Limit the number of points
    if (drawnPointsListRef.current.length > MAX_POINTS_IN_TAIL) {
      drawnPointsListRef.current.splice(0, drawnPointsListRef.current.length - MAX_POINTS_IN_TAIL);
    }

    // Filter out old points for fading
    const stillRelevantPoints = drawnPointsListRef.current.filter(point => (now - point.timestamp) < TOTAL_FADE_TIME_MS);
    drawnPointsListRef.current = stillRelevantPoints;
        
    setHasPointsToRender(stillRelevantPoints.length > 0);

    const getOpacity = (point: Point) => {
        const age = now - point.timestamp;
        let opacity = 1;
        if (age > FADE_START_DELAY_MS) {
            opacity = Math.max(0, 1 - (age - FADE_START_DELAY_MS) / FADE_DURATION_MS);
        }
        return opacity;
    };

    if (stillRelevantPoints.length > 1) {
      ctx.lineWidth = LINE_WIDTH;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 0; i < stillRelevantPoints.length - 1; i++) {
        const p0 = i > 0 ? stillRelevantPoints[i - 1] : stillRelevantPoints[i];
        const p1 = stillRelevantPoints[i];
        const p2 = stillRelevantPoints[i + 1];
        
        const opacity = getOpacity(p1);
        if (opacity <= 0) continue;
        
        ctx.strokeStyle = `rgba(${LINE_COLOR_RGB}, ${opacity})`;
        ctx.beginPath();

        const mid1 = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
        const mid2 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

        if (i === 0) { 
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(mid2.x, mid2.y);
        } else { 
            ctx.moveTo(mid1.x, mid1.y);
            ctx.quadraticCurveTo(p1.x, p1.y, mid2.x, mid2.y);
        }
        ctx.stroke();
      }
    }

    if (isDrawingActiveRef.current || stillRelevantPoints.length > 0) {
      animationFrameIdRef.current = requestAnimationFrame(animatePoints);
    } else {
      animationFrameIdRef.current = null;
      ctx.clearRect(0, 0, canvas.width, canvas.height); 
    }
  }, []); 

  const localHandleMouseMove = useCallback((event: MouseEvent) => {
    lastRawMousePositionRef.current = { x: event.clientX, y: event.clientY, timestamp: Date.now() };
    // If drawing is active and animation isn't running, start it.
    if (isDrawingActiveRef.current && !animationFrameIdRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(animatePoints);
    }
  }, [animatePoints]);

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

    // Initial animation start if active
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
  }, [localHandleMouseMove, animatePoints]); 

  // Effect to manage animation loop based on drawing state AND if points are still rendering
  useEffect(() => {
    const needsAnimation = isDrawingActiveRef.current || drawnPointsListRef.current.length > 0;
    if (needsAnimation && !animationFrameIdRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(animatePoints);
    } else if (!needsAnimation && animationFrameIdRef.current) {
      // No specific stop needed here as animatePoints self-stops if no points and not active
    }
  }, [isDrawingActive, animatePoints]); // Removed pointsCount, relying on animatePoints internal logic

  const shouldRenderCanvas = isDrawingActiveRef.current || hasPointsToRender;

  if (!shouldRenderCanvas) {
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
        opacity: shouldRenderCanvas ? 1 : 0, 
        transition: 'opacity 0.3s ease-in-out',
      }}
      aria-hidden="true"
    />
  );
};

export default LightModeDrawingCanvas;
