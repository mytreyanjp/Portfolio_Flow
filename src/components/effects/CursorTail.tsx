
'use client';

import React, { useState, useEffect, useRef } from 'react';

// Appearance settings:
const CIRCLE_RADIUS = 150;
const FILL_COLOR_DARK_THEME = 'rgba(107, 28, 117, 0.2)'; // Semi-transparent purple for dark theme
const FILL_COLOR_LIGHT_THEME = 'rgba(107, 28, 117, 0.0)'; // Fully transparent for light theme
const BLUR_STD_DEVIATION = 15;
const Z_INDEX = -1; // Positioned behind main content, above body background

interface Position {
  x: number;
  y: number;
}

interface CursorTailProps {
  currentTheme?: string; // 'light' or 'dark' or undefined initially
}

export default function CursorTail({ currentTheme }: CursorTailProps) {
  console.log('[CursorTail] Received currentTheme prop:', currentTheme);
  const [position, setPosition] = useState<Position>({ x: -CIRCLE_RADIUS * 2, y: -CIRCLE_RADIUS * 2 });
  const animationFrameId = useRef<number | null>(null);
  const targetPosition = useRef<Position>({ x: -CIRCLE_RADIUS * 2, y: -CIRCLE_RADIUS * 2 });

  useEffect(() => {
    console.log('[CursorTail] useEffect triggered, currentTheme in effect:', currentTheme);
    targetPosition.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    setPosition(targetPosition.current);

    const handleMouseMove = (event: MouseEvent) => {
      targetPosition.current = { x: event.clientX, y: event.clientY };
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
        const newX = prevPosition.x + (targetPosition.current.x - prevPosition.x) * 0.1;
        const newY = prevPosition.y + (targetPosition.current.y - prevPosition.y) * 0.1;
        return { x: newX, y: newY };
      });
      animationFrameId.current = requestAnimationFrame(updatePosition);
    };
    
    let isMounted = true; 
    animationFrameId.current = requestAnimationFrame(updatePosition);
    
    return () => {
      console.log('[CursorTail] Cleanup: Removing mousemove listener and cancelling animation frame.');
      isMounted = false; 
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, [currentTheme]); // Re-run effect if currentTheme changes (though key prop should handle remount)

  const fillColor = currentTheme === 'light' ? FILL_COLOR_LIGHT_THEME : FILL_COLOR_DARK_THEME;
  console.log('[CursorTail] Rendering with fillColor:', fillColor, 'for theme:', currentTheme);


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
        fill={fillColor}
        filter={BLUR_STD_DEVIATION > 0 ? "url(#cursorBlurFilter)" : undefined}
        style={{
          transition: 'transform 0.05s ease-out, fill 0.3s ease-out', 
        }}
      />
    </svg>
  );
}
