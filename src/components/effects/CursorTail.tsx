
'use client';

import React, { useState, useEffect, useRef } from 'react';

// Appearance settings:
const CIRCLE_RADIUS = 150;
// DEBUG: Forcing highly visible color and no blur
const FILL_COLOR_DEBUG = 'rgba(255, 0, 0, 1)'; // Opaque Red
const BLUR_STD_DEVIATION_DEBUG = 0; 
const Z_INDEX_DEBUG = 9999;

// Original theme-dependent colors (will be restored later)
const FILL_COLOR_LIGHT_THEME = 'rgba(107, 28, 117, 0.0)'; 
const FILL_COLOR_DARK_THEME = 'rgba(107, 28, 117, 0.2)';
const BLUR_STD_DEVIATION_ORIGINAL = 15;
const Z_INDEX_ORIGINAL = -1;


interface Position {
  x: number;
  y: number;
}

interface CursorTailProps {
  currentTheme?: string; // 'light' or 'dark' or undefined initially
}

export default function CursorTail({ currentTheme }: CursorTailProps) {
  console.log('[CursorTail] Component rendered. Received currentTheme prop:', currentTheme);
  const [position, setPosition] = useState<Position>({ x: -CIRCLE_RADIUS * 2, y: -CIRCLE_RADIUS * 2 });
  const animationFrameId = useRef<number | null>(null);
  const targetPosition = useRef<Position>({ x: -CIRCLE_RADIUS * 2, y: -CIRCLE_RADIUS * 2 });

  useEffect(() => {
    console.log('[CursorTail] useEffect triggered, currentTheme in effect:', currentTheme);
    targetPosition.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    setPosition(targetPosition.current);

    const handleMouseMove = (event: MouseEvent) => {
      targetPosition.current = { x: event.clientX, y: event.clientY };
      // console.log('[CursorTail] Mouse moved:', targetPosition.current);
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    let lastTimestamp = 0;
    const updatePosition = (timestamp: number) => {
      if (!isMounted) return;

      if (timestamp - lastTimestamp < 16) { // Aim for roughly 60 FPS
        animationFrameId.current = requestAnimationFrame(updatePosition);
        return;
      }
      lastTimestamp = timestamp;
      
      setPosition((prevPosition) => {
        const newX = prevPosition.x + (targetPosition.current.x - prevPosition.x) * 0.1; // Slower follow with 0.1
        const newY = prevPosition.y + (targetPosition.current.y - prevPosition.y) * 0.1; // Slower follow with 0.1
        return { x: newX, y: newY };
      });
      animationFrameId.current = requestAnimationFrame(updatePosition);
    };
    
    let isMounted = true; 
    animationFrameId.current = requestAnimationFrame(updatePosition);
    console.log('[CursorTail] Mousemove listener added and animation loop started.');
    
    return () => {
      console.log('[CursorTail] Cleanup: Removing mousemove listener and cancelling animation frame.');
      isMounted = false; 
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, [currentTheme]); // Re-run effect if currentTheme changes (due to key prop)

  // DEBUG: Override fillColor for visibility
  const fillColor = FILL_COLOR_DEBUG;
  const blurStdDeviation = BLUR_STD_DEVIATION_DEBUG;
  const zIndex = Z_INDEX_DEBUG;

  console.log('[CursorTail] Rendering SVG with fillColor:', fillColor, 'blur:', blurStdDeviation, 'zIndex:', zIndex, 'for theme:', currentTheme);


  return (
    <svg
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: zIndex, 
        // transition: 'fill 0.3s ease-out', // Removed for debug
      }}
      aria-hidden="true"
    >
      <defs>
        <filter id="cursorBlurFilter" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={blurStdDeviation} />
        </filter>
      </defs>
      <circle
        cx={position.x}
        cy={position.y}
        r={CIRCLE_RADIUS}
        fill={fillColor}
        filter={blurStdDeviation > 0 ? "url(#cursorBlurFilter)" : undefined}
        style={{
          // transition: 'transform 0.05s ease-out, fill 0.3s ease-out', // transform part might be ok
        }}
      />
    </svg>
  );
}
