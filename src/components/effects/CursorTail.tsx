
'use client';

import React, { useState, useEffect, useRef } from 'react';

const CIRCLE_RADIUS = 150;
const FILL_COLOR = 'rgba(107, 28, 117, 0.4)'; // Increased opacity
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
    console.log('[CursorTail] Component mounted or isVisible changed:', isVisible);
    const handleMouseMove = (event: MouseEvent) => {
      targetPosition.current = { x: event.clientX, y: event.clientY };
      if (!isVisible) {
        setIsVisible(true);
        // Initialize position directly to avoid jump if mouse enters from edge
        setPosition({ x: event.clientX, y: event.clientY });
        console.log('[CursorTail] First mouse move, setting visible and initial position.');
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    console.log('[CursorTail] Mouse move listener added.');

    let lastTimestamp = 0;
    const updatePosition = (timestamp: number) => {
      if (!isMounted) { // Check if component is still mounted
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
    
    let isMounted = true; // Flag to track mount status for the animation loop

    if (isVisible) {
        if (animationFrameId.current === null) {
            console.log('[CursorTail] isVisible is true, starting animation loop.');
            animationFrameId.current = requestAnimationFrame(updatePosition);
        }
    } else {
        if (animationFrameId.current !== null) {
            console.log('[CursorTail] isVisible is false, cancelling animation loop.');
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = null;
        }
    }

    return () => {
      isMounted = false; // Set flag on unmount
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      console.log('[CursorTail] Cleanup: Mouse move listener removed and animation frame cancelled.');
    };
  }, [isVisible]); // Re-run effect if isVisible changes

  if (!isVisible) {
    // console.log('[CursorTail] Not visible, rendering null.');
    return null; // Don't render anything until the first mouse move
  }

  // console.log('[CursorTail] Rendering SVG at position:', position);
  return (
    <svg
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: -1, // Behind main content, above body background
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
          transition: 'transform 0.05s ease-out', // Keep for slight smoothness if needed, but lerp handles most
        }}
      />
    </svg>
  );
}
