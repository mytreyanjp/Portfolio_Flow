
'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';

// Appearance settings:
const CIRCLE_RADIUS = 150;
const FILL_COLOR_DARK_THEME_VISIBLE_OPACITY = 0.3;
const FILL_COLOR_LIGHT_THEME_INVISIBLE_OPACITY = 0.0;
const BASE_FILL_COLOR_RGB_DARK_THEME = '107, 28, 117'; // Purple for dark theme
const BASE_FILL_COLOR_RGB_LIGHT_THEME = '107, 28, 117'; // Base color for light theme (opacity will make it invisible)

const BLUR_STD_DEVIATION = 15;
const Z_INDEX = -1; // Place behind main content

interface Position {
  x: number;
  y: number;
}

interface CursorTailProps {
  isDarkTheme: boolean;
}

export default function CursorTail({ isDarkTheme }: CursorTailProps) {
  console.log('[CursorTail] Component rendered. Received isDarkTheme prop:', isDarkTheme);

  // Initialize off-screen top-left by default
  const [position, setPosition] = useState<Position>({ x: -CIRCLE_RADIUS * 2, y: -CIRCLE_RADIUS * 2 });
  const animationFrameId = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    console.log('[CursorTail] useEffect triggered, isDarkTheme in effect:', isDarkTheme);

    // Set initial spawn position to be off-screen top-right
    if (typeof window !== 'undefined') {
      const spawnX = window.innerWidth + CIRCLE_RADIUS * 2;
      const spawnY = -CIRCLE_RADIUS * 2;
      
      setPosition({ x: spawnX, y: spawnY });
      console.log(`[CursorTail] Initial spawn position set to: (${spawnX.toFixed(0)}, ${spawnY.toFixed(0)})`);
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (isMountedRef.current) {
        // Directly set position
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
        }
        animationFrameId.current = requestAnimationFrame(() => {
          setPosition({ x: event.clientX, y: event.clientY });
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    console.log('[CursorTail] Mousemove listener added.');

    return () => {
      console.log('[CursorTail] Cleanup: Removing mousemove listener and cancelling animation frame.');
      isMountedRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, []); // Empty dependency array to run once on mount for setup

  const fillColor = useMemo(() => {
    const baseRgb = isDarkTheme ? BASE_FILL_COLOR_RGB_DARK_THEME : BASE_FILL_COLOR_RGB_LIGHT_THEME;
    const opacity = isDarkTheme ? FILL_COLOR_DARK_THEME_VISIBLE_OPACITY : FILL_COLOR_LIGHT_THEME_INVISIBLE_OPACITY;
    const color = `rgba(${baseRgb}, ${opacity})`;
    console.log(`[CursorTail] Calculated fillColor: ${color} for isDarkTheme: ${isDarkTheme}`);
    return color;
  }, [isDarkTheme]);

  const blurFilterId = `cursorBlurFilter-${isDarkTheme ? 'dark' : 'light'}`;

  console.log('[CursorTail] Rendering SVG with current position:', position, 'isDarkTheme:', isDarkTheme);

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
        transition: 'opacity 0.3s ease-out', // For theme change visibility
        opacity: (isDarkTheme && fillColor.endsWith(FILL_COLOR_DARK_THEME_VISIBLE_OPACITY + ')')) || // Check if dark theme opacity is active
                 (!isDarkTheme && fillColor.endsWith(FILL_COLOR_LIGHT_THEME_INVISIBLE_OPACITY + ')'))
                 ? (fillColor.endsWith(FILL_COLOR_DARK_THEME_VISIBLE_OPACITY + ')') ? 1 : 0) : 1, // Fallback to visible if logic is complex
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
      />
    </svg>
  );
}
