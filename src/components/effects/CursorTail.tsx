
'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';

// Appearance settings:
const CIRCLE_RADIUS = 150;
const FILL_COLOR_LIGHT_THEME_OPACITY_ZERO = 'rgba(107, 28, 117, 0.0)'; // For light theme, make it transparent
const FILL_COLOR_DARK_THEME_VISIBLE = 'rgba(107, 28, 117, 0.2)';    // For dark theme, make it visible
const BLUR_STD_DEVIATION = 15; 
const Z_INDEX = -1; // Behind main content, above body background

interface Position {
  x: number;
  y: number;
}

interface CursorTailProps {
  currentTheme?: 'light' | 'dark' | string; // Allow string for flexibility from next-themes
}

export default function CursorTail({ currentTheme }: CursorTailProps) {
  console.log('[CursorTail] Component rendered. Received currentTheme prop:', currentTheme);
  
  const [position, setPosition] = useState<Position>({ x: -CIRCLE_RADIUS * 2, y: -CIRCLE_RADIUS * 2 });
  const animationFrameId = useRef<number | null>(null);
  const targetPosition = useRef<Position>({ x: -CIRCLE_RADIUS * 2, y: -CIRCLE_RADIUS * 2 });

  useEffect(() => {
    console.log('[CursorTail] useEffect triggered, currentTheme in effect:', currentTheme);
    
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

  const fillColor = useMemo(() => {
    let color;
    if (currentTheme === 'light') {
      color = FILL_COLOR_LIGHT_THEME_OPACITY_ZERO;
    } else if (currentTheme === 'dark') {
      color = FILL_COLOR_DARK_THEME_VISIBLE;
    } else {
      // This path should ideally not be taken if layout.tsx guard is working
      console.warn(`[CursorTail] Unexpected theme value: "${currentTheme}". Defaulting to dark theme visibility as a fallback.`);
      color = FILL_COLOR_DARK_THEME_VISIBLE; 
    }
    console.log(`[CursorTail] Calculated fillColor: ${color} for currentTheme: "${currentTheme}"`);
    return color;
  }, [currentTheme]);


  const blurFilterId = `cursorBlurFilter-${currentTheme || 'default'}`;

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
        // Removed style={{ transition: 'fill 0.3s ease-out' }} as fill is now directly controlled by theme
      />
    </svg>
  );
}
