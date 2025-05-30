
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface SkillBarProps {
  name: string;
  level: number;
  onHoverSkill: (level: number | null) => void; // Callback to parent
}

export default function SkillBar({ name, level, onHoverSkill }: SkillBarProps) {
  const [isBarFilled, setIsBarFilled] = useState(false);

  const handleMouseEnter = () => {
    setIsBarFilled(true);
    onHoverSkill(level);
  };

  const handleMouseLeave = () => {
    setIsBarFilled(false);
    onHoverSkill(null);
  };

  return (
    <div
      className="mb-3 group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-foreground">{name}</span>
        {/* Percentage display removed from here */}
      </div>
      <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
        <div
          className={cn(
            "bg-primary h-2.5 rounded-full transition-all duration-500 ease-out"
          )}
          style={{ width: isBarFilled ? `${level}%` : '0%' }}
        ></div>
      </div>
    </div>
  );
}
