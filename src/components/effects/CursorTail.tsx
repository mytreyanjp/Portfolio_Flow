
'use client';

import React, { useState, useEffect, useRef } from 'react';

// Diagnostic settings:
const CIRCLE_RADIUS = 150;
const FILL_COLOR = 'rgba(255, 0, 0, 1)'; // Bright red, fully opaque for testing
const BLUR_STD_DEVIATION = 0; // No blur for testing

interface Position {
  x: number;
  y: number;
}

export default function CursorTail() {
  const [position, setPosition] = useState<Position>({ x: -1000, y: -1000 }); // Start off-screen
  const animationFrameId = useRef<number | null>(null);
  const targetPosition = useRef<Position>({ x: -1000, y: -1000 });
  // const [isVisible, setIsVisible] = useState(false); // Removed isVisible to render immediately

  useEffect(() => {
    console.log('[CursorTail] Component mounted. Initializing...');
    // Initialize position to center of screen or an initial mouse position quickly
    targetPosition.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    setPosition(targetPosition.current);

    const handleMouseMove = (event: MouseEvent) => {
      targetPosition.current = { x: event.clientX, y: event.clientY };
      // No longer need to set isVisible here as it's always visible if rendered
    };

    window.addEventListener('mousemove', handleMouseMove);
    console.log('[CursorTail] Mouse move listener added.');

    let lastTimestamp = 0;
    const updatePosition = (timestamp: number) => {
      if (!isMounted) { 
        console.log('[CursorTail] updatePosition: component unmounted, stopping animation loop.');
        return;
      }

      if (timestamp - lastTimestamp < 16) { // Aim for roughly 60 FPS
          animationFrameId.current = requestAnimationFrame(updatePosition);
          return;
      }
      lastTimestamp = timestamp;
      
      setPosition((prevPosition) => {
        // Lerp for smooth following
        const newX = prevPosition.x + (targetPosition.current.x - prevPosition.x) * 0.2; // Adjust 0.2 for follow speed
        const newY = prevPosition.y + (targetPosition.current.y - prevPosition.y) * 0.2;
        return { x: newX, y: newY };
      });
      animationFrameId.current = requestAnimationFrame(updatePosition);
    };
    
    let isMounted = true; 

    console.log('[CursorTail] Starting animation loop.');
    animationFrameId.current = requestAnimationFrame(updatePosition);
    
    return () => {
      isMounted = false; 
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      console.log('[CursorTail] Cleanup: Mouse move listener removed and animation frame cancelled.');
    };
  }, []); // Empty dependency array ensures this runs once on mount

  console.log('[CursorTail] Rendering SVG at position:', position);
  return (
    <svg
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 5, // Temporarily high z-index for testing visibility
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
