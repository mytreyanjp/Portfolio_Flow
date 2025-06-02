
'use client';

import Link from 'next/link';
import Image from 'next/image';
import ThemeSwitcher from './ThemeSwitcher';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Briefcase, MessageSquare, FileText, Brain, LockKeyhole } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from '@/hooks/use-toast';

const navItems = [
  { href: '/', label: 'Portfolio', icon: Briefcase },
  { href: '/contact', label: 'Contact', icon: MessageSquare },
  { href: '/resume', label: 'Resume', icon: FileText },
  { href: '/ai-intro', label: 'AI Intro', icon: Brain, disabled: true },
];

const SECRET_PASSWORD = "tinku@197";
const CLICKS_TO_ACTIVATE = 5;

export default function Header() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const [logoClickCount, setLogoClickCount] = useState(0);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordAttempt, setPasswordAttempt] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogoClick = () => {
    const newClickCount = logoClickCount + 1;
    if (newClickCount >= CLICKS_TO_ACTIVATE) {
      setShowPasswordDialog(true);
      setLogoClickCount(0); // Reset after triggering
    } else {
      setLogoClickCount(newClickCount);
    }
  };

  const handlePasswordSubmit = (event: React.FormEvent) => {
    event.preventDefault(); // Prevent form submission if it's in a form
    if (passwordAttempt === SECRET_PASSWORD) {
      setShowPasswordDialog(false);
      setPasswordAttempt('');
      router.push('/secret-lair');
    } else {
      toast({
        title: "Incorrect Password",
        description: "Please try again.",
        variant: "destructive",
      });
      setPasswordAttempt('');
      // Optionally keep the dialog open:
      // setShowPasswordDialog(true); 
      // Or close it:
      // setShowPasswordDialog(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2 text-xl font-bold" passHref>
            <div 
              onClick={handleLogoClick} 
              aria-label="Site Logo - click multiple times for a surprise" 
              role="button" 
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleLogoClick(); }}}
              className="cursor-pointer"
            >
              <Image
                src="/favicon22.png"
                alt="Myth Logo"
                width={28}
                height={28}
                className="h-7 w-7"
              />
            </div>
          </Link>

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
                          ? 'text-primary hover:bg-transparent'
                          : 'text-muted-foreground hover:text-primary hover:bg-transparent'
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
          </div>
        </div>
      </header>

      <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <AlertDialogContent>
          <form onSubmit={handlePasswordSubmit}>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center">
                <LockKeyhole className="mr-2 h-5 w-5 text-primary" />
                Enter Secret Code
              </AlertDialogTitle>
              <AlertDialogDescription>
                You've discovered a hidden path. Enter the password to proceed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Input
                type="password"
                placeholder="Password"
                value={passwordAttempt}
                onChange={(e) => setPasswordAttempt(e.target.value)}
                autoFocus
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPasswordAttempt('')}>Cancel</AlertDialogCancel>
              <AlertDialogAction type="submit">Unlock</AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
