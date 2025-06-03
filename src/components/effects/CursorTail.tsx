
'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';

// Appearance settings:
const CIRCLE_RADIUS = 150;
const FILL_COLOR_DARK_THEME_VISIBLE_OPACITY = 0.3;
// const FILL_COLOR_LIGHT_THEME_INVISIBLE_OPACITY = 0.0; // Debug: Keep light theme opacity same as dark for testing
const BASE_FILL_COLOR_RGB_DARK_THEME = '107, 28, 117'; // Purple for dark theme
// const BASE_FILL_COLOR_RGB_LIGHT_THEME = '107, 28, 117'; // Base color for light theme (opacity will make it invisible)

const BLUR_STD_DEVIATION = 15;
const DEBUG_Z_INDEX = 1000; // Debug: High z-index

interface Position {
  x: number;
  y: number;
}

interface CursorTailProps {
  isDarkTheme: boolean; // Prop still received, but temporarily ignored for visibility
}

export default function CursorTail({ isDarkTheme }: CursorTailProps) {
  const [position, setPosition] = useState<Position>(() => {
    if (typeof window !== 'undefined') { // Always try to set initial sensible position
      return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    }
    return { x: -CIRCLE_RADIUS * 2, y: -CIRCLE_RADIUS * 2 };
  });

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const handleMouseMove = (event: MouseEvent) => {
      if (isMountedRef.current) {
        setPosition({ x: event.clientX, y: event.clientY });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const fillColor = useMemo(() => {
    const baseRgb = BASE_FILL_COLOR_RGB_DARK_THEME;
    // Debug: Force visibility by always using the dark theme opacity
    const opacity = FILL_COLOR_DARK_THEME_VISIBLE_OPACITY;
    const color = `rgba(${baseRgb}, ${opacity})`;
    return color;
  }, []); // Removed isDarkTheme from dependency array for debugging

  const blurFilterId = `cursorBlurFilter-debug`; // Make ID unique for debugging if needed

  return (
    <svg
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: DEBUG_Z_INDEX, // Debug: Use high z-index
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
        fill={fillColor} // Debug: fillColor is now always visible
        filter={BLUR_STD_DEVIATION > 0 ? `url(#${blurFilterId})` : undefined}
      />
    </svg>
  );
}
