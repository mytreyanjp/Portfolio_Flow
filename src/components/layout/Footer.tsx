
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, MessageSquare, FileText, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import React from 'react';

const navItems = [
  { href: '/', label: 'Portfolio', icon: Briefcase },
  { href: '/contact', label: 'Contact', icon: MessageSquare },
  { href: '/resume', label: 'Resume', icon: FileText },
  { href: '/ai-intro', label: 'AI Intro', icon: Brain, disabled: true },
];

export default function Footer() {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={0}>
      {/* Footer is now hidden on md screens and up */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 h-16 border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
        <nav className="container mx-auto flex h-full max-w-md items-center justify-around px-4">
          {navItems.map((item) => {
            const isDisabled = !!item.disabled;
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
