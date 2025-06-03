
'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useTheme } from 'next-themes';

const NUM_FIREFLIES = 100;
const FIREFLY_BASE_COLOR_HSLA = '270, 80%, 70%';
const MAX_SPEED = 0.3;
const MIN_RADIUS = 1;
const MAX_RADIUS = 2.5;
const MIN_OPACITY = 0.2;
const MAX_OPACITY = 0.9;

const CURSOR_ATTRACTION_RADIUS = 250;
const ATTRACTION_STRENGTH = 0.03;

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

const FirefliesEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const firefliesRef = useRef<Firefly[]>([]);
  const mousePositionRef = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 });
  const [isClient, setIsClient] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const initializeFireflies = useCallback((width: number, height: number) => {
    const newFireflies: Firefly[] = [];
    for (let i = 0; i < NUM_FIREFLIES; i++) {
      newFireflies.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS),
        opacity: MIN_OPACITY + Math.random() * (MAX_OPACITY - MIN_OPACITY),
        vx: (Math.random() - 0.5) * MAX_SPEED * 0.5,
        vy: (Math.random() - 0.5) * MAX_SPEED * 0.5,
        opacitySpeed: 0.005 + Math.random() * 0.01,
        opacityDirection: Math.random() > 0.5 ? 1 : -1,
      });
    }
    firefliesRef.current = newFireflies;
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const isActuallyDark = resolvedTheme === 'dark';
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!isActuallyDark) {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      firefliesRef.current = [];
      canvas.style.display = 'none'; // Hide canvas element
      return;
    } else {
      canvas.style.display = 'block'; // Show canvas element
    }

    let isMounted = true;

    const handleMouseMove = (event: MouseEvent) => {
      if (isMounted) {
        mousePositionRef.current = { x: event.clientX, y: event.clientY };
      }
    };
    
    const resizeCanvas = () => {
      if (!isMounted || !canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initializeFireflies(canvas.width, canvas.height);
    };

    resizeCanvas(); // Initialize on mount or if theme becomes dark

    const animate = () => {
      if (!isMounted || !ctx || !canvasRef.current || resolvedTheme !== 'dark') { // Added theme check here
         if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
         return;
      }

      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      const { x: mouseX, y: mouseY } = mousePositionRef.current;

      firefliesRef.current.forEach((firefly) => {
        let current_vx = firefly.vx + (Math.random() - 0.5) * 0.08;
        let current_vy = firefly.vy + (Math.random() - 0.5) * 0.08;

        const dx = mouseX - firefly.x;
        const dy = mouseY - firefly.y;
        const distanceSquared = dx * dx + dy * dy;

        if (distanceSquared < CURSOR_ATTRACTION_RADIUS * CURSOR_ATTRACTION_RADIUS && distanceSquared > 1) {
            const distance = Math.sqrt(distanceSquared);
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            current_vx += forceDirectionX * ATTRACTION_STRENGTH;
            current_vy += forceDirectionY * ATTRACTION_STRENGTH;
        }

        const speed = Math.sqrt(current_vx * current_vx + current_vy * current_vy);
        if (speed > MAX_SPEED) {
          firefly.vx = (current_vx / speed) * MAX_SPEED;
          firefly.vy = (current_vy / speed) * MAX_SPEED;
        } else if (speed < MAX_SPEED * 0.15 && speed > 0.001) {
            const minSpeedFactor = (MAX_SPEED * 0.15) / speed;
            firefly.vx = current_vx * minSpeedFactor;
            firefly.vy = current_vy * minSpeedFactor;
        } else if (speed <= 0.001) {
            firefly.vx = (Math.random() - 0.5) * 0.05 * MAX_SPEED;
            firefly.vy = (Math.random() - 0.5) * 0.05 * MAX_SPEED;
        } else {
            firefly.vx = current_vx;
            firefly.vy = current_vy;
        }
        
        firefly.x += firefly.vx;
        firefly.y += firefly.vy;
        
        firefly.opacity += firefly.opacitySpeed * firefly.opacityDirection;
        if (firefly.opacity > MAX_OPACITY || firefly.opacity < MIN_OPACITY) {
          firefly.opacityDirection *= -1;
          firefly.opacity = Math.max(MIN_OPACITY, Math.min(MAX_OPACITY, firefly.opacity));
        }

        if (canvasRef.current) { // Check if canvasRef.current is not null
          if (firefly.x < -firefly.radius) firefly.x = canvasRef.current.width + firefly.radius;
          if (firefly.x > canvasRef.current.width + firefly.radius) firefly.x = -firefly.radius;
          if (firefly.y < -firefly.radius) firefly.y = canvasRef.current.height + firefly.radius;
          if (firefly.y > canvasRef.current.height + firefly.radius) firefly.y = -firefly.radius;
        }


        ctx.beginPath();
        const gradient = ctx.createRadialGradient(
          firefly.x,
          firefly.y,
          0,
          firefly.x,
          firefly.y,
          firefly.radius
        );
        gradient.addColorStop(0, `hsla(${FIREFLY_BASE_COLOR_HSLA}, ${firefly.opacity})`); 
        gradient.addColorStop(0.6, `hsla(${FIREFLY_BASE_COLOR_HSLA}, ${firefly.opacity * 0.6})`);
        gradient.addColorStop(1, `hsla(${FIREFLY_BASE_COLOR_HSLA}, 0)`); 

        ctx.fillStyle = gradient;
        ctx.arc(firefly.x, firefly.y, firefly.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameIdRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', resizeCanvas);
    
    if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    if(isActuallyDark) animate();


    return () => {
      isMounted = false;
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [isClient, resolvedTheme, initializeFireflies]);

  if (!isClient) return null;

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
        zIndex: 0, 
        display: isClient && resolvedTheme === 'dark' ? 'block' : 'none',
        transition: 'opacity 0.3s ease-in-out', // For smooth appearance/disappearance if display is not enough
        opacity: isClient && resolvedTheme === 'dark' ? 1 : 0,
      }}
      aria-hidden="true"
    />
  );
};

export default FirefliesEffect;
