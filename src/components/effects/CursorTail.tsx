
'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';

// Appearance settings:
const CIRCLE_RADIUS = 150;
const FILL_COLOR_DARK_THEME_VISIBLE_OPACITY = 0.3; // Adjusted back to a visible opacity for dark theme
const FILL_COLOR_LIGHT_THEME_INVISIBLE_OPACITY = 0.0;
const BASE_FILL_COLOR_RGB_DARK_THEME = '107, 28, 117'; // Purple for dark theme
const BASE_FILL_COLOR_RGB_LIGHT_THEME = '107, 28, 117'; // Base color for light theme (opacity will make it invisible)

const BLUR_STD_DEVIATION = 15;
const Z_INDEX = -1; // Place behind main content
const LERP_FACTOR = 0.1; // For smooth following

interface Position {
  x: number;
  y: number;
}

interface CursorTailProps {
  isDarkTheme: boolean;
}

export default function CursorTail({ isDarkTheme }: CursorTailProps) {
  // Initialize position to the center of the screen if dark theme is active on mount, otherwise off-screen
  const [position, setPosition] = useState<Position>(() => {
    if (typeof window !== 'undefined' && isDarkTheme) {
      return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    }
    return { x: -CIRCLE_RADIUS * 2, y: -CIRCLE_RADIUS * 2 }; // Default off-screen
  });

  const targetPosition = useRef<Position>({ x: -CIRCLE_RADIUS * 2, y: -CIRCLE_RADIUS * 2 });
  const animationFrameId = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    console.log('[CursorTail] Component mounted/isDarkTheme changed. isDarkTheme:', isDarkTheme);

    // Set initial spawn position based on theme
    if (typeof window !== 'undefined') {
      if (isDarkTheme) {
        // Spawn from center for dark theme
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        setPosition({ x: centerX, y: centerY });
        // Set targetPosition to current mouse position or center if mouse hasn't moved yet
        // This needs to be obtained carefully as initial mouse might not be known.
        // Let's initialize targetPosition to where the mouse might be or center.
        // The handleMouseMove will update targetPosition accurately.
        targetPosition.current = { x: centerX, y: centerY }; // Start target also at center, will update
        console.log(`[CursorTail] Dark theme: Initial spawn & target position set to center: (${centerX.toFixed(0)}, ${centerY.toFixed(0)})`);
      } else {
        // For light theme (or when transitioning from dark to light), move off-screen
        const offScreenX = -CIRCLE_RADIUS * 3; // Further off-screen
        const offScreenY = -CIRCLE_RADIUS * 3;
        setPosition({ x: offScreenX, y: offScreenY });
        targetPosition.current = { x: offScreenX, y: offScreenY };
        console.log(`[CursorTail] Light theme: Position set off-screen.`);
      }
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (isMountedRef.current) {
        targetPosition.current = { x: event.clientX, y: event.clientY };
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    console.log('[CursorTail] Mousemove listener added.');

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
    animationFrameId.current = requestAnimationFrame(updatePosition);

    return () => {
      console.log('[CursorTail] Cleanup: Removing mousemove listener and cancelling animation frame.');
      isMountedRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, [isDarkTheme]); // Re-run effect if isDarkTheme changes (due to remount via key)

  const fillColor = useMemo(() => {
    const baseRgb = isDarkTheme ? BASE_FILL_COLOR_RGB_DARK_THEME : BASE_FILL_COLOR_RGB_LIGHT_THEME;
    const opacity = isDarkTheme ? FILL_COLOR_DARK_THEME_VISIBLE_OPACITY : FILL_COLOR_LIGHT_THEME_INVISIBLE_OPACITY;
    const color = `rgba(${baseRgb}, ${opacity})`;
    console.log(`[CursorTail] Calculated fillColor: ${color} for isDarkTheme: ${isDarkTheme}`);
    return color;
  }, [isDarkTheme]);

  const blurFilterId = `cursorBlurFilter-${isDarkTheme ? 'dark' : 'light'}`;

  // Conditional rendering based on isDarkTheme can also be done here,
  // but layout.tsx handles the mounting/unmounting
  if (!isDarkTheme && fillColor.endsWith(FILL_COLOR_LIGHT_THEME_INVISIBLE_OPACITY + ')')) {
     // If it's light theme AND the color is meant to be invisible, don't render the SVG at all.
     // This is an extra precaution, as layout.tsx should prevent rendering in light theme.
     // However, if it does render due to some timing, this ensures it's truly gone.
     return null;
  }

  console.log('[CursorTail] Rendering SVG with position:', position, 'isDarkTheme:', isDarkTheme);

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
        // Opacity is controlled by the fillColor's alpha
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
