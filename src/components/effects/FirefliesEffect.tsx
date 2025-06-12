
'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

const NUM_FIREFLIES_FOREGROUND = 75;
const NUM_FIREFLIES_BACKGROUND = 60;

// Star count constants based on screen size
const NUM_FIREFLIES_STARS_LARGE_SCREEN = 700;
const NUM_FIREFLIES_STARS_SMALL_SCREEN = 350; // Half for smaller screens
const SMALL_SCREEN_BREAKPOINT_PX = 768; // Breakpoint for adjusting star count


const FIREFLY_BASE_COLOR_HSLA = '270, 80%, 70%';
const BACKGROUND_FIREFLY_COLOR_HSLA = '280, 70%, 60%';
const STAR_COLOR_HSLA = '0, 0%, 95%'; // Adjusted for whiter stars

const MAX_SPEED = 0.3;
const MIN_RADIUS = 1;
const MAX_RADIUS = 2.5;
const MIN_OPACITY = 0.2;
const MAX_OPACITY = 0.9;

const STAR_MAX_SPEED = 0.005; // Much slower for static stars
const STAR_MIN_RADIUS = 0.1; // Smaller stars
const STAR_MAX_RADIUS = 0.5; // Smaller stars
const STAR_MIN_OPACITY = 0.3; // Less variation
const STAR_MAX_OPACITY = 0.7; // Less variation


const BACKGROUND_BLUR_PX = '2px';

const CURSOR_ATTRACTION_RADIUS = 250;
const ATTRACTION_STRENGTH = 0.03;

// Shooting Star Constants
const MAX_ACTIVE_SHOOTING_STARS = 3;
const SHOOTING_STAR_SPAWN_CHANCE = 0.003; // Probability per frame
const SHOOTING_STAR_COLOR_HSLA = '0, 0%, 100%'; // Bright white
const SHOOTING_STAR_HEAD_RADIUS_MIN = 0.8;
const SHOOTING_STAR_HEAD_RADIUS_MAX = 1.5;
const SHOOTING_STAR_SPEED_Y_MIN = 1.5;
const SHOOTING_STAR_SPEED_Y_MAX = 3.5;
const SHOOTING_STAR_SPEED_X_FACTOR = 0.4; // Max horizontal speed relative to vertical
const SHOOTING_STAR_TAIL_LENGTH_FACTOR = 15; // Multiplier for tail length based on speed
const SHOOTING_STAR_FADE_RATE = 0.007; // How quickly it fades per frame

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

interface ShootingStar {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number; // Head radius
  colorHsla: string;
  currentOpacity: number; // Current opacity, will fade based on life
  life: number; // 0 to 1, 1 is new, 0 is gone
  tailLength: number;
}


const FirefliesEffect: React.FC = () => {
  const foregroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const starCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  
  const foregroundFirefliesRef = useRef<Firefly[]>([]);
  const backgroundFirefliesRef = useRef<Firefly[]>([]);
  const starFirefliesRef = useRef<Firefly[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  
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
        particleOpacitySpeed = 0.0005 + Math.random() * 0.001; // Slower twinkle for stars
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

  const createShootingStar = useCallback((canvasWidth: number, canvasHeight: number): ShootingStar => {
    const speedY = SHOOTING_STAR_SPEED_Y_MIN + Math.random() * (SHOOTING_STAR_SPEED_Y_MAX - SHOOTING_STAR_SPEED_Y_MIN);
    const speedX = (Math.random() - 0.5) * 2 * speedY * SHOOTING_STAR_SPEED_X_FACTOR;
    const headRadius = SHOOTING_STAR_HEAD_RADIUS_MIN + Math.random() * (SHOOTING_STAR_HEAD_RADIUS_MAX - SHOOTING_STAR_HEAD_RADIUS_MIN);
    
    let startX, startY;
    const sideSpawn = Math.random() < 0.3; // 30% chance to spawn from side

    if (sideSpawn) {
        startY = Math.random() * canvasHeight * 0.5; // Spawn in upper half of height
        if (Math.random() < 0.5) { // From left
            startX = -headRadius * 5; // Start off-screen left
        } else { // From right
            startX = canvasWidth + headRadius * 5; // Start off-screen right
        }
    } else { // Spawn from top
        startX = Math.random() * canvasWidth;
        startY = -headRadius * 5; // Start off-screen top
    }

    return {
      id: `ss-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      x: startX,
      y: startY,
      vx: speedX,
      vy: speedY,
      radius: headRadius,
      colorHsla: SHOOTING_STAR_COLOR_HSLA,
      currentOpacity: 0.8 + Math.random() * 0.2, // Initial high opacity
      life: 1, // Starts full life
      tailLength: SHOOTING_STAR_TAIL_LENGTH_FACTOR,
    };
  }, []);


  const initializeParticles = useCallback((width: number, height: number) => {
    foregroundFirefliesRef.current = Array.from({ length: NUM_FIREFLIES_FOREGROUND }, () => createParticle(width, height, 'foreground'));
    backgroundFirefliesRef.current = Array.from({ length: NUM_FIREFLIES_BACKGROUND }, () => createParticle(width, height, 'background'));
    
    const currentNumStars = width < SMALL_SCREEN_BREAKPOINT_PX 
      ? NUM_FIREFLIES_STARS_SMALL_SCREEN 
      : NUM_FIREFLIES_STARS_LARGE_SCREEN;
    starFirefliesRef.current = Array.from({ length: currentNumStars }, () => createParticle(width, height, 'star'));
    shootingStarsRef.current = []; // Clear existing shooting stars on resize
  }, [createParticle]);

  useEffect(() => {
    if (!isClient) return;

    const isActuallyDark = resolvedTheme === 'dark';
    const fgCanvas = foregroundCanvasRef.current;
    const bgCanvas = backgroundCanvasRef.current;
    const starCanvas = starCanvasRef.current;

    if (!fgCanvas || !bgCanvas || !starCanvas) return;

    const fgCtx = fgCanvas.getContext('2d');
    const bgCtx = bgCanvas.getContext('2d');
    const starCtx = starCanvas.getContext('2d');

    if (!fgCtx || !bgCtx || !starCtx) return;

    const setupCanvasDisplay = (display: boolean) => {
        fgCanvas.style.display = display ? 'block' : 'none';
        bgCanvas.style.display = display ? 'block' : 'none';
        starCanvas.style.display = display ? 'block' : 'none';
        if(!display) {
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
                animationFrameIdRef.current = null;
            }
            fgCtx.clearRect(0, 0, fgCanvas.width, fgCanvas.height);
            bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
            starCtx.clearRect(0, 0, starCanvas.width, starCanvas.height);
            shootingStarsRef.current = []; // Clear shooting stars when hiding
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
      starCanvas.width = width; starCanvas.height = height;
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
      starCtx.clearRect(0, 0, starCanvasRef.current.width, starCanvasRef.current.height);
      
      const { x: mouseX, y: mouseY } = mousePositionRef.current;

      starFirefliesRef.current.forEach((star) => {
        star.vx += (Math.random() - 0.5) * 0.0005;
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
        
        starCtx.beginPath();
        starCtx.arc(star.x, star.y, star.radius, 0, Math.PI * 2); // Draw stars as simple circles
        starCtx.fillStyle = `hsla(${star.colorHsla}, ${star.opacity})`;
        starCtx.fill();
      });

      // Shooting Stars Logic
      if (isClient && resolvedTheme === 'dark' && starCanvasRef.current && shootingStarsRef.current.length < MAX_ACTIVE_SHOOTING_STARS && Math.random() < SHOOTING_STAR_SPAWN_CHANCE) {
        shootingStarsRef.current.push(createShootingStar(starCanvasRef.current.width, starCanvasRef.current.height));
      }

      const remainingShootingStars: ShootingStar[] = [];
      starCtx.lineCap = 'round';
      shootingStarsRef.current.forEach(ss => {
        ss.x += ss.vx;
        ss.y += ss.vy;
        ss.life -= SHOOTING_STAR_FADE_RATE;

        const currentVisibleOpacity = ss.currentOpacity * ss.life;

        if (ss.life > 0 && currentVisibleOpacity > 0.01 &&
            ss.y < starCanvasRef.current!.height + ss.tailLength * 10 && // Give some buffer for tail
            ss.y > -ss.tailLength * 10 &&
            ss.x < starCanvasRef.current!.width + ss.tailLength * 10 &&
            ss.x > -ss.tailLength * 10) {
          
          // Draw tail as a line
          starCtx.beginPath();
          starCtx.moveTo(ss.x, ss.y); // Head
          starCtx.lineTo(ss.x - ss.vx * ss.tailLength, ss.y - ss.vy * ss.tailLength); // Tail end
          starCtx.strokeStyle = `hsla(${ss.colorHsla}, ${currentVisibleOpacity * 0.5})`; // Tail is dimmer
          starCtx.lineWidth = ss.radius * 1.2; // Tail width
          starCtx.stroke();

          // Draw head
          starCtx.beginPath();
          starCtx.arc(ss.x, ss.y, ss.radius, 0, Math.PI * 2);
          starCtx.fillStyle = `hsla(${ss.colorHsla}, ${currentVisibleOpacity})`;
          starCtx.fill();
          
          remainingShootingStars.push(ss);
        }
      });
      shootingStarsRef.current = remainingShootingStars;
      starCtx.lineCap = 'butt'; // Reset lineCap


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
      shootingStarsRef.current = []; // Clear on cleanup
    };
  }, [isClient, resolvedTheme, initializeParticles, createParticle, createShootingStar]);

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
        ref={starCanvasRef}
        style={{
          ...commonCanvasStyle,
          zIndex: 0, 
        }}
        aria-hidden="true"
      />
      <canvas
        ref={backgroundCanvasRef}
        style={{
          ...commonCanvasStyle,
          zIndex: 1, 
          filter: `blur(${BACKGROUND_BLUR_PX})`,
        }}
        aria-hidden="true"
      />
      <canvas
        ref={foregroundCanvasRef}
        style={{
          ...commonCanvasStyle,
          zIndex: 2, 
        }}
        aria-hidden="true"
      />
    </>
  );
};

export default FirefliesEffect;
