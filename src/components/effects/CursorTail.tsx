
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
// LERP_FACTOR removed as there's no more LERP

interface Position {
  x: number;
  y: number;
}

interface CursorTailProps {
  isDarkTheme: boolean;
}

export default function CursorTail({ isDarkTheme }: CursorTailProps) {
  const [position, setPosition] = useState<Position>(() => {
    if (typeof window !== 'undefined' && isDarkTheme) {
      return { x: window.innerWidth, y: 0 };
    }
    return { x: -CIRCLE_RADIUS * 2, y: -CIRCLE_RADIUS * 2 };
  });

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const handleMouseMove = (event: MouseEvent) => {
      if (isMountedRef.current) {
        // Update position directly to mouse coordinates
        setPosition({ x: event.clientX, y: event.clientY });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Set initial position if dark theme is active on mount
    if (isDarkTheme && typeof window !== 'undefined') {
        // To avoid a jump from default off-screen, we could try to get initial mouse pos here.
        // However, mousemove will update it quickly. Initializing to a corner for dark theme.
        // Or set it based on last known mouse position if available and reliable.
        // For simplicity, if we want it to appear immediately, we could set it to center or a corner.
        // Given the original logic, starting at top-right for dark theme.
        // This might be slightly off from actual cursor if mouse hasn't moved yet, but will update.
        // To truly start at mouse, would need a more complex initial sync or rely on first mousemove.
        // For "exactly at pos", first mousemove will set it.
        // If no mousemove yet, it's at its initial spot.
    }


    return () => {
      isMountedRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDarkTheme]); // Effect re-runs if isDarkTheme prop changes

  const fillColor = useMemo(() => {
    const baseRgb = BASE_FILL_COLOR_RGB_DARK_THEME;
    const opacity = isDarkTheme ? FILL_COLOR_DARK_THEME_VISIBLE_OPACITY : FILL_COLOR_LIGHT_THEME_INVISIBLE_OPACITY;
    const color = `rgba(${baseRgb}, ${opacity})`;
    return color;
  }, [isDarkTheme]);

  const blurFilterId = `cursorBlurFilter-${isDarkTheme ? 'dark' : 'light'}`;

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
      />
    </svg>
  );
}
