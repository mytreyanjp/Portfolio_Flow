
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

const PENCIL_COLOR_RGB = '50, 50, 50'; // Dark gray for pencil
const LINE_WIDTH = 1.5;
const FADE_START_DELAY_MS = 2000; // Start fading after 2 seconds (reduced from 3)
const FADE_DURATION_MS = 1500;   // Fade over 1.5 seconds (increased from 1)
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
  const lastMousePositionRef = useRef<Point | null>(null); // Used to track last position for segment drawing

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDrawingActive) {
      lastMousePositionRef.current = null; // Reset last position when drawing is inactive
      return;
    }

    const currentPosition = { x: event.clientX, y: event.clientY, timestamp: Date.now() };

    if (lastMousePositionRef.current) {
      const dx = currentPosition.x - lastMousePositionRef.current.x;
      const dy = currentPosition.y - lastMousePositionRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < MIN_DISTANCE_BETWEEN_POINTS) {
        return; // Don't add point if mouse moved too little
      }
    }
    
    setDrawnPoints(prevPoints => [...prevPoints, currentPosition]);
    lastMousePositionRef.current = currentPosition;

    if (!animationFrameIdRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(animate);
    }
  }, [isDrawingActive]);

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

        // Check if p1 and p2 are "connected" (i.e., p2 was drawn immediately after p1)
        // This prevents lines from being drawn across large time gaps if drawing was paused.
        // For a continuous tail, this check might not be strictly necessary if lastMousePositionRef handles breaks.
        // However, for safety with fading, it's good to check.
        // If p2.timestamp - p1.timestamp is large (e.g., > 100ms), consider it a new stroke part.
        // For now, let's assume continuous drawing when active.

        const age = now - p1.timestamp; // Age of the start of the segment
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

    if (updatedPoints.length > 0) {
      animationFrameIdRef.current = requestAnimationFrame(animate);
    } else {
      animationFrameIdRef.current = null;
    }
  }, [drawnPoints]);

  useEffect(() => {
    if (!isDrawingActive) { // If drawing becomes inactive, ensure animation stops if no points left
        if (drawnPoints.length === 0 && animationFrameIdRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
        }
        // Also clear lastMousePositionRef so the next stroke starts fresh
        lastMousePositionRef.current = null; 
    } else { // If drawing becomes active, and animation is not running, start it
        if (drawnPoints.length > 0 && !animationFrameIdRef.current) {
            animationFrameIdRef.current = requestAnimationFrame(animate);
        }
    }
  }, [isDrawingActive, drawnPoints.length, animate]);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const fitToContainer = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (isDrawingActive && drawnPoints.length > 0 && !animationFrameIdRef.current) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
      }
    };

    fitToContainer();
    window.addEventListener('resize', fitToContainer);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', fitToContainer);
      document.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [handleMouseMove, animate, isDrawingActive, drawnPoints.length]); // Added isDrawingActive and drawnPoints.length

  if (!isDrawingActive && drawnPoints.length === 0) { // Only render canvas if active or if points are still fading
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
        zIndex: 0, 
        opacity: (isDrawingActive || drawnPoints.length > 0) ? 1 : 0, // Only visible if drawing or points fading
        transition: 'opacity 0.3s ease-in-out',
      }}
      aria-hidden="true"
    />
  );
};

export default LightModeDrawingCanvas;
