
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';

const PENCIL_COLOR_RGB = '50, 50, 50'; // Dark gray for pencil
const LINE_WIDTH = 1.5;
const FADE_START_DELAY_MS = 3000; // Start fading after 3 seconds
const FADE_DURATION_MS = 1000;   // Fade over 1 second

interface DrawnPoint {
  x: number;
  y: number;
}

interface DrawnPath {
  id: string;
  points: DrawnPoint[];
  startTime: number; // Timestamp of mousedown
}

let pathIdCounter = 0;

const LightModeDrawingCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();
  const isLightMode = resolvedTheme === 'light';

  const [isDrawing, setIsDrawing] = useState(false);
  const [paths, setPaths] = useState<DrawnPath[]>([]);
  const currentPathRef = useRef<DrawnPoint[]>([]);
  const animationFrameIdRef = useRef<number | null>(null);

  const getMousePos = (event: MouseEvent | React.MouseEvent<HTMLCanvasElement>): DrawnPoint => {
    return { x: event.clientX, y: event.clientY };
  };

  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (event.button !== 0 || !isLightMode) return; // Only main mouse button
    setIsDrawing(true);
    currentPathRef.current = [getMousePos(event)];
    // Ensure animation loop is running
    if (!animationFrameIdRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(animate);
    }
  }, [isLightMode]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDrawing || !isLightMode) return;
    currentPathRef.current.push(getMousePos(event));
    // Ensure animation loop is running (in case it stopped)
    if (!animationFrameIdRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(animate);
    }
  }, [isDrawing, isLightMode]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !isLightMode) return;
    setIsDrawing(false);
    if (currentPathRef.current.length > 1) {
      setPaths(prevPaths => [
        ...prevPaths,
        {
          id: `path-${pathIdCounter++}`,
          points: [...currentPathRef.current],
          startTime: Date.now(),
        },
      ]);
    }
    currentPathRef.current = [];
  }, [isDrawing, isLightMode]);

  const animate = useCallback(() => {
    if (!canvasRef.current || !isLightMode) {
      animationFrameIdRef.current = null;
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const now = Date.now();
    let hasActiveDrawing = false;

    // Draw existing paths with fading logic
    const updatedPaths = paths.filter(path => {
      const age = now - path.startTime;
      if (age > FADE_START_DELAY_MS + FADE_DURATION_MS) {
        return false; // Path has fully faded, remove
      }

      let opacity = 1;
      if (age > FADE_START_DELAY_MS) {
        opacity = Math.max(0, 1 - (age - FADE_START_DELAY_MS) / FADE_DURATION_MS);
      }

      if (opacity > 0 && path.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(path.points[0].x, path.points[0].y);
        for (let i = 1; i < path.points.length; i++) {
          ctx.lineTo(path.points[i].x, path.points[i].y);
        }
        ctx.strokeStyle = `rgba(${PENCIL_COLOR_RGB}, ${opacity})`;
        ctx.lineWidth = LINE_WIDTH;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        hasActiveDrawing = true;
      }
      return opacity > 0;
    });
    setPaths(updatedPaths);


    // Draw current path if isDrawing
    if (isDrawing && currentPathRef.current.length > 1) {
      ctx.beginPath();
      ctx.moveTo(currentPathRef.current[0].x, currentPathRef.current[0].y);
      for (let i = 1; i < currentPathRef.current.length; i++) {
        ctx.lineTo(currentPathRef.current[i].x, currentPathRef.current[i].y);
      }
      ctx.strokeStyle = `rgba(${PENCIL_COLOR_RGB}, 1)`; // Current path is full opacity
      ctx.lineWidth = LINE_WIDTH;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      hasActiveDrawing = true;
    }

    if (hasActiveDrawing || updatedPaths.length > 0) {
      animationFrameIdRef.current = requestAnimationFrame(animate);
    } else {
      animationFrameIdRef.current = null; // Stop animation if nothing to draw
    }
  }, [isLightMode, isDrawing, paths]);


  useEffect(() => {
    // General effect for managing animation loop start/stop based on dependencies
    if (isLightMode && (paths.length > 0 || isDrawing) && !animationFrameIdRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(animate);
    } else if (!isLightMode || (paths.length === 0 && !isDrawing)) {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      // Clear canvas if not in light mode or nothing to draw
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, [isLightMode, paths, isDrawing, animate]);


  useEffect(() => {
    if (!isLightMode) {
      setIsDrawing(false);
      setPaths([]);
      currentPathRef.current = [];
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const fitToContainer = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Force a redraw if animation wasn't running
      if (!animationFrameIdRef.current && (paths.length > 0 || isDrawing)) {
         animationFrameIdRef.current = requestAnimationFrame(animate);
      }
    };

    fitToContainer();
    window.addEventListener('resize', fitToContainer);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseUp); // Treat mouseleave as mouseup

    return () => {
      window.removeEventListener('resize', fitToContainer);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseUp);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [isLightMode, animate, handleMouseDown, handleMouseMove, handleMouseUp]);


  if (!isLightMode) {
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
        pointerEvents: 'none', // Canvas doesn't capture mouse events directly, uses document listeners
        zIndex: 0, // Behind main content (z-10), above dark theme effects (z--1)
        opacity: isLightMode ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
      }}
      aria-hidden="true"
    />
  );
};

export default LightModeDrawingCanvas;
