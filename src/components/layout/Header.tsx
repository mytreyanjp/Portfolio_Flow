
'use client';

import Link from 'next/link';
import Image from 'next/image';
import ThemeSwitcher from './ThemeSwitcher';
import React, { useState, useEffect } from 'react';
import { Button, buttonVariants } from '@/components/ui/button'; // Added buttonVariants import
import { cn } from '@/lib/utils';
import { Briefcase, MessageSquare, FileText, Brain, Menu as MenuIcon } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { usePathname } from 'next/navigation';


const navItems = [
  { href: '/', label: 'Portfolio', icon: Briefcase },
  { href: '/contact', label: 'Contact', icon: MessageSquare },
  { href: '/resume', label: 'Resume', icon: FileText },
  { href: '/ai-intro', label: 'AI Intro', icon: Brain, disabled: true },
];

export default function Header() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

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
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isDisabled = !!item.disabled;
              const isActive = pathname === item.href;
              return (
                <Button
                  key={item.href}
                  asChild
                  variant="ghost"
                  className={cn(
                    'text-sm font-medium',
                    isDisabled
                      ? 'cursor-not-allowed opacity-50'
                      : isActive
                        ? 'text-primary hover:bg-transparent' // Active link style
                        : 'text-muted-foreground hover:text-primary hover:bg-transparent' // Normal and hover state
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
                    aria-current={isActive ? 'page' : undefined}
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
          {/* Mobile Navigation Toggle */}
          {mounted && (
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "h-9 w-9" // Adjust size to match other header icons if needed
                  )}
                  aria-label="Toggle navigation menu"
                >
                  <MenuIcon className="h-5 w-5" />
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader className="mb-6 border-b pb-4">
                    <SheetTitle className="text-left flex items-center space-x-2">
                       <Image
                         src="/favicon22.png"
                         alt="Myth Logo"
                         width={24}
                         height={24}
                       />
                       <span>Myth Navigation</span>
                    </SheetTitle>
                    <SheetDescription className="sr-only">
                      Mobile navigation menu.
                    </SheetDescription>
                  </SheetHeader>
                  <nav className="flex flex-col space-y-2">
                    {navItems.map((item) => {
                      const isDisabled = !!item.disabled;
                      const isActive = pathname === item.href;
                      return (
                        <SheetClose asChild key={item.href}>
                          <Link
                            href={isDisabled ? '#' : item.href}
                            onClick={(e) => {
                              if (isDisabled) {
                                e.preventDefault();
                              }
                            }}
                            aria-disabled={isDisabled}
                            aria-current={isActive ? 'page' : undefined}
                            className={cn(
                              "flex items-center rounded-md px-3 py-2 text-base font-medium",
                              isDisabled
                                ? "cursor-not-allowed text-muted-foreground/50"
                                : isActive
                                  ? "bg-primary/10 text-primary"
                                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                            )}
                          >
                            <item.icon className="mr-3 h-5 w-5" />
                            {item.label}
                          </Link>
                        </SheetClose>
                      );
                    })}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
