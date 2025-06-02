
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

const PENCIL_COLOR_RGB = '50, 50, 50'; // Dark gray for pencil
const LINE_WIDTH = 1.5;
const FADE_START_DELAY_MS = 2000; // Start fading after 2 seconds
const FADE_DURATION_MS = 1500;   // Fade over 1.5 seconds
const TOTAL_FADE_TIME_MS = FADE_START_DELAY_MS + FADE_DURATION_MS;
const MIN_DISTANCE_BETWEEN_POINTS = 2; // To avoid adding too many points if mouse barely moves

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
  const [drawnPoints, setDrawnPoints] = useState<Point[]>([]);
  const lastMousePositionRef = useRef<Point | null>(null);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      animationFrameIdRef.current = null;
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const now = Date.now();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const updatedPoints = drawnPoints.filter(point => (now - point.timestamp) < TOTAL_FADE_TIME_MS);
    
    if (updatedPoints.length >= 2) {
      ctx.lineWidth = LINE_WIDTH;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 1; i < updatedPoints.length; i++) {
        const p1 = updatedPoints[i-1];
        const p2 = updatedPoints[i];

        const age = now - p1.timestamp; 
        let opacity = 1;

        if (age > FADE_START_DELAY_MS) {
          opacity = Math.max(0, 1 - (age - FADE_START_DELAY_MS) / FADE_DURATION_MS);
        }

        if (opacity > 0) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(${PENCIL_COLOR_RGB}, ${opacity})`;
          ctx.stroke();
        }
      }
    }
    
    setDrawnPoints(updatedPoints);

    if (updatedPoints.length > 0 || isDrawingActive) { // Keep animating if drawing active or points exist
      animationFrameIdRef.current = requestAnimationFrame(animate);
    } else {
      animationFrameIdRef.current = null;
    }
  }, [drawnPoints, isDrawingActive]); // Added isDrawingActive dependency to keep animating if needed

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDrawingActive) {
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
    
    setDrawnPoints(prevPoints => [...prevPoints, currentPosition]);
    lastMousePositionRef.current = currentPosition;

    if (!animationFrameIdRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(animate);
    }
  }, [isDrawingActive, animate]);


  useEffect(() => {
    if (!isDrawingActive) {
      lastMousePositionRef.current = null; 
      // Animation will stop naturally via `animate` if drawnPoints becomes empty
    } else {
      // If drawing becomes active and animation isn't running, start it.
      // This handles cases where it might have stopped if all points faded while active.
      if (!animationFrameIdRef.current) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
      }
    }
  }, [isDrawingActive, animate]);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const fitToContainer = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Re-trigger animation if it stopped, to ensure continuous drawing or fading
      if ((isDrawingActive || drawnPoints.length > 0) && !animationFrameIdRef.current) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
      }
    };

    fitToContainer();
    window.addEventListener('resize', fitToContainer);
    document.addEventListener('mousemove', handleMouseMove);

    // Initial animation kick-off if needed (e.g. if active on load)
    if ((isDrawingActive || drawnPoints.length > 0) && !animationFrameIdRef.current) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
    }

    return () => {
      window.removeEventListener('resize', fitToContainer);
      document.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [handleMouseMove, animate, isDrawingActive, drawnPoints.length]);

  // Render canvas if drawing is active or if there are points still fading
  if (!isDrawingActive && drawnPoints.length === 0) { 
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
        zIndex: 1, // Changed from 0 to 1
        opacity: (isDrawingActive || drawnPoints.length > 0) ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
      }}
      aria-hidden="true"
    />
  );
};

export default LightModeDrawingCanvas;

