
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface SkillBarProps {
  name: string;
  level: number;
}

export default function SkillBar({ name, level }: SkillBarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [displayedLevel, setDisplayedLevel] = useState(0);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const animateLevel = (targetLevel: number) => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      const step = () => {
        setDisplayedLevel(prev => {
          if (prev < targetLevel) {
            // Animate up: more steps for a smoother, slightly slower feel
            const increment = Math.max(1, Math.ceil((targetLevel - prev) / 15));
            const newLevel = Math.min(prev + increment, targetLevel);
            if (newLevel < targetLevel) {
              animationFrameRef.current = requestAnimationFrame(step);
            }
            return newLevel;
          } else if (prev > targetLevel) {
            // Animate down: can be a bit quicker
            const decrement = Math.max(1, Math.ceil((prev - targetLevel) / 10));
            const newLevel = Math.max(prev - decrement, targetLevel);
            if (newLevel > targetLevel) {
              animationFrameRef.current = requestAnimationFrame(step);
            }
            return newLevel;
          }
          return prev; // Target reached
        });
      };
      animationFrameRef.current = requestAnimationFrame(step);
    };

    if (isHovered) {
      animateLevel(level);
    } else {
      animateLevel(0);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isHovered, level]);

  return (
    <div
      className="mb-3 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-foreground">{name}</span>
        <span className="text-sm font-medium text-primary">{displayedLevel}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
        <div
          className={cn(
            "bg-primary h-2.5 rounded-full transition-all duration-500 ease-out" // bar animation is CSS
          )}
          style={{ width: isHovered ? `${level}%` : '0%' }}
        ></div>
      </div>
    </div>
  );
}
