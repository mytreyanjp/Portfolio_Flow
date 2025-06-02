
'use client';

import React, { useRef, useEffect, useCallback } from 'react';

const NUM_FIREFLIES = 50;
const FIREFLY_BASE_COLOR_HSLA = '270, 80%, 70%'; // HSL part of hsla(H, S, L, A)
const MAX_SPEED = 0.3;
const MIN_RADIUS = 1;
const MAX_RADIUS = 2.5;
const MIN_OPACITY = 0.1;
const MAX_OPACITY = 0.7;

interface Firefly {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  vx: number;
  vy: number;
  opacitySpeed: number;
  opacityDirection: number;
}

interface FirefliesEffectProps {
  isDarkTheme: boolean;
}

const FirefliesEffect: React.FC<FirefliesEffectProps> = ({ isDarkTheme }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const firefliesRef = useRef<Firefly[]>([]);

  const initializeFireflies = useCallback((width: number, height: number) => {
    const newFireflies: Firefly[] = [];
    for (let i = 0; i < NUM_FIREFLIES; i++) {
      newFireflies.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS),
        opacity: MIN_OPACITY + Math.random() * (MAX_OPACITY - MIN_OPACITY),
        vx: (Math.random() - 0.5) * MAX_SPEED * 2,
        vy: (Math.random() - 0.5) * MAX_SPEED * 2,
        opacitySpeed: 0.005 + Math.random() * 0.01,
        opacityDirection: Math.random() > 0.5 ? 1 : -1,
      });
    }
    firefliesRef.current = newFireflies;
  }, []);

  useEffect(() => {
    if (!isDarkTheme) {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isMounted = true;

    const resizeCanvas = () => {
      if (!isMounted || !canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initializeFireflies(canvas.width, canvas.height);
    };

    resizeCanvas(); // Initial setup

    const animate = () => {
      if (!isMounted || !ctx || !canvasRef.current) return;

      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      firefliesRef.current.forEach((firefly) => {
        // Update position
        firefly.x += firefly.vx;
        firefly.y += firefly.vy;

        // Random walk for velocity
        firefly.vx += (Math.random() - 0.5) * 0.1;
        firefly.vy += (Math.random() - 0.5) * 0.1;

        // Clamp speed
        const speed = Math.sqrt(firefly.vx * firefly.vx + firefly.vy * firefly.vy);
        if (speed > MAX_SPEED) {
          firefly.vx = (firefly.vx / speed) * MAX_SPEED;
          firefly.vy = (firefly.vy / speed) * MAX_SPEED;
        }
        
        // Update opacity (flicker)
        firefly.opacity += firefly.opacitySpeed * firefly.opacityDirection;
        if (firefly.opacity > MAX_OPACITY || firefly.opacity < MIN_OPACITY) {
          firefly.opacityDirection *= -1;
          firefly.opacity = Math.max(MIN_OPACITY, Math.min(MAX_OPACITY, firefly.opacity));
        }


        // Boundary conditions (wrap around)
        if (firefly.x < -firefly.radius) firefly.x = canvasRef.current.width + firefly.radius;
        if (firefly.x > canvasRef.current.width + firefly.radius) firefly.x = -firefly.radius;
        if (firefly.y < -firefly.radius) firefly.y = canvasRef.current.height + firefly.radius;
        if (firefly.y > canvasRef.current.height + firefly.radius) firefly.y = -firefly.radius;

        // Draw firefly
        ctx.beginPath();
        const gradient = ctx.createRadialGradient(
          firefly.x,
          firefly.y,
          0,
          firefly.x,
          firefly.y,
          firefly.radius
        );
        gradient.addColorStop(0, `hsla(${FIREFLY_BASE_COLOR_HSLA}, ${firefly.opacity * 0.8})`); // Center brighter
        gradient.addColorStop(0.7, `hsla(${FIREFLY_BASE_COLOR_HSLA}, ${firefly.opacity * 0.5})`);
        gradient.addColorStop(1, `hsla(${FIREFLY_BASE_COLOR_HSLA}, 0)`); // Fade to transparent

        ctx.fillStyle = gradient;
        ctx.arc(firefly.x, firefly.y, firefly.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameIdRef.current = requestAnimationFrame(animate);
    };

    if (isDarkTheme) {
       if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current); // Clear any existing animation frame
       animate();
    }


    window.addEventListener('resize', resizeCanvas);

    return () => {
      isMounted = false;
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [isDarkTheme, initializeFireflies]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: -1, // Behind content, above solid background
        display: isDarkTheme ? 'block' : 'none',
      }}
      aria-hidden="true"
    />
  );
};

export default FirefliesEffect;
