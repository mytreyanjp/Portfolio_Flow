
'use client';

import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Lightbulb, LightbulbOff } from 'lucide-react'; // Changed imports
import { useEffect, useState } from 'react';

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
        <LightbulbOff className="h-[1.2rem] w-[1.2rem]" /> // Show LightbulbOff for dark theme
      ) : (
        <Lightbulb className="h-[1.2rem] w-[1.2rem]" /> // Show Lightbulb for light theme
      )}
    </Button>
  );
}
