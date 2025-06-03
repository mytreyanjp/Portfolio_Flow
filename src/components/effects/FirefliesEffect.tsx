
'use client';

import React, { useRef, useEffect, useCallback } from 'react';

const NUM_FIREFLIES = 50;
const FIREFLY_BASE_COLOR_HSLA = '270, 80%, 70%'; // HSL part of hsla(H, S, L, A)
const MAX_SPEED = 0.3;
const MIN_RADIUS = 1;
const MAX_RADIUS = 2.5;
const MIN_OPACITY = 0.2;
const MAX_OPACITY = 0.9;

// Cursor interaction parameters
const CURSOR_ATTRACTION_RADIUS = 250; // How close fireflies need to be to be affected by the cursor
const ATTRACTION_STRENGTH = 0.03;   // How strongly they are pulled towards the cursor

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
  const mousePositionRef = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 }); // Initialize off-screen

  const initializeFireflies = useCallback((width: number, height: number) => {
    const newFireflies: Firefly[] = [];
    for (let i = 0; i < NUM_FIREFLIES; i++) {
      newFireflies.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS),
        opacity: MIN_OPACITY + Math.random() * (MAX_OPACITY - MIN_OPACITY),
        vx: (Math.random() - 0.5) * MAX_SPEED * 0.5, // Start with a bit less speed
        vy: (Math.random() - 0.5) * MAX_SPEED * 0.5,
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
      // Mouse move listener is managed within the main effect logic
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isMounted = true;

    const handleMouseMove = (event: MouseEvent) => {
      if (isMounted) {
        mousePositionRef.current = { x: event.clientX, y: event.clientY };
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

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
      const { x: mouseX, y: mouseY } = mousePositionRef.current;

      firefliesRef.current.forEach((firefly) => {
        // 1. Base random walk for velocity
        let current_vx = firefly.vx + (Math.random() - 0.5) * 0.08; // Slightly reduced random influence
        let current_vy = firefly.vy + (Math.random() - 0.5) * 0.08;

        // 2. Cursor attraction logic
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

        // 3. Clamp speed
        const speed = Math.sqrt(current_vx * current_vx + current_vy * current_vy);
        if (speed > MAX_SPEED) {
          firefly.vx = (current_vx / speed) * MAX_SPEED;
          firefly.vy = (current_vy / speed) * MAX_SPEED;
        } else if (speed < MAX_SPEED * 0.15 && speed > 0.001) { // If too slow, give a nudge
            const minSpeedFactor = (MAX_SPEED * 0.15) / speed;
            firefly.vx = current_vx * minSpeedFactor;
            firefly.vy = current_vy * minSpeedFactor;
        } else if (speed <= 0.001) { // If practically stationary, give a fresh random nudge
            firefly.vx = (Math.random() - 0.5) * 0.05 * MAX_SPEED;
            firefly.vy = (Math.random() - 0.5) * 0.05 * MAX_SPEED;
        } else {
            firefly.vx = current_vx;
            firefly.vy = current_vy;
        }
        
        // 4. Update position
        firefly.x += firefly.vx;
        firefly.y += firefly.vy;
        
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
        gradient.addColorStop(0, `hsla(${FIREFLY_BASE_COLOR_HSLA}, ${firefly.opacity})`); 
        gradient.addColorStop(0.6, `hsla(${FIREFLY_BASE_COLOR_HSLA}, ${firefly.opacity * 0.6})`);
        gradient.addColorStop(1, `hsla(${FIREFLY_BASE_COLOR_HSLA}, 0)`); 

        ctx.fillStyle = gradient;
        ctx.arc(firefly.x, firefly.y, firefly.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameIdRef.current = requestAnimationFrame(animate);
    };

    if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    animate();

    window.addEventListener('resize', resizeCanvas);

    return () => {
      isMounted = false;
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
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
