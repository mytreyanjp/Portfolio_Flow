
'use client';

import Link from 'next/link';
import Image from 'next/image';
import ThemeSwitcher from './ThemeSwitcher';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Briefcase, MessageSquare, FileText, Brain, LockKeyhole, Eye, EyeOff, Volume2, VolumeX } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';

const navItems = [
  { href: '/', label: 'Portfolio', icon: Briefcase },
  { href: '/contact', label: 'Contact', icon: MessageSquare },
  { href: '/resume', label: 'Resume', icon: FileText },
  { href: '/ai-intro', label: 'AI Intro', icon: Brain, disabled: true },
];

const SECRET_PASSWORD = "tinku@197";
const CLICKS_TO_ACTIVATE = 5;
const MAX_CLICK_DELAY_MS = 1000; // 1 second

interface HeaderProps {
  isSoundEnabled: boolean;
  toggleSoundEnabled: () => void;
}

export default function Header({ isSoundEnabled, toggleSoundEnabled }: HeaderProps) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { resolvedTheme } = useTheme();

  const [logoClickCount, setLogoClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordAttempt, setPasswordAttempt] = useState('');
  const [showPasswordAttemptVisual, setShowPasswordAttemptVisual] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogoClick = () => {
    const currentTime = Date.now();
    let newClickCount;

    if (currentTime - lastClickTime > MAX_CLICK_DELAY_MS || logoClickCount === 0) {
      newClickCount = 1;
    } else {
      newClickCount = logoClickCount + 1;
    }

    setLogoClickCount(newClickCount);
    setLastClickTime(currentTime);

    if (newClickCount >= CLICKS_TO_ACTIVATE) {
      setShowPasswordDialog(true);
      setPasswordAttempt(''); 
      setShowPasswordAttemptVisual(false); 
    }
  };

  const handlePasswordCheck = () => {
    if (passwordAttempt === SECRET_PASSWORD) {
      toast({
        title: "Access Granted!",
        description: "Welcome to the Secret Lair.",
      });
      router.push('/secret-lair');
      setShowPasswordDialog(false); 
    } else {
      toast({
        title: "Incorrect Password",
        description: "Please try again.",
        variant: "destructive",
      });
      setPasswordAttempt(''); 
    }
  };
  
  const handlePasswordSubmitFormEvent = (event: React.FormEvent) => {
    event.preventDefault(); 
    handlePasswordCheck();
  };

  const toggleShowPasswordAttemptVisual = () => {
    setShowPasswordAttemptVisual(prev => !prev);
  };

  const handleDialogClose = () => {
    setPasswordAttempt('');
    setShowPasswordAttemptVisual(false);
    setLogoClickCount(0); 
    setLastClickTime(0);
  }

  return (
    <>
      <header className={cn(
          "sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        )}
      >
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2 text-xl font-bold" passHref>
            <div
              onClick={handleLogoClick}
              aria-label="Site Logo - click multiple times rapidly for a surprise"
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

          <div className="flex items-center space-x-1">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSoundEnabled}
                aria-label={isSoundEnabled ? "Mute sounds" : "Unmute sounds"}
              >
                {isSoundEnabled ? (
                  <Volume2 className="h-[1.2rem] w-[1.2rem] transition-all duration-300 ease-in-out" />
                ) : (
                  <VolumeX className="h-[1.2rem] w-[1.2rem] transition-all duration-300 ease-in-out" />
                )}
              </Button>
            )}
            {mounted && <ThemeSwitcher />}
          </div>
        </div>
      </header>

      <AlertDialog open={showPasswordDialog} onOpenChange={(isOpen) => {
        setShowPasswordDialog(isOpen); 
        if (!isOpen) {
          handleDialogClose(); 
        }
      }}>
        <AlertDialogContent>
          <form onSubmit={handlePasswordSubmitFormEvent}> 
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center">
                <LockKeyhole className="mr-2 h-5 w-5 text-primary" />
                Enter Secret Code
              </AlertDialogTitle>
              <AlertDialogDescription>
                You've discovered a hidden path. Enter the password to proceed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4 relative">
              <Input
                type={showPasswordAttemptVisual ? "text" : "password"}
                placeholder="Password"
                value={passwordAttempt}
                onChange={(e) => setPasswordAttempt(e.target.value)}
                autoFocus
                className="pr-10"
              />
              <Button
                type="button" 
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={toggleShowPasswordAttemptVisual}
                aria-label={showPasswordAttemptVisual ? "Hide password" : "Show password"}
              >
                {showPasswordAttemptVisual ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </Button>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel> 
              <Button type="submit">Unlock</Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

