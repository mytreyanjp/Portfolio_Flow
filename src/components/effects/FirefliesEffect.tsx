
'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

const NUM_FIREFLIES_FOREGROUND = 75; // Adjusted for potentially two layers
const NUM_FIREFLIES_BACKGROUND = 60;
const FIREFLY_BASE_COLOR_HSLA = '270, 80%, 70%'; // Main color for fireflies
const BACKGROUND_FIREFLY_COLOR_HSLA = '280, 70%, 60%'; // Slightly different color for background
const MAX_SPEED = 0.3;
const MIN_RADIUS = 1;
const MAX_RADIUS = 2.5;
const MIN_OPACITY = 0.2;
const MAX_OPACITY = 0.9;
const BACKGROUND_BLUR_PX = '2px';

const CURSOR_ATTRACTION_RADIUS = 250;
const ATTRACTION_STRENGTH = 0.03;

interface Firefly {
  id: string;
  x: number;
  y: number;
  radius: number;
  opacity: number;
  vx: number;
  vy: number;
  opacitySpeed: number;
  opacityDirection: number;
  colorHsla: string; // Allow different colors per firefly
}

const FirefliesEffect: React.FC = () => {
  const foregroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  
  const foregroundFirefliesRef = useRef<Firefly[]>([]);
  const backgroundFirefliesRef = useRef<Firefly[]>([]);
  
  const mousePositionRef = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 });
  const [isClient, setIsClient] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const createFirefly = useCallback((width: number, height: number, isBackground: boolean): Firefly => {
    return {
      id: `ff-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      x: Math.random() * width,
      y: Math.random() * height,
      radius: MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS),
      opacity: MIN_OPACITY + Math.random() * (MAX_OPACITY - MIN_OPACITY),
      vx: (Math.random() - 0.5) * MAX_SPEED * (isBackground ? 0.35 : 0.5), // Background ones slightly slower drift
      vy: (Math.random() - 0.5) * MAX_SPEED * (isBackground ? 0.35 : 0.5),
      opacitySpeed: 0.005 + Math.random() * 0.01,
      opacityDirection: Math.random() > 0.5 ? 1 : -1,
      colorHsla: isBackground ? BACKGROUND_FIREFLY_COLOR_HSLA : FIREFLY_BASE_COLOR_HSLA,
    };
  }, []);

  const initializeFireflies = useCallback((width: number, height: number) => {
    const newForegroundFireflies: Firefly[] = [];
    for (let i = 0; i < NUM_FIREFLIES_FOREGROUND; i++) {
      newForegroundFireflies.push(createFirefly(width, height, false));
    }
    foregroundFirefliesRef.current = newForegroundFireflies;

    const newBackgroundFireflies: Firefly[] = [];
    for (let i = 0; i < NUM_FIREFLIES_BACKGROUND; i++) {
      newBackgroundFireflies.push(createFirefly(width, height, true));
    }
    backgroundFirefliesRef.current = newBackgroundFireflies;
  }, [createFirefly]);

  useEffect(() => {
    if (!isClient) return;

    const isActuallyDark = resolvedTheme === 'dark';
    const fgCanvas = foregroundCanvasRef.current;
    const bgCanvas = backgroundCanvasRef.current;

    if (!fgCanvas || !bgCanvas) return;

    const fgCtx = fgCanvas.getContext('2d');
    const bgCtx = bgCanvas.getContext('2d');

    if (!fgCtx || !bgCtx) return;

    const setupCanvasDisplay = (display: boolean) => {
        fgCanvas.style.display = display ? 'block' : 'none';
        bgCanvas.style.display = display ? 'block' : 'none';
        if(!display) {
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
                animationFrameIdRef.current = null;
            }
            fgCtx.clearRect(0, 0, fgCanvas.width, fgCanvas.height);
            bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
            // No need to clear refs here, they'll be re-init on next dark theme
        }
    };
    
    setupCanvasDisplay(isActuallyDark);
    if (!isActuallyDark) return;

    let isMounted = true;

    const handleMouseMove = (event: MouseEvent) => {
      if (isMounted) {
        mousePositionRef.current = { x: event.clientX, y: event.clientY };
      }
    };
    
    const resizeCanvases = () => {
      if (!isMounted || !fgCanvas || !bgCanvas) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      fgCanvas.width = width;
      fgCanvas.height = height;
      bgCanvas.width = width;
      bgCanvas.height = height;
      initializeFireflies(width, height);
    };

    resizeCanvases(); 

    const animate = () => {
      if (!isMounted || !fgCtx || !bgCtx || !foregroundCanvasRef.current || !backgroundCanvasRef.current || resolvedTheme !== 'dark') {
         if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
         return;
      }

      fgCtx.clearRect(0, 0, foregroundCanvasRef.current.width, foregroundCanvasRef.current.height);
      bgCtx.clearRect(0, 0, backgroundCanvasRef.current.width, backgroundCanvasRef.current.height);
      
      const { x: mouseX, y: mouseY } = mousePositionRef.current;

      // Animate background fireflies (no cursor interaction)
      backgroundFirefliesRef.current.forEach((firefly) => {
        firefly.vx += (Math.random() - 0.5) * 0.06; // Slightly more random drift
        firefly.vy += (Math.random() - 0.5) * 0.06;

        const speed = Math.sqrt(firefly.vx * firefly.vx + firefly.vy * firefly.vy);
        if (speed > MAX_SPEED * 0.6) { // Background ones are generally slower
          firefly.vx = (firefly.vx / speed) * MAX_SPEED * 0.6;
          firefly.vy = (firefly.vy / speed) * MAX_SPEED * 0.6;
        }

        firefly.x += firefly.vx;
        firefly.y += firefly.vy;
        
        firefly.opacity += firefly.opacitySpeed * firefly.opacityDirection;
        if (firefly.opacity > MAX_OPACITY || firefly.opacity < MIN_OPACITY) {
          firefly.opacityDirection *= -1;
          firefly.opacity = Math.max(MIN_OPACITY, Math.min(MAX_OPACITY, firefly.opacity));
        }

        if (backgroundCanvasRef.current) { 
          if (firefly.x < -firefly.radius) firefly.x = backgroundCanvasRef.current.width + firefly.radius;
          if (firefly.x > backgroundCanvasRef.current.width + firefly.radius) firefly.x = -firefly.radius;
          if (firefly.y < -firefly.radius) firefly.y = backgroundCanvasRef.current.height + firefly.radius;
          if (firefly.y > backgroundCanvasRef.current.height + firefly.radius) firefly.y = -firefly.radius;
        }

        bgCtx.beginPath();
        const gradient = bgCtx.createRadialGradient(firefly.x, firefly.y, 0, firefly.x, firefly.y, firefly.radius);
        gradient.addColorStop(0, `hsla(${firefly.colorHsla}, ${firefly.opacity})`);
        gradient.addColorStop(0.6, `hsla(${firefly.colorHsla}, ${firefly.opacity * 0.6})`);
        gradient.addColorStop(1, `hsla(${firefly.colorHsla}, 0)`);
        bgCtx.fillStyle = gradient;
        bgCtx.arc(firefly.x, firefly.y, firefly.radius, 0, Math.PI * 2);
        bgCtx.fill();
      });

      // Animate foreground fireflies (with cursor interaction)
      foregroundFirefliesRef.current.forEach((firefly) => {
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

        if (foregroundCanvasRef.current) { 
          if (firefly.x < -firefly.radius) firefly.x = foregroundCanvasRef.current.width + firefly.radius;
          if (firefly.x > foregroundCanvasRef.current.width + firefly.radius) firefly.x = -firefly.radius;
          if (firefly.y < -firefly.radius) firefly.y = foregroundCanvasRef.current.height + firefly.radius;
          if (firefly.y > foregroundCanvasRef.current.height + firefly.radius) firefly.y = -firefly.radius;
        }

        fgCtx.beginPath();
        const gradient = fgCtx.createRadialGradient(firefly.x, firefly.y, 0, firefly.x, firefly.y, firefly.radius);
        gradient.addColorStop(0, `hsla(${firefly.colorHsla}, ${firefly.opacity})`);
        gradient.addColorStop(0.6, `hsla(${firefly.colorHsla}, ${firefly.opacity * 0.6})`);
        gradient.addColorStop(1, `hsla(${firefly.colorHsla}, 0)`);
        fgCtx.fillStyle = gradient;
        fgCtx.arc(firefly.x, firefly.y, firefly.radius, 0, Math.PI * 2);
        fgCtx.fill();
      });

      animationFrameIdRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', resizeCanvases);
    
    if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    if(isActuallyDark) animate();

    return () => {
      isMounted = false;
      window.removeEventListener('resize', resizeCanvases);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [isClient, resolvedTheme, initializeFireflies, createFirefly]);

  if (!isClient) return null;

  const commonCanvasStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    pointerEvents: 'none',
    transition: 'opacity 0.3s ease-in-out',
    opacity: isClient && resolvedTheme === 'dark' ? 1 : 0,
    display: isClient && resolvedTheme === 'dark' ? 'block' : 'none',
  };

  return (
    <>
      <canvas
        ref={backgroundCanvasRef}
        style={{
          ...commonCanvasStyle,
          zIndex: 1, // Behind foreground fireflies
          filter: `blur(${BACKGROUND_BLUR_PX})`,
        }}
        aria-hidden="true"
      />
      <canvas
        ref={foregroundCanvasRef}
        style={{
          ...commonCanvasStyle,
          zIndex: 2, // In front of background fireflies, behind cursor tail
        }}
        aria-hidden="true"
      />
    </>
  );
};

export default FirefliesEffect;
