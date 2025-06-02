
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

const PENCIL_COLOR_RGB = '50, 50, 50'; // Dark gray for pencil
const LINE_WIDTH = 3.5; // Increased line width for a thicker tail
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

  // Refs for props/state to be used in stable callbacks
  const isDrawingActiveRef = useRef(isDrawingActive);
  useEffect(() => {
    isDrawingActiveRef.current = isDrawingActive;
  }, [isDrawingActive]);

  const drawnPointsRef = useRef(drawnPoints);
  useEffect(() => {
    drawnPointsRef.current = drawnPoints;
  }, [drawnPoints]);

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

    const currentDisplayPoints = drawnPointsRef.current;
    const stillRelevantPoints = currentDisplayPoints.filter(point => (now - point.timestamp) < TOTAL_FADE_TIME_MS);

    if (stillRelevantPoints.length >= 2) {
      ctx.lineWidth = LINE_WIDTH;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 1; i < stillRelevantPoints.length; i++) {
        const p1 = stillRelevantPoints[i - 1];
        const p2 = stillRelevantPoints[i];

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

    // Update the state only if the filtered list of points has changed
    if (stillRelevantPoints.length !== currentDisplayPoints.length) {
      setDrawnPoints(stillRelevantPoints);
    }

    if (isDrawingActiveRef.current || stillRelevantPoints.length > 0) {
      animationFrameIdRef.current = requestAnimationFrame(animatePoints);
    } else {
      animationFrameIdRef.current = null;
    }
  }, [setDrawnPoints]); // setDrawnPoints is stable

  // Effect for managing the animation loop
  useEffect(() => {
    const needsAnimation = isDrawingActive || drawnPoints.length > 0;
    if (needsAnimation && !animationFrameIdRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(animatePoints);
    }
    // Cleanup on unmount or if animation is no longer needed by animatePoints logic
    return () => {
      if (animationFrameIdRef.current && !(isDrawingActiveRef.current || drawnPointsRef.current.length > 0)) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [isDrawingActive, drawnPoints.length, animatePoints]);


  // Effect for setting up and tearing down global event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const fitToContainer = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };

    const localHandleMouseMove = (event: MouseEvent) => {
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

      setDrawnPoints(prevPoints => [...prevPoints, currentPosition]);
      lastMousePositionRef.current = currentPosition;
    };

    fitToContainer(); // Initial resize
    window.addEventListener('resize', fitToContainer);
    document.addEventListener('mousemove', localHandleMouseMove);

    return () => {
      window.removeEventListener('resize', fitToContainer);
      document.removeEventListener('mousemove', localHandleMouseMove);
      if (animationFrameIdRef.current) { // Ensure animation stops on unmount
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [setDrawnPoints]); // setDrawnPoints is stable

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
        zIndex: 1,
        opacity: (isDrawingActive || drawnPoints.length > 0) ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
      }}
      aria-hidden="true"
    />
  );
};

export default LightModeDrawingCanvas;
