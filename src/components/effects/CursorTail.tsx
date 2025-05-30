
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
const LERP_FACTOR = 0.07; // Smoother/slower follow

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
  const targetPosition = useRef<Position>({ x: -CIRCLE_RADIUS * 2, y: -CIRCLE_RADIUS * 2 });
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    console.log('[CursorTail] useEffect triggered, isDarkTheme in effect:', isDarkTheme);

    // Set initial spawn position to be off-screen top-right
    // This ensures that before any mouse movement, the target and initial position
    // are set to originate from the top-right.
    if (typeof window !== 'undefined') {
      const spawnX = window.innerWidth + CIRCLE_RADIUS * 2; // Off-screen to the right
      const spawnY = -CIRCLE_RADIUS * 2; // Off-screen to the top
      
      setPosition({ x: spawnX, y: spawnY });
      targetPosition.current = { x: spawnX, y: spawnY };
      console.log(`[CursorTail] Initial spawn position set to: (${spawnX.toFixed(0)}, ${spawnY.toFixed(0)})`);
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (isMountedRef.current) {
        targetPosition.current = { x: event.clientX, y: event.clientY };
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    console.log('[CursorTail] Mousemove listener added.');

    let lastTimestamp = 0;
    const updatePosition = (timestamp: number) => {
      if (!isMountedRef.current) return;

      if (timestamp - lastTimestamp < 16) { // Aim for roughly 60 FPS
        animationFrameId.current = requestAnimationFrame(updatePosition);
        return;
      }
      lastTimestamp = timestamp;

      setPosition((prevPosition) => {
        const newX = prevPosition.x + (targetPosition.current.x - prevPosition.x) * LERP_FACTOR;
        const newY = prevPosition.y + (targetPosition.current.y - prevPosition.y) * LERP_FACTOR;
        return { x: newX, y: newY };
      });
      animationFrameId.current = requestAnimationFrame(updatePosition);
    };

    if (animationFrameId.current === null) {
      animationFrameId.current = requestAnimationFrame(updatePosition);
      console.log('[CursorTail] Animation loop started.');
    }

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
