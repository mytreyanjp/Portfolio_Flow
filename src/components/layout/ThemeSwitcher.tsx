
'use client';

import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ThemeSwitcherProps {
  onThemeToggle: () => void;
  isThemeChanging: boolean;
}

export default function ThemeSwitcher({ onThemeToggle, isThemeChanging }: ThemeSwitcherProps) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme(); // Still useful to determine the icon

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder or null to avoid hydration mismatch
    return <div className="h-10 w-10" />; // Matches button size
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onThemeToggle}
      disabled={isThemeChanging}
      aria-label="Toggle theme"
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem]" />
      )}
    </Button>
  );
}
