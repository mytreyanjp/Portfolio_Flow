
'use client';

import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Lightbulb, LightbulbOff } from 'lucide-react'; // Changed icons
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

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle theme"
    >
      {resolvedTheme === 'dark' ? (
        <LightbulbOff className="h-[1.2rem] w-[1.2rem] transition-all duration-300 ease-in-out" />
      ) : (
        <Lightbulb className="h-[1.2rem] w-[1.2rem] transition-all duration-300 ease-in-out text-primary" />
      )}
    </Button>
  );
}
