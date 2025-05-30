
'use client';

import Link from 'next/link';
import Image from 'next/image';
import ThemeSwitcher from './ThemeSwitcher';
import React, { useState, useEffect } from 'react';

// navItems definition removed as it will be in Footer or a shared location

export default function Header() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // NavLinks component and mobile navigation Sheet removed

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2 text-xl font-bold text-primary">
          <Image
            src="/favicon22.png"
            alt="Myth Logo"
            width={28}
            height={28}
            className="h-7 w-7"
          />
          {/* Myth text already removed */}
        </Link>

        <div className="flex items-center space-x-2">
          {/* Desktop Navigation Removed */}
          {/* Mobile Navigation Removed */}
          {mounted && <ThemeSwitcher />}
        </div>
      </div>
    </header>
  );
}
