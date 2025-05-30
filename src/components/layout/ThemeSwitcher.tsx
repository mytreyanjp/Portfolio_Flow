
'use client';

import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Lightbulb } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export default function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder or null to avoid hydration mismatch
    return <div className="h-10 w-10" />; // Matches button size
  }

  const glowStyle =
    resolvedTheme === 'light'
      ? {
          filter:
            'drop-shadow(0 0 5px hsl(var(--primary))) drop-shadow(0 0 10px hsl(var(--primary)))',
        }
      : {};

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle theme"
    >
      <Lightbulb
        className="h-[1.2rem] w-[1.2rem] transition-all duration-300 ease-in-out"
        style={glowStyle}
      />
    </Button>
  );
}
