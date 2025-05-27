
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, MessageSquare, FileText, Brain, CodeXml, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import ThemeSwitcher from './ThemeSwitcher';

const navItems = [
  { href: '/', label: 'Portfolio', icon: Briefcase },
  { href: '/contact', label: 'Contact', icon: MessageSquare },
  { href: '/resume', label: 'Resume', icon: FileText },
  { href: '/ai-intro', label: 'AI Intro', icon: Brain, disabled: true },
];

interface HeaderProps {
  onThemeToggle: () => void;
  isThemeChanging: boolean;
}

export default function Header({ onThemeToggle, isThemeChanging }: HeaderProps) {
  const pathname = usePathname();

  const NavLinks = ({isMobile = false}: {isMobile?: boolean}) => (
    <>
      {navItems.map((item) => {
        const isDisabled = !!item.disabled;

        return (
          <Link
            key={item.href}
            href={isDisabled ? '#' : item.href}
            passHref
            onClick={(e) => {
              if (isDisabled) {
                e.preventDefault();
              }
            }}
            aria-disabled={isDisabled}
            className={cn(
              isDisabled ? "cursor-not-allowed" : ""
            )}
          >
            <Button
              variant="ghost"
              className={cn(
                'justify-start text-base hover:bg-accent/80 hover:text-accent-foreground',
                isMobile ? 'w-full my-1' : 'mx-1',
                pathname === item.href && !isDisabled ? 'bg-accent text-accent-foreground font-semibold' : '',
                isDisabled ? 'opacity-50' : '' // Added for visual cue if needed, but button disabled handles it
              )}
              aria-current={pathname === item.href && !isDisabled ? 'page' : undefined}
              disabled={isDisabled}
              tabIndex={isDisabled ? -1 : undefined}
            >
              <item.icon className="mr-2 h-5 w-5" />
              {item.label}
            </Button>
          </Link>
        );
      })}
    </>
  );


  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2 text-xl font-bold text-primary">
          <CodeXml className="h-7 w-7" />
          <span>PortfolioFlow</span>
        </Link>

        <div className="flex items-center space-x-2">
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <NavLinks />
          </nav>

          <ThemeSwitcher onThemeToggle={onThemeToggle} isThemeChanging={isThemeChanging} />

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isThemeChanging}>
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] p-6">
                <nav className="flex flex-col space-y-3">
                  <NavLinks isMobile={true} />
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
