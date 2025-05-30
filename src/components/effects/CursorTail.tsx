
'use client';

import React, { useState, useEffect, useRef } from 'react';

// Appearance settings:
const CIRCLE_RADIUS = 150; // Increased size
const FILL_COLOR = 'rgba(107, 28, 117, 0.2)'; // Semi-transparent purple
const BLUR_STD_DEVIATION = 15; // Increased blur
const Z_INDEX = -1; // Positioned behind main content, above body background

interface Position {
  x: number;
  y: number;
}

export default function CursorTail() {
  const [position, setPosition] = useState<Position>({ x: -CIRCLE_RADIUS * 2, y: -CIRCLE_RADIUS * 2 }); // Start off-screen
  const animationFrameId = useRef<number | null>(null);
  const targetPosition = useRef<Position>({ x: -CIRCLE_RADIUS * 2, y: -CIRCLE_RADIUS * 2 });

  useEffect(() => {
    // console.log('[CursorTail] Component mounted. Initializing...');
    // Initialize position to center of screen or an initial mouse position quickly
    targetPosition.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    setPosition(targetPosition.current);

    const handleMouseMove = (event: MouseEvent) => {
      targetPosition.current = { x: event.clientX, y: event.clientY };
      // console.log('[CursorTail] Mouse move:', targetPosition.current);
    };

    window.addEventListener('mousemove', handleMouseMove);
    // console.log('[CursorTail] Mouse move listener added.');

    let lastTimestamp = 0;
    const updatePosition = (timestamp: number) => {
      if (!isMounted) {
        // console.log('[CursorTail] updatePosition: component unmounted, stopping animation loop.');
        return;
      }

      if (timestamp - lastTimestamp < 16) { // Aim for roughly 60 FPS
          animationFrameId.current = requestAnimationFrame(updatePosition);
          return;
      }
      lastTimestamp = timestamp;
      
      setPosition((prevPosition) => {
        // Lerp for smooth following
        const newX = prevPosition.x + (targetPosition.current.x - prevPosition.x) * 0.1; // Slower follow speed
        const newY = prevPosition.y + (targetPosition.current.y - prevPosition.y) * 0.1; // Slower follow speed
        return { x: newX, y: newY };
      });
      animationFrameId.current = requestAnimationFrame(updatePosition);
    };
    
    let isMounted = true; 

    // console.log('[CursorTail] Starting animation loop.');
    animationFrameId.current = requestAnimationFrame(updatePosition);
    
    return () => {
      isMounted = false; 
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      // console.log('[CursorTail] Cleanup: Mouse move listener removed and animation frame cancelled.');
    };
  }, []);

  // console.log('[CursorTail] Rendering SVG at position:', position, 'with zIndex:', Z_INDEX);
  return (
    <svg
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: Z_INDEX, 
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
        filter={BLUR_STD_DEVIATION > 0 ? "url(#cursorBlurFilter)" : undefined}
        style={{
          transition: 'transform 0.05s ease-out', 
        }}
      />
    </svg>
  );
}
