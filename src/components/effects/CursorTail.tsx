
'use client';

import React, { useState, useEffect, useRef } from 'react';

const MAX_POINTS = 15; // Reduced for a slightly stubbier, potentially "blotchier" feel
const STROKE_COLOR = '#E070FF'; // Brighter purple for neon effect
const STROKE_WIDTH = 8; // Increased for thickness

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
    const handleMouseMove = (event: MouseEvent) => {
      mousePosition.current = { x: event.clientX, y: event.clientY };
      if (!isVisible) setIsVisible(true);
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
    animationFrameId.current = requestAnimationFrame(updateTrail);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
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
        zIndex: -1,
        filter: `drop-shadow(0 0 10px ${STROKE_COLOR}B0) drop-shadow(0 0 20px ${STROKE_COLOR}80)`, // Increased blur and spread
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
        style={{ opacity: 0.65 }} // Reduced opacity for a softer, more diffused core line
      />
    </svg>
  );
}
