
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

const LINE_COLOR_RGB = '50, 50, 50'; 
const LINE_WIDTH = 12; 
const BASE_LINE_OPACITY = 0.5; 
const BLUR_AMOUNT_PX = 2; 

const FADE_START_DELAY_MS = 1000;
const FADE_DURATION_MS = 2000;
const TOTAL_FADE_TIME_MS = FADE_START_DELAY_MS + FADE_DURATION_MS;

const LERP_FACTOR_CURSOR_FOLLOW = 0.15;
const MIN_DISTANCE_TO_ADD_LERPED_POINT = 1; // Decreased from 1.5
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
  const lastRawMousePositionRef = useRef<Point | null>(null); // Stores the actual mouse position
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

    // Generate new smoothed point if drawing is active
    if (isDrawingActiveRef.current && lastRawMousePositionRef.current) {
      const rawMousePos = lastRawMousePositionRef.current;
      if (drawnPointsListRef.current.length === 0) {
        // Start the tail at the current mouse position if it's empty
        drawnPointsListRef.current.push({ x: rawMousePos.x, y: rawMousePos.y, timestamp: now });
      } else {
        const lastSmoothPoint = drawnPointsListRef.current[drawnPointsListRef.current.length - 1];
        // Lerp from the last smoothed point towards the raw mouse position
        const newSmoothX = lastSmoothPoint.x + (rawMousePos.x - lastSmoothPoint.x) * LERP_FACTOR_CURSOR_FOLLOW;
        const newSmoothY = lastSmoothPoint.y + (rawMousePos.y - lastSmoothPoint.y) * LERP_FACTOR_CURSOR_FOLLOW;

        const dx = newSmoothX - lastSmoothPoint.x;
        const dy = newSmoothY - lastSmoothPoint.y;
        const distanceMoved = Math.sqrt(dx * dx + dy * dy);

        // Only add a new point if it has moved sufficiently
        if (distanceMoved >= MIN_DISTANCE_TO_ADD_LERPED_POINT) {
          drawnPointsListRef.current.push({ x: newSmoothX, y: newSmoothY, timestamp: now });
        }
      }
    }
    
    // Limit the number of points in the tail
    if (drawnPointsListRef.current.length > MAX_POINTS_IN_TAIL) {
      drawnPointsListRef.current.splice(0, drawnPointsListRef.current.length - MAX_POINTS_IN_TAIL);
    }

    // Filter out points that have completely faded
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
        const p0 = i > 0 ? stillRelevantPoints[i - 1] : stillRelevantPoints[i]; // Previous or current for first mid calc
        const p1 = stillRelevantPoints[i];     // Current point (control point for curve)
        const p2 = stillRelevantPoints[i + 1]; // Next point

        const fadeOpacity = getFadeOpacity(p1); // Fade based on the current control point's age
        if (fadeOpacity <= 0) continue;

        const finalOpacity = BASE_LINE_OPACITY * fadeOpacity;
        ctx.strokeStyle = `rgba(${LINE_COLOR_RGB}, ${finalOpacity})`;
        
        ctx.beginPath();

        // Calculate midpoints
        // Midpoint before p1 (or p1 itself if it's the very first point of the segment)
        const mid1 = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
        // Midpoint after p1
        const mid2 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

        if (i === 0) { // For the very first segment
            ctx.moveTo(p1.x, p1.y); // Start directly from the first point
            ctx.lineTo(mid2.x, mid2.y); // Line to the midpoint between p1 and p2
        } else { // For subsequent segments, draw a quadratic curve
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
    // Just update the raw mouse position. Point generation happens in animatePoints.
    lastRawMousePositionRef.current = { x: event.clientX, y: event.clientY, timestamp: Date.now() };
    // If drawing is active and animation isn't running, start it.
    if (isDrawingActiveRef.current && !animationFrameIdRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(animatePoints);
    }
  }, [animatePoints]); // animatePoints is stable

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const fitToContainer = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    
    fitToContainer(); // Set initial size
    window.addEventListener('resize', fitToContainer);
    document.addEventListener('mousemove', localHandleMouseMove);

    // Initial animation start if conditions met
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
  }, [localHandleMouseMove, animatePoints]); // Dependencies are stable callbacks

  // Effect to manage starting/stopping animation based on active state and points presence
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
  }, [isDrawingActive, hasPointsToRender, animatePoints]); // hasPointsToRender helps manage stopping

  // Determine if the canvas should be rendered at all
  const shouldRenderCanvas = isDrawingActiveRef.current || hasPointsToRender;

  if (!shouldRenderCanvas && !isDrawingActiveRef.current) { // More explicit condition to avoid rendering an empty canvas
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
        transition: 'opacity 0.3s ease-in-out', // Smooth appearance/disappearance of canvas
      }}
      aria-hidden="true"
    />
  );
};

export default LightModeDrawingCanvas;
