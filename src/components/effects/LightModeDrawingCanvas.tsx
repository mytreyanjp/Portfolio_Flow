
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

const LINE_COLOR_RGB = '50, 50, 50'; // Dark gray for pencil line
const LINE_WIDTH = 3; // Thickness of the line
const FADE_START_DELAY_MS = 1000; // Start fading after 1 second
const FADE_DURATION_MS = 2000;   // Fade out over 2 seconds
const TOTAL_FADE_TIME_MS = FADE_START_DELAY_MS + FADE_DURATION_MS;
const MIN_DISTANCE_BETWEEN_POINTS = 2; // Minimum distance to record a new point

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
  const [pointsCount, setPointsCount] = useState(0); 

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

    if (stillRelevantPoints.length > 1) {
      ctx.lineWidth = LINE_WIDTH;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 0; i < stillRelevantPoints.length - 1; i++) {
        const p0 = i > 0 ? stillRelevantPoints[i - 1] : stillRelevantPoints[i];
        const p1 = stillRelevantPoints[i];
        const p2 = stillRelevantPoints[i + 1];
        const p3 = i < stillRelevantPoints.length - 2 ? stillRelevantPoints[i + 2] : p2;

        // Opacity based on the current segment's starting point (p1)
        const opacity = getOpacity(p1);
        if (opacity <= 0) continue;
        
        ctx.strokeStyle = `rgba(${LINE_COLOR_RGB}, ${opacity})`;
        ctx.beginPath();

        // Calculate midpoints for Catmull-Rom like curve using quadratic Beziers
        const mid1 = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
        const mid2 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
        // const mid3 = { x: (p2.x + p3.x) / 2, y: (p2.y + p3.y) / 2 };


        if (i === 0) { // First segment: line to first midpoint
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(mid2.x, mid2.y);
        } else { // Intermediate segments: curve through p1 to mid2
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
  }, [pointsCount]); 

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
    // Limit the number of points to avoid performance issues, e.g., last 200 points
    if (drawnPointsListRef.current.length > 200) {
        drawnPointsListRef.current.shift();
    }

    setPointsCount(drawnPointsListRef.current.length); 
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
    const needsAnimation = isDrawingActiveRef.current || pointsCount > 0;
    if (needsAnimation && !animationFrameIdRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(animatePoints);
    }
  }, [isDrawingActive, pointsCount, animatePoints]);

  const shouldRenderCanvas = isDrawingActiveRef.current || pointsCount > 0;

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
