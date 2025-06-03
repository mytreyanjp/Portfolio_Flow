
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

// Constants for the paint strip effect
const LINE_COLOR_RGB = '50, 50, 50'; 
const LINE_WIDTH = 12; 
const BASE_LINE_OPACITY = 0.5; 
const BLUR_AMOUNT_PX = 2; 

const FADE_START_DELAY_MS = 1000;
const FADE_DURATION_MS = 2000;
const TOTAL_FADE_TIME_MS = FADE_START_DELAY_MS + FADE_DURATION_MS;

const LERP_FACTOR_CURSOR_FOLLOW = 0.15;
const MIN_DISTANCE_TO_ADD_LERPED_POINT = 1; 
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
  const pointsRef = useRef<Point[]>([]);
  const lastCursorPosRef = useRef<{ x: number; y: number } | null>(null);
  const lerpedCursorPosRef = useRef<{ x: number; y: number } | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    pointsRef.current = [];
  }, []);

  useEffect(() => {
    if (!isClient || !canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        clearCanvas(); // Clear on resize to avoid stretched drawings
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isClient, clearCanvas]);

  useEffect(() => {
    if (!isDrawingActive) {
      clearCanvas();
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    let isMounted = true;

    const handleMouseMove = (event: MouseEvent) => {
      if (!isMounted) return;
      lastCursorPosRef.current = { x: event.clientX, y: event.clientY };
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!isMounted || event.touches.length === 0) return;
      lastCursorPosRef.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchstart', (e) => { // Prevent scroll on touch
        if (isDrawingActive && e.target === canvasRef.current) e.preventDefault();
    }, { passive: false });


    const draw = () => {
      if (!isMounted || !ctx || !canvas) {
        if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
        return;
      }

      const now = Date.now();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Lerp cursor position for smoother line
      if (lastCursorPosRef.current) {
        if (!lerpedCursorPosRef.current) {
          lerpedCursorPosRef.current = { ...lastCursorPosRef.current };
        } else {
          lerpedCursorPosRef.current.x += (lastCursorPosRef.current.x - lerpedCursorPosRef.current.x) * LERP_FACTOR_CURSOR_FOLLOW;
          lerpedCursorPosRef.current.y += (lastCursorPosRef.current.y - lerpedCursorPosRef.current.y) * LERP_FACTOR_CURSOR_FOLLOW;
        }

        // Add new point if moved enough
        const lastPoint = pointsRef.current[pointsRef.current.length - 1];
        const distance = lastPoint 
          ? Math.sqrt(Math.pow(lerpedCursorPosRef.current.x - lastPoint.x, 2) + Math.pow(lerpedCursorPosRef.current.y - lastPoint.y, 2))
          : Infinity;

        if (distance > MIN_DISTANCE_TO_ADD_LERPED_POINT) {
          pointsRef.current.push({ ...lerpedCursorPosRef.current, timestamp: now });
        }
      }
      
      // Limit number of points
      if (pointsRef.current.length > MAX_POINTS_IN_TAIL) {
        pointsRef.current.shift();
      }

      // Draw lines
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.filter = `blur(${BLUR_AMOUNT_PX}px)`;

      for (let i = 1; i < pointsRef.current.length; i++) {
        const p1 = pointsRef.current[i - 1];
        const p2 = pointsRef.current[i];
        
        const age = now - p2.timestamp;
        let opacity = BASE_LINE_OPACITY;

        if (age > FADE_START_DELAY_MS) {
          opacity = BASE_LINE_OPACITY * (1 - Math.min(1, (age - FADE_START_DELAY_MS) / FADE_DURATION_MS));
        }
        
        if (opacity <= 0) {
          pointsRef.current.splice(i, 1); // Remove faded point
          i--; 
          continue;
        }

        ctx.strokeStyle = `rgba(${LINE_COLOR_RGB}, ${opacity})`;
        ctx.lineWidth = LINE_WIDTH * (opacity / BASE_LINE_OPACITY); // Thinner line as it fades

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      ctx.filter = 'none'; // Reset blur

      animationFrameIdRef.current = requestAnimationFrame(draw);
    };

    if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    draw();

    return () => {
      isMounted = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      // No need to remove touchstart specifically unless more complex logic is added
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      clearCanvas();
    };
  }, [isDrawingActive, isClient, clearCanvas]);

  if (!isClient) return null;

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "fixed inset-0 -z-10 w-screen h-screen pointer-events-none transition-opacity duration-500",
        isDrawingActive ? "opacity-100" : "opacity-0"
      )}
      aria-hidden="true"
    />
  );
};

export default LightModeDrawingCanvas;
