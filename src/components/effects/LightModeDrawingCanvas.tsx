
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

const PENCIL_COLOR_RGB = '50, 50, 50'; // Dark gray for pencil
const FADE_START_DELAY_MS = 1000; // Start fading after 1 second
const FADE_DURATION_MS = 2000;   // Fade out over 2 seconds
const TOTAL_FADE_TIME_MS = FADE_START_DELAY_MS + FADE_DURATION_MS; // Now 3000ms
const MIN_DISTANCE_BETWEEN_POINTS = 2;

// New constants for spray paint effect
const SPRAY_AREA_DIAMETER = 20; // How wide the spray effect is
const SPRAY_PARTICLES_PER_POINT = 15; // Number of particles per mouse point
const SPRAY_PARTICLE_MIN_RADIUS = 0.5;
const SPRAY_PARTICLE_MAX_RADIUS = 2.5;


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
  
  // Store points in a ref to avoid re-triggering effects that depend on it
  const drawnPointsListRef = useRef<Point[]>([]);
  // State to trigger re-renders when points are added/removed, to manage animation loop
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
    
    // Update the ref directly
    drawnPointsListRef.current = stillRelevantPoints;
        
    // If the number of relevant points changed, update state to ensure loop continues/stops correctly
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

    if (stillRelevantPoints.length > 0) {
      stillRelevantPoints.forEach(point => {
        const baseOpacity = getOpacity(point);
        if (baseOpacity <= 0) return; // Don't draw fully faded points

        // Spray paint effect
        for (let i = 0; i < SPRAY_PARTICLES_PER_POINT; i++) {
          const angle = Math.random() * 2 * Math.PI;
          // Distribute points more towards the center for a denser core
          const radiusMagnitude = Math.pow(Math.random(), 1.5) * (SPRAY_AREA_DIAMETER / 2); // Pow for denser center
          const offsetX = Math.cos(angle) * radiusMagnitude;
          const offsetY = Math.sin(angle) * radiusMagnitude;
          
          const particleRadius = SPRAY_PARTICLE_MIN_RADIUS + Math.random() * (SPRAY_PARTICLE_MAX_RADIUS - SPRAY_PARTICLE_MIN_RADIUS);
          // Vary particle opacity slightly for a more natural look
          const particleOpacity = baseOpacity * (0.6 + Math.random() * 0.4); // Random variation

          ctx.fillStyle = `rgba(${PENCIL_COLOR_RGB}, ${particleOpacity})`;
          ctx.beginPath();
          ctx.arc(point.x + offsetX, point.y + offsetY, particleRadius, 0, 2 * Math.PI);
          ctx.fill();
        }
      });
    }

    // Decide if animation should continue
    if (isDrawingActiveRef.current || stillRelevantPoints.length > 0) {
      animationFrameIdRef.current = requestAnimationFrame(animatePoints);
    } else {
      animationFrameIdRef.current = null;
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Final clear if nothing to draw
    }
  }, [pointsCount]); // Depend on pointsCount to re-evaluate loop logic

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
    
    // Update points ref and then set state to trigger re-render/animation check
    drawnPointsListRef.current = [...drawnPointsListRef.current, currentPosition];
    setPointsCount(prevCount => prevCount + 1); 
    lastMousePositionRef.current = currentPosition;
  }, []); // Empty dependency array as refs are stable

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const fitToContainer = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    
    fitToContainer(); // Initial size set
    window.addEventListener('resize', fitToContainer);
    document.addEventListener('mousemove', localHandleMouseMove);

    // Initial kick-off for animation if active
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

  // This effect specifically manages starting/stopping the animation loop
  useEffect(() => {
    const needsAnimation = isDrawingActiveRef.current || pointsCount > 0;
    if (needsAnimation && !animationFrameIdRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(animatePoints);
    }
    // The animation loop will stop itself if !needsAnimation by not requesting another frame
  }, [isDrawingActive, pointsCount, animatePoints]);

  const shouldRenderCanvas = isDrawingActive || pointsCount > 0;

  if (!shouldRenderCanvas && !isDrawingActiveRef.current) {
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
        zIndex: 1, // Above background lines, below main content
        opacity: (isDrawingActiveRef.current || pointsCount > 0) ? 1 : 0, 
        transition: 'opacity 0.3s ease-in-out',
      }}
      aria-hidden="true"
    />
  );
};

export default LightModeDrawingCanvas;
