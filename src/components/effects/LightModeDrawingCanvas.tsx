
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
    // Resetting cursor positions on clear might be good if drawing stops and starts
    // lastCursorPosRef.current = null; 
    // lerpedCursorPosRef.current = null;
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
        // We might not want to clear on resize if drawing is active and continuous
        // clearCanvas(); 
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isClient, clearCanvas]);

  useEffect(() => {
    if (!isClient || !isDrawingActive) { // Added isClient check here
      clearCanvas();
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      // Ensure cursor positions are reset when drawing becomes inactive
      lastCursorPosRef.current = null;
      lerpedCursorPosRef.current = null;
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    let isMounted = true;

    const handleMouseMove = (event: MouseEvent) => {
      if (!isMounted || !isDrawingActive) return;
      lastCursorPosRef.current = { x: event.clientX, y: event.clientY };
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!isMounted || !isDrawingActive || event.touches.length === 0) return;
       if (event.target === canvasRef.current) { // Only prevent default if touch is on canvas
         event.preventDefault();
       }
      lastCursorPosRef.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    };
    
    const handleTouchStart = (event: TouchEvent) => {
        if (!isMounted || !isDrawingActive || event.touches.length === 0) return;
        if (event.target === canvasRef.current) {
            event.preventDefault(); // Prevent scrolling when drawing starts on canvas
        }
        // Initialize lerped cursor to the first touch point to avoid initial jump
        lerpedCursorPosRef.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
        lastCursorPosRef.current = { ...lerpedCursorPosRef.current }; // Sync last actual pos
        pointsRef.current.push({ ...lerpedCursorPosRef.current, timestamp: Date.now() }); // Add initial point
    };


    window.addEventListener('mousemove', handleMouseMove);
    // Ensure canvas itself doesn't scroll if we are drawing on it
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });


    const draw = () => {
      if (!isMounted || !ctx || !canvas || !isDrawingActive) { // Check isDrawingActive in loop
        if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
        return;
      }

      const now = Date.now();
      // Don't clear if we want persistent trails, but for this effect, clearing is fine.
      ctx.clearRect(0, 0, canvas.width, canvas.height); 

      // Lerp cursor position for smoother line
      if (lastCursorPosRef.current) {
        if (!lerpedCursorPosRef.current) {
          lerpedCursorPosRef.current = { ...lastCursorPosRef.current };
        } else {
          lerpedCursorPosRef.current.x += (lastCursorPosRef.current.x - lerpedCursorPosRef.current.x) * LERP_FACTOR_CURSOR_FOLLOW;
          lerpedCursorPosRef.current.y += (lastCursorPosRef.current.y - lerpedCursorPosRef.current.y) * LERP_FACTOR_CURSOR_FOLLOW;
        }

        const lastPoint = pointsRef.current[pointsRef.current.length - 1];
        const distance = lastPoint && lerpedCursorPosRef.current // Check if lerpedCursorPosRef is not null
          ? Math.sqrt(Math.pow(lerpedCursorPosRef.current.x - lastPoint.x, 2) + Math.pow(lerpedCursorPosRef.current.y - lastPoint.y, 2))
          : Infinity;

        if (distance > MIN_DISTANCE_TO_ADD_LERPED_POINT && lerpedCursorPosRef.current) { // Check if lerpedCursorPosRef is not null
          pointsRef.current.push({ ...lerpedCursorPosRef.current, timestamp: now });
        }
      }
      
      // Remove old points that have completely faded
      pointsRef.current = pointsRef.current.filter(p => (now - p.timestamp) < TOTAL_FADE_TIME_MS);
      
      // Limit number of points to prevent performance issues
      while (pointsRef.current.length > MAX_POINTS_IN_TAIL) {
        pointsRef.current.shift();
      }

      // Draw lines
      if (pointsRef.current.length < 2) {
          animationFrameIdRef.current = requestAnimationFrame(draw);
          return; // Not enough points to draw a line
      }

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.filter = `blur(${BLUR_AMOUNT_PX}px)`;

      for (let i = 1; i < pointsRef.current.length; i++) {
        const p1 = pointsRef.current[i - 1];
        const p2 = pointsRef.current[i];
        
        const age = now - p2.timestamp;
        let opacity = BASE_LINE_OPACITY;

        if (age > FADE_START_DELAY_MS) {
          opacity = BASE_LINE_OPACITY * Math.max(0, (1 - (age - FADE_START_DELAY_MS) / FADE_DURATION_MS));
        }
        
        if (opacity <= 0.01) { // Use a small threshold to avoid drawing invisible lines
          continue; 
        }

        ctx.strokeStyle = `rgba(${LINE_COLOR_RGB}, ${opacity})`;
        // Make line thinner as it fades and ages
        const widthMultiplier = Math.max(0.1, (1 - age / TOTAL_FADE_TIME_MS));
        ctx.lineWidth = Math.max(1, LINE_WIDTH * widthMultiplier); 

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      ctx.filter = 'none'; // Reset blur

      animationFrameIdRef.current = requestAnimationFrame(draw);
    };

    if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    // Initialize lerped cursor position if mouse has already moved
     if (lastCursorPosRef.current && !lerpedCursorPosRef.current) {
        lerpedCursorPosRef.current = { ...lastCursorPosRef.current };
    }
    draw();

    return () => {
      isMounted = false;
      window.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchstart', handleTouchStart);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      // Don't clear canvas here if we want the drawing to persist when isDrawingActive becomes false
      // clearCanvas(); 
    };
  }, [isDrawingActive, isClient, clearCanvas]);

  if (!isClient) return null;

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "fixed inset-0 -z-10 w-screen h-screen pointer-events-none transition-opacity duration-300",
        isDrawingActive ? "opacity-100" : "opacity-0"
      )}
      aria-hidden="true"
    />
  );
};

export default LightModeDrawingCanvas;
