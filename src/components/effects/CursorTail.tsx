
'use client';

import React, { useState, useEffect, useRef } from 'react';

const CIRCLE_RADIUS = 150; // Doubled from 75
const FILL_COLOR = 'rgba(107, 28, 117, 0.2)'; // A semi-transparent purple
const BLUR_STD_DEVIATION = 10;

interface Position {
  x: number;
  y: number;
}

export default function CursorTail() {
  const [position, setPosition] = useState<Position>({ x: -1000, y: -1000 }); // Start off-screen
  const animationFrameId = useRef<number | null>(null);
  const targetPosition = useRef<Position>({ x: -1000, y: -1000 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      targetPosition.current = { x: event.clientX, y: event.clientY };
      if (!isVisible) {
        setIsVisible(true);
        // Initialize position to current mouse position to avoid jump
        setPosition({ x: event.clientX, y: event.clientY }); 
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    const updatePosition = () => {
      setPosition((prevPosition) => {
        // Smooth transition to the target position
        const newX = prevPosition.x + (targetPosition.current.x - prevPosition.x) * 0.2;
        const newY = prevPosition.y + (targetPosition.current.y - prevPosition.y) * 0.2;
        return { x: newX, y: newY };
      });
      animationFrameId.current = requestAnimationFrame(updatePosition);
    };

    if (isVisible) {
        if (animationFrameId.current === null) {
            animationFrameId.current = requestAnimationFrame(updatePosition);
        }
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, [isVisible]);

  if (!isVisible) {
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
      }}
      aria-hidden="true"
    >
      <defs>
        <filter id="cursorBlurFilter" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={BLUR_STD_DEVIATION} />
        </filter>
      </defs>
      <circle
        cx={position.x}
        cy={position.y}
        r={CIRCLE_RADIUS}
        fill={FILL_COLOR}
        filter="url(#cursorBlurFilter)"
        style={{
          transition: 'transform 0.05s ease-out', // Optional: for smoother visual updates if direct pos updates are jerky
        }}
      />
    </svg>
  );
}
