
'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTheme } from 'next-themes';

// Appearance settings:
const CIRCLE_RADIUS = 150;
const FILL_COLOR_DARK_THEME_VISIBLE_OPACITY = 0.3;
const FILL_COLOR_LIGHT_THEME_INVISIBLE_OPACITY = 0.0; 
const BASE_FILL_COLOR_RGB_DARK_THEME = '107, 28, 117'; // Purple for dark theme

const BLUR_STD_DEVIATION = 15;

interface Position {
  x: number;
  y: number;
}

export default function CursorTail() {
  const [position, setPosition] = useState<Position>(() => {
    if (typeof window !== 'undefined') {
      return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    }
    return { x: -CIRCLE_RADIUS * 2, y: -CIRCLE_RADIUS * 2 };
  });

  const isMountedRef = useRef(true);
  const [isClient, setIsClient] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setIsClient(true);
  }, []);

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
    if (!isClient) return 'transparent'; 

    const isActuallyDark = resolvedTheme === 'dark';
    const baseRgb = BASE_FILL_COLOR_RGB_DARK_THEME;
    const opacity = isActuallyDark
      ? FILL_COLOR_DARK_THEME_VISIBLE_OPACITY
      : FILL_COLOR_LIGHT_THEME_INVISIBLE_OPACITY;
    return `rgba(${baseRgb}, ${opacity})`;
  }, [isClient, resolvedTheme]);

  const blurFilterId = `cursorBlurFilter`;
  
  if (!isClient || (resolvedTheme === 'light' && FILL_COLOR_LIGHT_THEME_INVISIBLE_OPACITY === 0 && BLUR_STD_DEVIATION === 0)) {
    return null;
  }
  
  if (isClient && resolvedTheme !== 'dark' && FILL_COLOR_LIGHT_THEME_INVISIBLE_OPACITY === 0) {
    return null;
  }


  return (
    <svg
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 3, // Adjusted z-index to be above fireflies
        opacity: isClient && resolvedTheme === 'dark' ? 1 : 0, 
        transition: 'opacity 0.3s ease-in-out', 
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
