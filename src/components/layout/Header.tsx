
'use client';

import Link from 'next/link';
import Image from 'next/image';
import ThemeSwitcher from './ThemeSwitcher';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Briefcase, MessageSquare, FileText, Brain, LockKeyhole, Eye, EyeOff } from 'lucide-react';
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

const navItems = [
  { href: '/', label: 'Portfolio', icon: Briefcase },
  { href: '/contact', label: 'Contact', icon: MessageSquare },
  { href: '/resume', label: 'Resume', icon: FileText },
  { href: '/ai-intro', label: 'AI Intro', icon: Brain, disabled: true },
];

const SECRET_PASSWORD = "tinku@197";
const CLICKS_TO_ACTIVATE = 5;
const MAX_CLICK_DELAY_MS = 1000; // 1 second

export default function Header() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

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
      // Reset attempts for the new dialog session
      setPasswordAttempt(''); 
      setShowPasswordAttemptVisual(false); 
      // Do not reset logoClickCount here, let handleDialogClose do it
    }
  };

  const handlePasswordCheck = () => {
    console.log(`[Header] Attempting password: '${passwordAttempt}' (length: ${passwordAttempt.length})`);
    console.log(`[Header] Expected password: '${SECRET_PASSWORD}' (length: ${SECRET_PASSWORD.length})`);

    if (passwordAttempt === SECRET_PASSWORD) {
      console.log('[Header] Password MATCHED!');
      toast({
        title: "Access Granted!",
        description: "Welcome to the Secret Lair.",
      });
      router.push('/secret-lair');
      setShowPasswordDialog(false); // Explicitly close dialog on success
    } else {
      console.log('[Header] Password MISMATCH.');
      toast({
        title: "Incorrect Password",
        description: "Please try again.",
        variant: "destructive",
      });
      setPasswordAttempt(''); // Clear input for another try, dialog remains open
    }
  };
  
  const handlePasswordSubmitFormEvent = (event: React.FormEvent) => {
    event.preventDefault(); 
    console.log(`[Header] Form submit event. Password from state: '${passwordAttempt}'`);
    handlePasswordCheck();
  };

  const toggleShowPasswordAttemptVisual = () => {
    setShowPasswordAttemptVisual(prev => !prev);
  };

  const handleDialogClose = () => {
    // This function is called when the dialog's open state changes to false
    console.log('[Header] handleDialogClose called. Resetting states.');
    setPasswordAttempt('');
    setShowPasswordAttemptVisual(false);
    setLogoClickCount(0); 
    setLastClickTime(0);
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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

          <div className="flex items-center space-x-2">
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
                onChange={(e) => {
                  console.log(`[Header] Input onChange, new value: '${e.target.value}'`);
                  setPasswordAttempt(e.target.value);
                }}
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
              {/* Use a standard Button for unlock to prevent AlertDialog's default close-on-action behavior */}
              <Button type="submit">Unlock</Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
