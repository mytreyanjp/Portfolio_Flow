
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
  
  const isDrawingActiveRef = useRef(isDrawingActive);
  useEffect(() => {
    isDrawingActiveRef.current = isDrawingActive;
  }, [isDrawingActive]);

  const drawnPointsListRef = useRef<Point[]>([]);
  const [pointsCount, setPointsCount] = useState(0);
  const lastMousePositionRef = useRef<Point | null>(null); // Moved to top level


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

    if (stillRelevantPoints.length > 0) {
        ctx.lineWidth = LINE_WIDTH;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const getOpacity = (point: Point) => {
            const age = now - point.timestamp;
            let opacity = 1;
            if (age > FADE_START_DELAY_MS) {
                opacity = Math.max(0, 1 - (age - FADE_START_DELAY_MS) / FADE_DURATION_MS);
            }
            return opacity;
        };

        if (stillRelevantPoints.length < 2) { 
            const p = stillRelevantPoints[0];
            const opacity = getOpacity(p);
            if (opacity > 0) {
                ctx.fillStyle = `rgba(${PENCIL_COLOR_RGB}, ${opacity})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, LINE_WIDTH / 2, 0, 2 * Math.PI);
                ctx.fill();
            }
        } else {
            const p0 = stillRelevantPoints[0];
            const p1 = stillRelevantPoints[1];
            let op0 = getOpacity(p0);
            if (op0 > 0) {
                ctx.strokeStyle = `rgba(${PENCIL_COLOR_RGB}, ${op0})`;
                ctx.beginPath();
                ctx.moveTo(p0.x, p0.y);
                if (stillRelevantPoints.length === 2) {
                    ctx.lineTo(p1.x, p1.y);
                } else {
                    ctx.lineTo((p0.x + p1.x) / 2, (p0.y + p1.y) / 2);
                }
                ctx.stroke();
            }

            for (let i = 1; i < stillRelevantPoints.length - 1; i++) {
                const prevP = stillRelevantPoints[i-1];
                const currP = stillRelevantPoints[i];
                const nextP = stillRelevantPoints[i+1];
                
                const opCurr = getOpacity(currP);
                if (opCurr <= 0) continue;

                const M_prev_curr = { x: (prevP.x + currP.x) / 2, y: (prevP.y + currP.y) / 2 };
                const M_curr_next = { x: (currP.x + nextP.x) / 2, y: (currP.y + nextP.y) / 2 };

                ctx.strokeStyle = `rgba(${PENCIL_COLOR_RGB}, ${opCurr})`;
                ctx.beginPath();
                ctx.moveTo(M_prev_curr.x, M_prev_curr.y);
                ctx.quadraticCurveTo(currP.x, currP.y, M_curr_next.x, M_curr_next.y);
                ctx.stroke();
            }

            if (stillRelevantPoints.length > 2) { 
                const pN_1 = stillRelevantPoints[stillRelevantPoints.length - 2];
                const pN = stillRelevantPoints[stillRelevantPoints.length - 1];
                let opN = getOpacity(pN); 
                if (opN > 0) { 
                    ctx.strokeStyle = `rgba(${PENCIL_COLOR_RGB}, ${opN})`;
                    ctx.beginPath();
                    ctx.moveTo((pN_1.x + pN.x) / 2, (pN_1.y + pN.y) / 2);
                    ctx.lineTo(pN.x, pN.y);
                    ctx.stroke();
                }
            }
        }
    }

    if (isDrawingActiveRef.current || stillRelevantPoints.length > 0) {
      animationFrameIdRef.current = requestAnimationFrame(animatePoints);
    } else {
      animationFrameIdRef.current = null;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [pointsCount]); // Re-run if pointsCount (derived from drawnPointsListRef.current.length) changes

  useEffect(() => {
    const needsAnimation = isDrawingActiveRef.current || pointsCount > 0;
    if (needsAnimation && !animationFrameIdRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(animatePoints);
    }
    return () => {
      if (animationFrameIdRef.current && !(isDrawingActiveRef.current || pointsCount > 0)) {
        // Intentionally left blank, cleanup is in main unmount and inside animatePoints
      }
    };
  }, [isDrawingActive, pointsCount, animatePoints]);


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
    setPointsCount(prevCount => prevCount + 1); // Increment count to trigger animation check
    lastMousePositionRef.current = currentPosition;
  }, []); // isDrawingActiveRef, lastMousePositionRef, drawnPointsListRef, setPointsCount are stable or refs

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

    return () => {
      window.removeEventListener('resize', fitToContainer);
      document.removeEventListener('mousemove', localHandleMouseMove);
      if (animationFrameIdRef.current) { 
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [localHandleMouseMove]); 

  const shouldRenderCanvas = isDrawingActive || pointsCount > 0;

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
