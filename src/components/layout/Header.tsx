
'use client';

import Link from 'next/link';
import Image from 'next/image';
import ThemeSwitcher from './ThemeSwitcher';
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Briefcase, MessageSquare, FileText, Brain, LockKeyhole, Eye, EyeOff, Volume2, VolumeX, Pencil, AlertTriangle, Save } from 'lucide-react';
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { useName } from '@/contexts/NameContext';

const navItems = [
  { href: '/', label: 'Portfolio', icon: Briefcase },
  { href: '/contact', label: 'Contact', icon: MessageSquare },
  { href: '/resume', label: 'Resume', icon: FileText },
  { href: '/ai-intro', label: 'AI Intro', icon: Brain, disabled: true },
];

const SECRET_PASSWORD = "tinku@197";
const CLICKS_TO_ACTIVATE = 5;
const MAX_CLICK_DELAY_MS = 1000; 
const MAX_FAILED_ATTEMPTS = 6;
const LOCKOUT_DURATION_MS = 1 * 60 * 60 * 1000; // 1 hour

const FAILED_ATTEMPTS_KEY = 'portfolioSecretLairFailedAttempts';
const LOCKOUT_END_TIME_KEY = 'portfolioSecretLairLockoutEndTime';


interface HeaderProps {
  isSoundEnabled: boolean;
  toggleSoundEnabled: () => void;
  isPersonalizationActive: boolean; // Renamed from isPencilDrawingEnabled
  toggleNameInputDialog: () => void;    // Renamed from togglePencilDrawing
  showNameInputDialog: boolean;
  isLightTheme: boolean;
}

export default function Header({ 
  isSoundEnabled, 
  toggleSoundEnabled,
  isPersonalizationActive,
  toggleNameInputDialog,
  showNameInputDialog,
  isLightTheme
}: HeaderProps) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { resolvedTheme } = useTheme();
  const { setUserName } = useName();

  const [logoClickCount, setLogoClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordAttempt, setPasswordAttempt] = useState('');
  const [showPasswordAttemptVisual, setShowPasswordAttemptVisual] = useState(false);

  const [failedAttempts, setFailedAttemptsState] = useState(0);
  const [lockoutEndTime, setLockoutEndTimeState] = useState<number | null>(null);
  const [showLockedUI, setShowLockedUI] = useState(false);

  const [currentNameInput, setCurrentNameInput] = useState('');


  const updateLockoutStateFromStorage = useCallback(() => {
    const storedAttempts = localStorage.getItem(FAILED_ATTEMPTS_KEY);
    const storedLockoutTime = localStorage.getItem(LOCKOUT_END_TIME_KEY);

    const currentAttempts = storedAttempts ? parseInt(storedAttempts, 10) : 0;
    setFailedAttemptsState(currentAttempts);

    let isCurrentlyLocked = false;
    if (storedLockoutTime) {
      const lockoutEnd = parseInt(storedLockoutTime, 10);
      if (Date.now() < lockoutEnd) {
        setLockoutEndTimeState(lockoutEnd);
        if (currentAttempts >= MAX_FAILED_ATTEMPTS) {
          isCurrentlyLocked = true;
        }
      } else {
        localStorage.removeItem(FAILED_ATTEMPTS_KEY);
        localStorage.removeItem(LOCKOUT_END_TIME_KEY);
        setFailedAttemptsState(0); 
        setLockoutEndTimeState(null);
      }
    }
    setShowLockedUI(isCurrentlyLocked);
    return isCurrentlyLocked;
  }, []);

  useEffect(() => {
    setMounted(true);
    updateLockoutStateFromStorage();
  }, [updateLockoutStateFromStorage]);

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
      updateLockoutStateFromStorage(); 
      setShowPasswordDialog(true);
      setPasswordAttempt(''); 
      setShowPasswordAttemptVisual(false); 
    }
  };

  const handlePasswordCheck = () => {
    if (showLockedUI) return;

    if (passwordAttempt === SECRET_PASSWORD) {
      toast({
        title: "Access Granted!",
        description: "Welcome to the Secret Lair.",
      });
      localStorage.removeItem(FAILED_ATTEMPTS_KEY);
      localStorage.removeItem(LOCKOUT_END_TIME_KEY);
      setFailedAttemptsState(0);
      setLockoutEndTimeState(null);
      setShowLockedUI(false);
      router.push('/secret-lair');
      setShowPasswordDialog(false); 
    } else {
      const newAttempts = failedAttempts + 1;
      setFailedAttemptsState(newAttempts);
      localStorage.setItem(FAILED_ATTEMPTS_KEY, newAttempts.toString());

      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        const newLockoutEndTime = Date.now() + LOCKOUT_DURATION_MS;
        setLockoutEndTimeState(newLockoutEndTime);
        localStorage.setItem(LOCKOUT_END_TIME_KEY, newLockoutEndTime.toString());
        setShowLockedUI(true);
        toast({
          title: "Access Denied",
          description: "Too many failed attempts. This feature has been temporarily disabled.",
          variant: "destructive",
          duration: 10 * 60 * 1000, 
        });
      } else {
        toast({
          title: "Incorrect Password",
          description: `Please try again. Attempts remaining: ${MAX_FAILED_ATTEMPTS - newAttempts}`,
          variant: "destructive",
        });
      }
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

  const handlePasswordDialogClose = () => {
    setPasswordAttempt('');
    setShowPasswordAttemptVisual(false);
    setLogoClickCount(0); 
    setLastClickTime(0);
  };

  const handleSaveName = () => {
    if (currentNameInput.trim()) {
      setUserName(currentNameInput.trim());
      toast({ title: "Name Saved!", description: `Your greeting is now personalized, ${currentNameInput.trim()}!`});
      toggleNameInputDialog(); // Close dialog
    } else {
      toast({ title: "Oops!", description: "Please enter a name.", variant: "destructive" });
    }
  };


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
             {mounted && isLightTheme && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleNameInputDialog} // Opens the name input dialog
                aria-label={isPersonalizationActive ? "Change personalized name" : "Personalize greeting"}
                className={cn(isPersonalizationActive && "text-primary")}
              >
                <Pencil className="h-[1.2rem] w-[1.2rem] transition-all duration-300 ease-in-out" />
              </Button>
            )}
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

      {/* Password Dialog for Secret Lair */}
      <AlertDialog open={showPasswordDialog} onOpenChange={(isOpen) => {
        setShowPasswordDialog(isOpen); 
        if (isOpen) {
          updateLockoutStateFromStorage(); 
        }
        if (!isOpen) {
          handlePasswordDialogClose(); 
        }
      }}>
        <AlertDialogContent>
          <form onSubmit={handlePasswordSubmitFormEvent}> 
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center">
                {showLockedUI ? <AlertTriangle className="mr-2 h-5 w-5 text-destructive" /> : <LockKeyhole className="mr-2 h-5 w-5 text-primary" />}
                {showLockedUI ? "Access Temporarily Disabled" : "Enter Secret Code"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {showLockedUI 
                  ? "Access to this feature has been temporarily disabled due to multiple incorrect attempts. Please try again later."
                  : "You've discovered a hidden path. Enter the password to proceed."
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            {!showLockedUI && (
              <div className="py-4 relative">
                <Input
                  type={showPasswordAttemptVisual ? "text" : "password"}
                  placeholder="Password"
                  value={passwordAttempt}
                  onChange={(e) => setPasswordAttempt(e.target.value)}
                  autoFocus
                  className="pr-10"
                  disabled={showLockedUI}
                />
                <Button
                  type="button" 
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={toggleShowPasswordAttemptVisual}
                  aria-label={showPasswordAttemptVisual ? "Hide password" : "Show password"}
                  disabled={showLockedUI}
                >
                  {showPasswordAttemptVisual ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowPasswordDialog(false)} disabled={showLockedUI && lockoutEndTime !== null && Date.now() < lockoutEndTime}>
                {showLockedUI ? "Close" : "Cancel"}
              </AlertDialogCancel> 
              {!showLockedUI && <Button type="submit" disabled={showLockedUI}>Unlock</Button>}
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      {/* Name Input Dialog */}
      <Dialog open={showNameInputDialog} onOpenChange={toggleNameInputDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Personalize Your Greeting</DialogTitle>
            <DialogDescription>
              Enter your name to see a personalized welcome message on the site.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name-input" className="text-right">
                Name
              </Label>
              <Input
                id="name-input"
                value={currentNameInput}
                onChange={(e) => setCurrentNameInput(e.target.value)}
                placeholder="Your Name"
                className="col-span-3"
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); }}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={handleSaveName}>
              <Save className="mr-2 h-4 w-4" /> Save Name
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
