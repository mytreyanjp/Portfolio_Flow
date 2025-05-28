
'use client';

import React, { useState, useEffect, useRef } from 'react';

const MAX_POINTS = 20;
const STROKE_COLOR = '#C95EE4'; // A purple color similar to dark theme's accent
const STROKE_WIDTH = 3;

interface Point {
  x: number;
  y: number;
}

export default function CursorTail() {
  const [points, setPoints] = useState<Point[]>([]);
  const animationFrameId = useRef<number | null>(null);
  const mousePosition = useRef<Point>({ x: 0, y: 0 });

  useEffect(() => {
    console.log('[CursorTail] useEffect: Component did mount.');

    const handleMouseMove = (event: MouseEvent) => {
      mousePosition.current = { x: event.clientX, y: event.clientY };
      // console.log('[CursorTail] Mouse moved:', mousePosition.current);
    };

    const updateTrail = () => {
      setPoints((prevPoints) => {
        const newPoint = { ...mousePosition.current }; // Capture current mouse position
        const updatedPoints = [...prevPoints, newPoint];
        // console.log('[CursorTail] updateTrail - newPoint:', newPoint, 'updatedPoints length:', updatedPoints.length);
        if (updatedPoints.length > MAX_POINTS) {
          return updatedPoints.slice(updatedPoints.length - MAX_POINTS);
        }
        return updatedPoints;
      });
      animationFrameId.current = requestAnimationFrame(updateTrail);
    };

    window.addEventListener('mousemove', handleMouseMove);
    console.log('[CursorTail] useEffect: Added mousemove listener.');

    // Start the animation loop
    animationFrameId.current = requestAnimationFrame(updateTrail);
    console.log('[CursorTail] useEffect: Initialized animation frame loop.');

    return () => {
      console.log('[CursorTail] useEffect: Component will unmount. Cleaning up...');
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        console.log('[CursorTail] useEffect: Canceled animation frame.');
      }
    };
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  
  // console.log('[CursorTail] Render - Points count:', points.length, 'Polyline points string:', polylinePoints.substring(0, 50) + '...');

  if (points.length < 2) {
    // console.log('[CursorTail] Render: Not enough points to draw line (points.length:', points.length, ')');
    return null;
  }

  // console.log('[CursorTail] Render: Rendering SVG. Points count:', points.length);
  return (
    <svg
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none', // Essential: allows clicks to pass through
        zIndex: 9999, // Dramatically increased for testing visibility
      }}
      aria-hidden="true" // Good for accessibility as it's decorative
    >
      <polyline
        points={polylinePoints}
        fill="none"
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: 0.7 }}
      />
    </svg>
  );
}
