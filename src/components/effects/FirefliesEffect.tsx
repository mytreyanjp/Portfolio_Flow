
'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

const NUM_FIREFLIES_FOREGROUND = 75;
const NUM_FIREFLIES_BACKGROUND = 60;
const NUM_FIREFLIES_STARS = 350; // Increased for a denser star field

const FIREFLY_BASE_COLOR_HSLA = '270, 80%, 70%';
const BACKGROUND_FIREFLY_COLOR_HSLA = '280, 70%, 60%';
// Adjusted star color: less saturation, higher lightness for a whiter look
const STAR_COLOR_HSLA = '240, 20%, 95%'; // Lighter, more white-like

const MAX_SPEED = 0.3;
const MIN_RADIUS = 1;
const MAX_RADIUS = 2.5;
const MIN_OPACITY = 0.2;
const MAX_OPACITY = 0.9;

const STAR_MAX_SPEED = 0.015; // Even slower drift for stars
// Adjusted star radius: smaller on average, with some variation
const STAR_MIN_RADIUS = 0.2;
const STAR_MAX_RADIUS = 0.8;
// Adjusted star opacity: less variation for a more constant star appearance
const STAR_MIN_OPACITY = 0.4; // Stars are generally more visible
const STAR_MAX_OPACITY = 0.8;


const BACKGROUND_BLUR_PX = '2px'; // Blur for the mid-ground fireflies

const CURSOR_ATTRACTION_RADIUS = 250;
const ATTRACTION_STRENGTH = 0.03;

type FireflyType = 'foreground' | 'background' | 'star';

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
  colorHsla: string;
  type: FireflyType;
}

const FirefliesEffect: React.FC = () => {
  const foregroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const starCanvasRef = useRef<HTMLCanvasElement>(null); // New canvas for stars
  const animationFrameIdRef = useRef<number | null>(null);
  
  const foregroundFirefliesRef = useRef<Firefly[]>([]);
  const backgroundFirefliesRef = useRef<Firefly[]>([]);
  const starFirefliesRef = useRef<Firefly[]>([]); // New ref for stars
  
  const mousePositionRef = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 });
  const [isClient, setIsClient] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const createParticle = useCallback((width: number, height: number, type: FireflyType): Firefly => {
    let particleRadius, particleOpacity, particleVx, particleVy, particleColor, particleOpacitySpeed;

    switch (type) {
      case 'star':
        particleRadius = STAR_MIN_RADIUS + Math.random() * (STAR_MAX_RADIUS - STAR_MIN_RADIUS);
        particleOpacity = STAR_MIN_OPACITY + Math.random() * (STAR_MAX_OPACITY - STAR_MIN_OPACITY);
        particleVx = (Math.random() - 0.5) * STAR_MAX_SPEED;
        particleVy = (Math.random() - 0.5) * STAR_MAX_SPEED;
        particleColor = STAR_COLOR_HSLA;
        particleOpacitySpeed = 0.001 + Math.random() * 0.002; // Very slow, subtle twinkle
        break;
      case 'background':
        particleRadius = MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS);
        particleOpacity = MIN_OPACITY + Math.random() * (MAX_OPACITY - MIN_OPACITY);
        particleVx = (Math.random() - 0.5) * MAX_SPEED * 0.35;
        particleVy = (Math.random() - 0.5) * MAX_SPEED * 0.35;
        particleColor = BACKGROUND_FIREFLY_COLOR_HSLA;
        particleOpacitySpeed = 0.005 + Math.random() * 0.01;
        break;
      case 'foreground':
      default:
        particleRadius = MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS);
        particleOpacity = MIN_OPACITY + Math.random() * (MAX_OPACITY - MIN_OPACITY);
        particleVx = (Math.random() - 0.5) * MAX_SPEED * 0.5;
        particleVy = (Math.random() - 0.5) * MAX_SPEED * 0.5;
        particleColor = FIREFLY_BASE_COLOR_HSLA;
        particleOpacitySpeed = 0.005 + Math.random() * 0.01;
        break;
    }

    return {
      id: `ff-${type}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      x: Math.random() * width,
      y: Math.random() * height,
      radius: particleRadius,
      opacity: particleOpacity,
      vx: particleVx,
      vy: particleVy,
      opacitySpeed: particleOpacitySpeed,
      opacityDirection: Math.random() > 0.5 ? 1 : -1,
      colorHsla: particleColor,
      type: type,
    };
  }, []);

  const initializeParticles = useCallback((width: number, height: number) => {
    foregroundFirefliesRef.current = Array.from({ length: NUM_FIREFLIES_FOREGROUND }, () => createParticle(width, height, 'foreground'));
    backgroundFirefliesRef.current = Array.from({ length: NUM_FIREFLIES_BACKGROUND }, () => createParticle(width, height, 'background'));
    starFirefliesRef.current = Array.from({ length: NUM_FIREFLIES_STARS }, () => createParticle(width, height, 'star'));
  }, [createParticle]);

  useEffect(() => {
    if (!isClient) return;

    const isActuallyDark = resolvedTheme === 'dark';
    const fgCanvas = foregroundCanvasRef.current;
    const bgCanvas = backgroundCanvasRef.current;
    const starCanvas = starCanvasRef.current; // Get star canvas

    if (!fgCanvas || !bgCanvas || !starCanvas) return;

    const fgCtx = fgCanvas.getContext('2d');
    const bgCtx = bgCanvas.getContext('2d');
    const starCtx = starCanvas.getContext('2d'); // Get star canvas context

    if (!fgCtx || !bgCtx || !starCtx) return;

    const setupCanvasDisplay = (display: boolean) => {
        fgCanvas.style.display = display ? 'block' : 'none';
        bgCanvas.style.display = display ? 'block' : 'none';
        starCanvas.style.display = display ? 'block' : 'none'; // Manage star canvas display
        if(!display) {
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
                animationFrameIdRef.current = null;
            }
            fgCtx.clearRect(0, 0, fgCanvas.width, fgCanvas.height);
            bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
            starCtx.clearRect(0, 0, starCanvas.width, starCanvas.height); // Clear star canvas
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
      if (!isMounted || !fgCanvas || !bgCanvas || !starCanvas) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      fgCanvas.width = width; fgCanvas.height = height;
      bgCanvas.width = width; bgCanvas.height = height;
      starCanvas.width = width; starCanvas.height = height; // Resize star canvas
      initializeParticles(width, height);
    };

    resizeCanvases(); 

    const animate = () => {
      if (!isMounted || !fgCtx || !bgCtx || !starCtx || !foregroundCanvasRef.current || !backgroundCanvasRef.current || !starCanvasRef.current || resolvedTheme !== 'dark') {
         if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
         return;
      }

      fgCtx.clearRect(0, 0, foregroundCanvasRef.current.width, foregroundCanvasRef.current.height);
      bgCtx.clearRect(0, 0, backgroundCanvasRef.current.width, backgroundCanvasRef.current.height);
      starCtx.clearRect(0, 0, starCanvasRef.current.width, starCanvasRef.current.height); // Clear star context
      
      const { x: mouseX, y: mouseY } = mousePositionRef.current;

      // Animate star fireflies (very slow drift, no cursor interaction)
      starFirefliesRef.current.forEach((star) => {
        star.vx += (Math.random() - 0.5) * 0.0005; // Very minimal random drift for stars
        star.vy += (Math.random() - 0.5) * 0.0005;

        const speed = Math.sqrt(star.vx * star.vx + star.vy * star.vy);
        if (speed > STAR_MAX_SPEED) {
          star.vx = (star.vx / speed) * STAR_MAX_SPEED;
          star.vy = (star.vy / speed) * STAR_MAX_SPEED;
        }

        star.x += star.vx;
        star.y += star.vy;
        
        star.opacity += star.opacitySpeed * star.opacityDirection;
        if (star.opacity > STAR_MAX_OPACITY || star.opacity < STAR_MIN_OPACITY) {
          star.opacityDirection *= -1;
          star.opacity = Math.max(STAR_MIN_OPACITY, Math.min(STAR_MAX_OPACITY, star.opacity));
        }

        if (starCanvasRef.current) { 
          if (star.x < -star.radius) star.x = starCanvasRef.current.width + star.radius;
          if (star.x > starCanvasRef.current.width + star.radius) star.x = -star.radius;
          if (star.y < -star.radius) star.y = starCanvasRef.current.height + star.radius;
          if (star.y > starCanvasRef.current.height + star.radius) star.y = -star.radius;
        }
        
        // Draw stars as simple filled circles for a more point-like appearance
        starCtx.beginPath();
        starCtx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        starCtx.fillStyle = `hsla(${star.colorHsla}, ${star.opacity})`;
        starCtx.fill();
      });


      // Animate background fireflies (no cursor interaction, blurred)
      backgroundFirefliesRef.current.forEach((firefly) => {
        firefly.vx += (Math.random() - 0.5) * 0.06;
        firefly.vy += (Math.random() - 0.5) * 0.06;

        const speed = Math.sqrt(firefly.vx * firefly.vx + firefly.vy * firefly.vy);
        if (speed > MAX_SPEED * 0.6) { 
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
  }, [isClient, resolvedTheme, initializeParticles, createParticle]);

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
        ref={starCanvasRef} // Add star canvas
        style={{
          ...commonCanvasStyle,
          zIndex: 0, // Deepest background layer
        }}
        aria-hidden="true"
      />
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
