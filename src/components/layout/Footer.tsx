
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // Added useRouter
import { Briefcase, MessageSquare, FileText, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import React, { useState, TouchEvent as ReactTouchEvent, useCallback } from 'react'; // Added useState, ReactTouchEvent, useCallback

const navItems = [
  { href: '/', label: 'Portfolio', icon: Briefcase },
  { href: '/contact', label: 'Contact', icon: MessageSquare },
  { href: '/resume', label: 'Resume', icon: FileText },
  { href: '/mr-m', label: 'Mr.M', icon: Bot },
];

const MIN_SWIPE_DISTANCE = 50; // Minimum pixels for a swipe

export default function Footer() {
  const pathname = usePathname();
  const router = useRouter();
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null); // Also track end X for potential future use or more complex logic

  const handleTouchStart = (e: ReactTouchEvent<HTMLElement>) => {
    // Only capture the first touch to avoid multi-touch conflicts
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchEndX(null); // Reset touchEndX
  };

  const handleTouchMove = (e: ReactTouchEvent<HTMLElement>) => {
    // Store the last touch X position during move
    // This could be used for visual feedback during swipe, but not strictly needed for navigation on touchend
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = useCallback(() => {
    if (touchStartX === null || touchEndX === null) {
      // If there was no movement or only a tap (touchEndX not set by move, or startX is null)
      setTouchStartX(null);
      setTouchEndX(null);
      return;
    }

    const swipeDistance = touchStartX - touchEndX; // Positive for left swipe, negative for right swipe

    if (Math.abs(swipeDistance) < MIN_SWIPE_DISTANCE) {
      setTouchStartX(null);
      setTouchEndX(null);
      return; // Not a significant swipe
    }

    const currentIndex = navItems.findIndex(item => item.href === pathname);
    if (currentIndex === -1) {
        setTouchStartX(null);
        setTouchEndX(null);
        return; // Current path not in nav items, or something went wrong
    }

    let nextIndex: number;

    if (swipeDistance > 0) { // Swiped Left (user dragged finger from right to left) -> Go to next item
      nextIndex = (currentIndex + 1) % navItems.length;
    } else { // Swiped Right (user dragged finger from left to right) -> Go to previous item
      nextIndex = (currentIndex - 1 + navItems.length) % navItems.length;
    }

    // Since all current navItems are enabled, no need to check for (item as any).disabled
    const targetItem = navItems[nextIndex];
    if (targetItem) { // Check if targetItem is valid before pushing
        router.push(targetItem.href);
    }

    setTouchStartX(null);
    setTouchEndX(null);
  }, [touchStartX, touchEndX, pathname, router]);


  return (
    <TooltipProvider delayDuration={0}>
      <footer
        className="fixed bottom-0 left-0 right-0 z-40 h-16 border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove} // Added onTouchMove
        onTouchEnd={handleTouchEnd}
      >
        <nav className="container mx-auto flex h-full max-w-md items-center justify-around px-4">
          {navItems.map((item) => {
            const isDisabled = !!(item as any).disabled;
            const isActive = !isDisabled && pathname === item.href;

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={isDisabled ? '#' : item.href}
                    passHref
                    onClick={(e) => {
                      if (isDisabled) {
                        e.preventDefault();
                      }
                    }}
                    aria-disabled={isDisabled}
                    className={cn(
                      'flex flex-col items-center justify-center rounded-md p-2 transition-colors',
                      isDisabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-accent/80 hover:text-accent-foreground',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                    tabIndex={isDisabled ? -1 : undefined}
                  >
                    <item.icon className={cn('h-6 w-6', isActive ? 'text-primary' : '')} />
                    <span className="sr-only">{item.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </footer>
    </TooltipProvider>
  );
}
