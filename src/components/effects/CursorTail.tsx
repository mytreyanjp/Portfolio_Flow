
'use client';

import React, { useState, useEffect, useRef } from 'react';

const MAX_POINTS = 20; // Number of points in the tail
const STROKE_COLOR = '#C95EE4'; // A purple color similar to dark theme's accent
const STROKE_WIDTH = 3;
const UPDATE_INTERVAL = 16; // Roughly 60fps

interface Point {
  x: number;
  y: number;
}

export default function CursorTail() {
  const [points, setPoints] = useState<Point[]>([]);
  const animationFrameId = useRef<number | null>(null);
  const lastUpdateTime = useRef<number>(0);
  const mousePosition = useRef<Point>({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mousePosition.current = { x: event.clientX, y: event.clientY };
    };

    const updateTrail = (timestamp: number) => {
      if (timestamp - lastUpdateTime.current > UPDATE_INTERVAL) {
        setPoints((prevPoints) => {
          const newPoints = [...prevPoints, mousePosition.current];
          if (newPoints.length > MAX_POINTS) {
            return newPoints.slice(newPoints.length - MAX_POINTS);
          }
          return newPoints;
        });
        lastUpdateTime.current = timestamp;
      }
      animationFrameId.current = requestAnimationFrame(updateTrail);
    };

    window.addEventListener('mousemove', handleMouseMove);
    animationFrameId.current = requestAnimationFrame(updateTrail);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  if (points.length < 2) {
    return null; // Don't render if not enough points for a line
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
        zIndex: 5, // Above page background, below most UI elements
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
        style={{ opacity: 0.7 }} // Add some transparency
      />
    </svg>
  );
}
