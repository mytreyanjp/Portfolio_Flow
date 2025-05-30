
'use client';

import React, { useState, useEffect, useRef } from 'react';

// Appearance settings:
const CIRCLE_RADIUS = 150;
const FILL_COLOR_LIGHT_THEME_OPACITY_ZERO = 'rgba(107, 28, 117, 0.0)'; 
const FILL_COLOR_DARK_THEME_VISIBLE = 'rgba(107, 28, 117, 0.2)';
const BLUR_STD_DEVIATION = 15; 
const Z_INDEX = -1; // Behind main content, above body background

interface Position {
  x: number;
  y: number;
}

interface CursorTailProps {
  currentTheme?: string; // 'light' or 'dark'
}

export default function CursorTail({ currentTheme }: CursorTailProps) {
  console.log('[CursorTail] Component rendered. Received currentTheme prop:', currentTheme);
  const [position, setPosition] = useState<Position>({ x: -CIRCLE_RADIUS * 2, y: -CIRCLE_RADIUS * 2 });
  const animationFrameId = useRef<number | null>(null);
  const targetPosition = useRef<Position>({ x: -CIRCLE_RADIUS * 2, y: -CIRCLE_RADIUS * 2 });

  useEffect(() => {
    console.log('[CursorTail] useEffect triggered, currentTheme in effect:', currentTheme);
    
    // Initialize position to center for immediate visibility if needed, or off-screen
    // targetPosition.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 }; 
    // setPosition(targetPosition.current);

    const handleMouseMove = (event: MouseEvent) => {
      targetPosition.current = { x: event.clientX, y: event.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    let lastTimestamp = 0;
    let isMounted = true; 
    
    const updatePosition = (timestamp: number) => {
      if (!isMounted) return;

      if (timestamp - lastTimestamp < 16) { // Aim for roughly 60 FPS
        animationFrameId.current = requestAnimationFrame(updatePosition);
        return;
      }
      lastTimestamp = timestamp;
      
      setPosition((prevPosition) => {
        const newX = prevPosition.x + (targetPosition.current.x - prevPosition.x) * 0.07; // Smoother/slower follow
        const newY = prevPosition.y + (targetPosition.current.y - prevPosition.y) * 0.07; // Smoother/slower follow
        return { x: newX, y: newY };
      });
      animationFrameId.current = requestAnimationFrame(updatePosition);
    };
    
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
  }, [currentTheme]); // Re-run effect if currentTheme changes (due to key prop in layout.tsx)

  const fillColor = currentTheme === 'light' 
    ? FILL_COLOR_LIGHT_THEME_OPACITY_ZERO 
    : FILL_COLOR_DARK_THEME_VISIBLE;

  const blurFilterId = `cursorBlurFilter-${currentTheme || 'default'}`; // Unique filter ID per theme to ensure re-evaluation

  console.log('[CursorTail] Rendering SVG with fillColor:', fillColor, 'blur:', BLUR_STD_DEVIATION, 'zIndex:', Z_INDEX, 'for theme:', currentTheme);

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
        <filter id={blurFilterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={BLUR_STD_DEVIATION} />
        </filter>
      </defs>
      <circle
        cx={position.x}
        cy={position.y}
        r={CIRCLE_RADIUS}
        fill={fillColor}
        filter={BLUR_STD_DEVIATION > 0 ? `url(#${blurFilterId})` : undefined}
        style={{ transition: 'fill 0.3s ease-out' }} // Smooth transition for fill color (opacity)
      />
    </svg>
  );
}
