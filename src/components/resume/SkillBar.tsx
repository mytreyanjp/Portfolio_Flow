
'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface SkillBarProps {
  name: string;
  level: number;
}

export default function SkillBar({ name, level }: SkillBarProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="mb-3 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-foreground">{name}</span>
        <span className="text-sm font-medium text-primary">{level}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
        <div
          className={cn(
            "bg-primary h-2.5 rounded-full transition-all duration-500 ease-out"
          )}
          style={{ width: isHovered ? `${level}%` : '0%' }}
        ></div>
      </div>
    </div>
  );
}
