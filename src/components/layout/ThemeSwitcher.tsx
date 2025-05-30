
'use client';

import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Lightbulb } from 'lucide-react'; // Only Lightbulb is needed now
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
      <div className="relative h-[1.2rem] w-[1.2rem]"> {/* Container for icon and rays, matching icon size */}
        <Lightbulb className="h-full w-full" /> {/* Icon fills this container */}
        {resolvedTheme === 'light' && (
          <>
            {/* Center ray: directly above the center of the icon */}
            <span 
              className="absolute bg-current w-px rounded-full"
              style={{ height: '4px', top: '-5px', left: '50%', transform: 'translateX(-50%)' }}
              aria-hidden="true"
            ></span>
            {/* Left-angled ray */}
            <span 
              className="absolute bg-current w-px rounded-full origin-center"
              style={{ height: '4px', top: '-3px', left: '15%', transform: 'rotate(-45deg)' }}
              aria-hidden="true"
            ></span>
            {/* Right-angled ray */}
            <span 
              className="absolute bg-current w-px rounded-full origin-center"
              style={{ height: '4px', top: '-3px', right: '15%', transform: 'rotate(45deg)' }}
              aria-hidden="true"
            ></span>
          </>
        )}
      </div>
    </Button>
  );
}
