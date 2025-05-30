
'use client';

import Link from 'next/link';
import Image from 'next/image';
import ThemeSwitcher from './ThemeSwitcher';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Briefcase, MessageSquare, FileText, Brain } from 'lucide-react'; // Keep Brain for navItems consistency

const navItems = [
  { href: '/', label: 'Portfolio', icon: Briefcase },
  { href: '/contact', label: 'Contact', icon: MessageSquare },
  { href: '/resume', label: 'Resume', icon: FileText },
  { href: '/ai-intro', label: 'AI Intro', icon: Brain, disabled: true },
];

export default function Header() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2 text-xl font-bold">
          <Image
            src="/favicon22.png"
            alt="Myth Logo"
            width={28}
            height={28}
            className="h-7 w-7"
          />
        </Link>

        {/* Desktop Navigation */}
        {mounted && (
          <nav className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => {
              const isDisabled = !!item.disabled;
              return (
                <Button
                  key={item.href}
                  asChild
                  variant="ghost"
                  className={cn(
                    'text-sm font-medium',
                    isDisabled ? 'cursor-not-allowed opacity-50' : 'hover:text-primary',
                    // Add active state styling if needed, using usePathname
                  )}
                  disabled={isDisabled}
                  tabIndex={isDisabled ? -1 : undefined}
                >
                  <Link
                    href={isDisabled ? '#' : item.href}
                    onClick={(e) => {
                      if (isDisabled) {
                        e.preventDefault();
                      }
                    }}
                    aria-disabled={isDisabled}
                  >
                    {item.label}
                  </Link>
                </Button>
              );
            })}
          </nav>
        )}

        <div className="flex items-center space-x-2">
          {mounted && <ThemeSwitcher />}
        </div>
      </div>
    </header>
  );
}
