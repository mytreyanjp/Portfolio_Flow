
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

const LINE_COLOR_RGB = '50, 50, 50'; // Dark gray for paint strip
const LINE_WIDTH = 12; // Increased for paint strip effect
const BASE_LINE_OPACITY = 0.5; 
const BLUR_AMOUNT_PX = 2; 

const FADE_START_DELAY_MS = 1000;
const FADE_DURATION_MS = 2000;
const TOTAL_FADE_TIME_MS = FADE_START_DELAY_MS + FADE_DURATION_MS;

const LERP_FACTOR_CURSOR_FOLLOW = 0.15;
const MIN_DISTANCE_TO_ADD_LERPED_POINT = 1.5;
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
  const drawnPointsListRef = useRef<Point[]>([]);
  
  const isDrawingActiveRef = useRef(isDrawingActive);
  const lastRawMousePositionRef = useRef<Point | null>(null);
  const [hasPointsToRender, setHasPointsToRender] = useState(false);
  
  useEffect(() => {
    isDrawingActiveRef.current = isDrawingActive;
  }, [isDrawingActive]);

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
        }
      }
    }
    
    if (drawnPointsListRef.current.length > MAX_POINTS_IN_TAIL) {
      drawnPointsListRef.current.splice(0, drawnPointsListRef.current.length - MAX_POINTS_IN_TAIL);
    }

    const stillRelevantPoints = drawnPointsListRef.current.filter(point => (now - point.timestamp) < TOTAL_FADE_TIME_MS);
    drawnPointsListRef.current = stillRelevantPoints;
        
    setHasPointsToRender(stillRelevantPoints.length > 0);

    const getFadeOpacity = (point: Point) => {
        const age = now - point.timestamp;
        let opacity = 1;
        if (age > FADE_START_DELAY_MS) {
            opacity = Math.max(0, 1 - (age - FADE_START_DELAY_MS) / FADE_DURATION_MS);
        }
        return opacity;
    };

    if (stillRelevantPoints.length > 1) {
      if (BLUR_AMOUNT_PX > 0) {
        ctx.filter = `blur(${BLUR_AMOUNT_PX}px)`;
      }
      ctx.lineWidth = LINE_WIDTH;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 0; i < stillRelevantPoints.length - 1; i++) {
        const p0 = i > 0 ? stillRelevantPoints[i - 1] : stillRelevantPoints[i];
        const p1 = stillRelevantPoints[i];
        const p2 = stillRelevantPoints[i + 1];
        
        const fadeOpacity = getFadeOpacity(p1);
        if (fadeOpacity <= 0) continue;

        const finalOpacity = BASE_LINE_OPACITY * fadeOpacity;
        ctx.strokeStyle = `rgba(${LINE_COLOR_RGB}, ${finalOpacity})`;
        
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
      if (BLUR_AMOUNT_PX > 0) {
        ctx.filter = 'none'; 
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

  useEffect(() => {
    const needsAnimation = isDrawingActiveRef.current || drawnPointsListRef.current.length > 0;
    if (needsAnimation && !animationFrameIdRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(animatePoints);
    } else if (!needsAnimation && animationFrameIdRef.current) {
        // If drawing is not active and no points are left, ensure animation stops
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx && canvasRef.current) {
             ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    }
  }, [isDrawingActive, hasPointsToRender, animatePoints]); // hasPointsToRender helps manage stopping the animation

  const shouldRenderCanvas = isDrawingActiveRef.current || hasPointsToRender;

  if (!shouldRenderCanvas && !isDrawingActiveRef.current) { // More explicit condition
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

