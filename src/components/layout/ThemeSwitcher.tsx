
'use client';

import { useThemeTransition } from '@/components/providers/ThemeProvider';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { triggerThemeChange, resolvedTheme, isTransitioning } = useThemeTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder or null to avoid hydration mismatch
    return <div className="h-10 w-10" />; // Matches button size
  }

  const toggleTheme = () => {
    if (resolvedTheme) {
      triggerThemeChange(resolvedTheme === 'dark' ? 'light' : 'dark');
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleTheme} 
      aria-label="Toggle theme"
      disabled={isTransitioning} // Disable button during transition
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem]" />
      )}
    </Button>
  );
}
