
'use client';

import React, { useState, useEffect, useRef } from 'react';

const MAX_POINTS = 20;
const STROKE_COLOR = '#E070FF'; // Brighter purple for neon effect
const STROKE_WIDTH = 1.5; // Thinner line

interface Point {
  x: number;
  y: number;
}

export default function CursorTail() {
  const [points, setPoints] = useState<Point[]>([]);
  const animationFrameId = useRef<number | null>(null);
  const mousePosition = useRef<Point>({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false); // To avoid rendering an empty SVG initially

  useEffect(() => {
    // console.log('[CursorTail] useEffect: Component did mount.');

    const handleMouseMove = (event: MouseEvent) => {
      mousePosition.current = { x: event.clientX, y: event.clientY };
      if (!isVisible) setIsVisible(true); // Show tail once mouse moves
      // console.log('[CursorTail] Mouse moved:', mousePosition.current);
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

    window.addEventListener('mousemove', handleMouseMove);
    // console.log('[CursorTail] useEffect: Added mousemove listener.');

    animationFrameId.current = requestAnimationFrame(updateTrail);
    // console.log('[CursorTail] useEffect: Initialized animation frame loop.');

    return () => {
      // console.log('[CursorTail] useEffect: Component will unmount. Cleaning up...');
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        // console.log('[CursorTail] useEffect: Canceled animation frame.');
      }
    };
  }, [isVisible]);

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  if (!isVisible || points.length < 2) {
    return null;
  }

  return (
    <svg
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: -1, // Positioned behind normal flow content
        filter: `drop-shadow(0 0 3px ${STROKE_COLOR}) drop-shadow(0 0 8px ${STROKE_COLOR}90)`, // Neon glow effect
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
        style={{ opacity: 0.75 }} // Slightly adjusted opacity for glow
      />
    </svg>
  );
}
