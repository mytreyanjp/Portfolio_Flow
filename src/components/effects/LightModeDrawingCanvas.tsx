
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
  
  // Refs for props/state to be used in stable callbacks
  const isDrawingActiveRef = useRef(isDrawingActive);
  useEffect(() => {
    isDrawingActiveRef.current = isDrawingActive;
  }, [isDrawingActive]);

  // Store points in a ref to avoid re-triggering useCallback for animatePoints
  const drawnPointsListRef = useRef<Point[]>([]);
  
  // State for points to trigger re-renders when points are added/removed, used by animation loop condition
  const [pointsCount, setPointsCount] = useState(0);


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
    
    drawnPointsListRef.current = stillRelevantPoints; // Update ref with filtered points
    
    if (stillRelevantPoints.length !== pointsCount) {
        setPointsCount(stillRelevantPoints.length); // Trigger re-evaluation of animation loop if count changes
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

        if (stillRelevantPoints.length < 2) { // Single point
            const p = stillRelevantPoints[0];
            const opacity = getOpacity(p);
            if (opacity > 0) {
                ctx.fillStyle = `rgba(${PENCIL_COLOR_RGB}, ${opacity})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, LINE_WIDTH / 2, 0, 2 * Math.PI);
                ctx.fill();
            }
        } else {
            // Draw first segment: line from P0 to Mid(P0, P1) or P0 to P1 if only 2 points
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

            // Draw quadratic curve segments for intermediate points
            // Curve uses P_i as control, from Mid(P_{i-1},P_i) to Mid(P_i,P_{i+1})
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

            // Draw last segment: line from Mid(P_{n-1}, P_n) to P_n
            if (stillRelevantPoints.length > 2) { // Ensured a curve was drawn
                const pN_1 = stillRelevantPoints[stillRelevantPoints.length - 2];
                const pN = stillRelevantPoints[stillRelevantPoints.length - 1];
                let opN = getOpacity(pN); // Opacity of the end point
                // More accurately, opacity of the segment could be from pN_1 or average. Using pN's for simplicity.
                if (opN > 0) { // Check if the segment itself should be visible
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
      // Clear canvas one last time if nothing to draw and not active
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [pointsCount]); // Re-evaluate if pointsCount changes

  // Effect for managing the animation loop
  useEffect(() => {
    const needsAnimation = isDrawingActiveRef.current || drawnPointsListRef.current.length > 0;
    if (needsAnimation && !animationFrameIdRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(animatePoints);
    }
    // Cleanup on unmount
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [isDrawingActive, pointsCount, animatePoints]); // pointsCount is used instead of drawnPointsListRef.current.length


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
    
    const lastMousePositionRef = useRef<Point | null>(null);

    const localHandleMouseMove = (event: MouseEvent) => {
      if (!isDrawingActiveRef.current) {
        lastMousePositionRef.current = null; // Reset if drawing becomes inactive
        return;
      }

      const currentPosition = { x: event.clientX, y: event.clientY, timestamp: Date.now() };

      if (lastMousePositionRef.current) {
        const dx = currentPosition.x - lastMousePositionRef.current.x;
        const dy = currentPosition.y - lastMousePositionRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < MIN_DISTANCE_BETWEEN_POINTS) {
          return; // Don't add point if too close to the last one
        }
      }
      
      drawnPointsListRef.current = [...drawnPointsListRef.current, currentPosition];
      setPointsCount(drawnPointsListRef.current.length); // Update count to trigger animation check
      lastMousePositionRef.current = currentPosition;
    };

    fitToContainer(); // Initial resize
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
  }, []); // Empty dependency: setup/teardown global listeners once

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
        zIndex: 1, // Ensure it's above background lines, below main content
        opacity: shouldRenderCanvas ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
      }}
      aria-hidden="true"
    />
  );
};

export default LightModeDrawingCanvas;
