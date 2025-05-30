
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
const LERP_FACTOR = 0.08; // For smooth following, slightly slower

interface Position {
  x: number;
  y: number;
}

interface CursorTailProps {
  isDarkTheme: boolean;
}

export default function CursorTail({ isDarkTheme }: CursorTailProps) {
  // Initialize position based on theme
  const [position, setPosition] = useState<Position>(() => {
    if (typeof window !== 'undefined' && isDarkTheme) {
      // Start at top-right corner of the viewport for dark theme
      return { x: window.innerWidth, y: 0 };
    }
    return { x: -CIRCLE_RADIUS * 2, y: -CIRCLE_RADIUS * 2 }; // Default off-screen if not dark or SSR
  });

  const targetPosition = useRef<Position>(
    typeof window !== 'undefined' && isDarkTheme
      ? { x: window.innerWidth, y: 0 } // Initial target also top-right for dark theme
      : { x: -CIRCLE_RADIUS * 2, y: -CIRCLE_RADIUS * 2 } // Default off-screen
  );

  const animationFrameId = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    // console.log('[CursorTail] Component rendered/remounted. isDarkTheme prop:', isDarkTheme);
    // If the theme changes and this component remounts, useState and useRef initializers handle the new starting position.

    const handleMouseMove = (event: MouseEvent) => {
      if (isMountedRef.current) {
        targetPosition.current = { x: event.clientX, y: event.clientY };
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    // console.log('[CursorTail] Mousemove listener added.');

    const updatePosition = () => {
      if (isMountedRef.current) {
        setPosition(prevPosition => {
          const newX = prevPosition.x + (targetPosition.current.x - prevPosition.x) * LERP_FACTOR;
          const newY = prevPosition.y + (targetPosition.current.y - prevPosition.y) * LERP_FACTOR;
          return { x: newX, y: newY };
        });
        animationFrameId.current = requestAnimationFrame(updatePosition);
      }
    };
    // Ensure updatePosition is called to start animation if not already running
    if (animationFrameId.current === null) {
        animationFrameId.current = requestAnimationFrame(updatePosition);
    }


    return () => {
      // console.log('[CursorTail] Cleanup: Removing mousemove listener and cancelling animation frame.');
      isMountedRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, [isDarkTheme]); // Effect re-runs if isDarkTheme prop changes, handled by key in parent for remount

  const fillColor = useMemo(() => {
    const baseRgb = BASE_FILL_COLOR_RGB_DARK_THEME; // Using dark theme base color for styling
    const opacity = isDarkTheme ? FILL_COLOR_DARK_THEME_VISIBLE_OPACITY : FILL_COLOR_LIGHT_THEME_INVISIBLE_OPACITY;
    const color = `rgba(${baseRgb}, ${opacity})`;
    // console.log(`[CursorTail] Calculated fillColor: ${color} for isDarkTheme: ${isDarkTheme}`);
    return color;
  }, [isDarkTheme]);

  const blurFilterId = `cursorBlurFilter-${isDarkTheme ? 'dark' : 'light'}`;

  // console.log('[CursorTail] Rendering SVG with position:', position, 'isDarkTheme:', isDarkTheme);

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
        // Opacity controlled by fillColor's alpha
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
