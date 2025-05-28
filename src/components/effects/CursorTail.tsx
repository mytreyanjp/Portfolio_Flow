
'use client';

import React, { useState, useEffect, useRef } from 'react';

const MAX_POINTS = 10; // Reduced for a shorter, more "beam-like" tail
const STROKE_COLOR = '#D050FF'; // A vibrant purple
const STROKE_WIDTH = 25; // Significantly increased for a thick beam

interface Point {
  x: number;
  y: number;
}

export default function CursorTail() {
  const [points, setPoints] = useState<Point[]>([]);
  const animationFrameId = useRef<number | null>(null);
  const mousePosition = useRef<Point>({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // console.log('[CursorTail] useEffect triggered. isVisible:', isVisible);
    const handleMouseMove = (event: MouseEvent) => {
      mousePosition.current = { x: event.clientX, y: event.clientY };
      if (!isVisible) {
        // console.log('[CursorTail] Mouse moved, setting isVisible to true');
        setIsVisible(true);
      }
    };

    const updateTrail = () => {
      setPoints((prevPoints) => {
        const newPoint = { ...mousePosition.current };
        const updatedPoints = [...prevPoints, newPoint];
        if (updatedPoints.length > MAX_POINTS) {
          return updatedPoints.slice(updatedPoints.length - MAX_POINTS);
        }
        return updatedPoints;
      });
      animationFrameId.current = requestAnimationFrame(updateTrail);
    };

    // console.log('[CursorTail] Adding mousemove listener');
    window.addEventListener('mousemove', handleMouseMove);
    
    // Start animation loop only if component is visible (mouse has moved once)
    // This was part of a previous debug, let's ensure it starts if isVisible is true or becomes true
    if (isVisible) {
        // console.log('[CursorTail] isVisible is true, starting animation loop.');
        if (animationFrameId.current === null) { // Ensure it only starts once
            animationFrameId.current = requestAnimationFrame(updateTrail);
        }
    }


    return () => {
      // console.log('[CursorTail] Cleanup: Removing mousemove listener and canceling animation frame');
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, [isVisible]); // Re-run effect if isVisible changes

  // Effect to start the animation loop once isVisible becomes true
  useEffect(() => {
    let animId: number;
    if (isVisible && animationFrameId.current === null) {
        // console.log('[CursorTail] isVisible became true, ensuring animation loop starts.');
        const updateTrailLoop = () => {
          setPoints((prevPoints) => {
            const newPoint = { ...mousePosition.current };
            const updatedPoints = [...prevPoints, newPoint];
            if (updatedPoints.length > MAX_POINTS) {
              return updatedPoints.slice(updatedPoints.length - MAX_POINTS);
            }
            return updatedPoints;
          });
          animId = requestAnimationFrame(updateTrailLoop);
          animationFrameId.current = animId; // Store the current animation frame ID
        };
        animId = requestAnimationFrame(updateTrailLoop);
        animationFrameId.current = animId; // Store the initial animation frame ID
    }
    // No cleanup needed here for the animation frame itself as the main effect handles it
  }, [isVisible]);


  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  if (!isVisible || points.length < 2) {
    // console.log('[CursorTail] Not rendering: isVisible is false or points length < 2');
    return null;
  }

  // console.log('[CursorTail] Rendering SVG with points:', polylinePoints);
  return (
    <svg
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: -1, // Ensure it's behind page content
        filter: `drop-shadow(0 0 15px ${STROKE_COLOR}C0) drop-shadow(0 0 30px ${STROKE_COLOR}A0) drop-shadow(0 0 45px ${STROKE_COLOR}80)`, // Enhanced glow
      }}
      aria-hidden="true"
    >
      <polyline
        points={polylinePoints}
        fill="none"
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: 0.85 }} // Increased opacity for a less transparent core beam
      />
    </svg>
  );
}
