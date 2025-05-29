
'use client';

import React, { useState, useEffect, useRef } from 'react';

const CIRCLE_RADIUS = 150;
const FILL_COLOR = 'rgba(107, 28, 117, 0.2)'; // Reduced alpha from 0.5 to 0.2
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
        // Initialize position directly to avoid jump if mouse enters from edge
        setPosition({ x: event.clientX, y: event.clientY });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    const updatePosition = () => {
      setPosition((prevPosition) => {
        // Lerp for smooth following
        const newX = prevPosition.x + (targetPosition.current.x - prevPosition.x) * 0.2; // Adjust 0.2 for follow speed
        const newY = prevPosition.y + (targetPosition.current.y - prevPosition.y) * 0.2;
        return { x: newX, y: newY };
      });
      animationFrameId.current = requestAnimationFrame(updatePosition);
    };

    // Start animation loop only if visible and not already running
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
  }, [isVisible]); // Re-run effect if isVisible changes

  if (!isVisible) {
    return null; // Don't render anything until the first mouse move
  }

  return (
    <svg
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none', // Important: allows clicks to pass through
        zIndex: -5, 
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
          transition: 'transform 0.05s ease-out',
        }}
      />
    </svg>
  );
}
