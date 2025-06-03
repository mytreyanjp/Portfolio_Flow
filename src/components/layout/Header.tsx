
'use client';

import Link from 'next/link';
import Image from 'next/image';
import ThemeSwitcher from './ThemeSwitcher';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Briefcase, MessageSquare, FileText, Bot, LockKeyhole, Eye, EyeOff, Volume2, VolumeX, Pencil, Edit3, AlertTriangle, Save, Loader2 } from 'lucide-react';
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { useName } from '@/contexts/NameContext';
import HandwritingCanvas, { type HandwritingCanvasRef } from '@/components/effects/HandwritingCanvas';
import { recognizeHandwriting } from '@/ai/flows/recognize-handwriting-flow';


const navItems = [
  { href: '/', label: 'Portfolio', icon: Briefcase },
  { href: '/contact', label: 'Contact', icon: MessageSquare },
  { href: '/resume', label: 'Resume', icon: FileText },
  { href: '/mr-m', label: 'Mr.M', icon: Bot },
];

const SECRET_PASSWORD = "tinku@197";
const CLICKS_TO_ACTIVATE = 5;
const MAX_CLICK_DELAY_MS = 1000; // 1 second between clicks
const MAX_FAILED_ATTEMPTS = 6;
const LOCKOUT_DURATION_MS = 1 * 60 * 60 * 1000; // 1 hour

const FAILED_ATTEMPTS_KEY = 'portfolioSecretLairFailedAttempts';
const LOCKOUT_END_TIME_KEY = 'portfolioSecretLairLockoutEndTime';

interface HeaderProps {
  isSoundEnabled: boolean;
  toggleSoundEnabled: () => void;
  isPersonalizationActive: boolean;
  toggleNameInputDialog: () => void;
  showNameInputDialog: boolean;
  isLightTheme: boolean;
  isPencilModeActive: boolean;
  togglePencilMode: () => void;
}

export default function Header({
  isSoundEnabled,
  toggleSoundEnabled,
  isPersonalizationActive,
  toggleNameInputDialog,
  showNameInputDialog,
  isLightTheme,
  isPencilModeActive,
  togglePencilMode,
}: HeaderProps) {
  const [mounted, setMounted] = useState(false); // Keep for ThemeSwitcher and other internal logic if needed
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  // useTheme hook is not needed here as isLightTheme comes from props
  const { setUserName, setDetectedLanguage } = useName();
  const handwritingCanvasRef = useRef<HandwritingCanvasRef>(null);
  const [isRecognizingName, setIsRecognizingName] = useState(false);


  const [logoClickCount, setLogoClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordAttempt, setPasswordAttempt] = useState('');
  const [showPasswordAttemptVisual, setShowPasswordAttemptVisual] = useState(false);

  const [failedAttempts, setFailedAttemptsState] = useState(0);
  const [lockoutEndTime, setLockoutEndTimeState] = useState<number | null>(null);
  const [showLockedUI, setShowLockedUI] = useState(false);


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
        if (currentAttempts >= MAX_FAILED_ATTEMPTS) isCurrentlyLocked = true;
      } else {
        localStorage.removeItem(FAILED_ATTEMPTS_KEY);
        localStorage.removeItem(LOCKOUT_END_TIME_KEY);
        setFailedAttemptsState(0);
        setLockoutEndTimeState(null);
      }
    }
    setShowLockedUI(isCurrentlyLocked);
    return isCurrentlyLocked;
  }, [lockoutEndTime]);

  useEffect(() => {
    setMounted(true); // General mounted flag for client-side only operations
    updateLockoutStateFromStorage();
  }, [updateLockoutStateFromStorage]);


  const handleLogoClick = () => {
    const currentTime = Date.now();
    let newClickCount = (currentTime - lastClickTime > MAX_CLICK_DELAY_MS || logoClickCount === 0) ? 1 : logoClickCount + 1;
    
    setLogoClickCount(newClickCount);
    setLastClickTime(currentTime);

    if (newClickCount >= CLICKS_TO_ACTIVATE) {
      if (updateLockoutStateFromStorage()) {
         toast({ title: "Access Temporarily Disabled", description: `Please try again later. Locked until ${new Date(lockoutEndTime!).toLocaleTimeString()}`, variant: "destructive", duration: 7000 });
         return;
      }
      setShowPasswordDialog(true);
      setPasswordAttempt('');
      setShowPasswordAttemptVisual(false);
    }
  };

  const handlePasswordCheck = () => {
    if (showLockedUI) return;

    if (passwordAttempt === SECRET_PASSWORD) {
      toast({ title: "Password Correct!", description: "Proceed to verify your identity for Secret Lair access." });
      localStorage.removeItem(FAILED_ATTEMPTS_KEY);
      localStorage.removeItem(LOCKOUT_END_TIME_KEY);
      setFailedAttemptsState(0); setLockoutEndTimeState(null); setShowLockedUI(false);
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
        toast({ title: "Access Denied", description: "This feature has been temporarily disabled due to multiple incorrect attempts.", variant: "destructive", duration: 10 * 60 * 1000 });
        setShowPasswordDialog(false);
      } else {
        toast({ title: "Incorrect Password", description: `Please try again. Attempts remaining: ${MAX_FAILED_ATTEMPTS - newAttempts}`, variant: "destructive" });
      }
      setPasswordAttempt('');
    }
  };

  const handlePasswordSubmitFormEvent = (event: React.FormEvent) => {
    event.preventDefault();
    handlePasswordCheck();
  };

  const toggleShowPasswordAttemptVisual = () => setShowPasswordAttemptVisual(prev => !prev);
  
  const handlePasswordDialogClose = () => {
    setPasswordAttempt(''); setShowPasswordAttemptVisual(false);
    setLogoClickCount(0); setLastClickTime(0);
  };

  const handleSaveDrawnName = async () => {
    if (!handwritingCanvasRef.current) return;
    const imageDataUri = handwritingCanvasRef.current.getImageDataUrl();
    if (!imageDataUri) {
      toast({ title: "Empty Canvas", description: "Please draw your name first.", variant: "destructive" });
      return;
    }
    setIsRecognizingName(true);
    try {
      const result = await recognizeHandwriting({ imageDataUri });
      if (result.recognizedText && result.recognizedText.trim() !== "") {
        setUserName(result.recognizedText.trim());

        if (result.detectedLanguage) {
          setDetectedLanguage(result.detectedLanguage);
          toast({
            title: "Name Saved!",
            description: `Personalized with name: "${result.recognizedText.trim()}". Language detected: ${result.detectedLanguage}.`,
          });
        } else {
          setDetectedLanguage(null);
          toast({
            title: "Name Saved, Language Unclear",
            description: `We've saved your name as "${result.recognizedText.trim()}", but the language of the script was not clear. The site will remain in English.`,
            variant: "default",
          });
        }
        toggleNameInputDialog();
      } else {
        setDetectedLanguage(null);
        toast({
          title: "Recognition Failed",
          description: "Could not recognize a name from the drawing. Please try writing more clearly.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Handwriting recognition error:", error);
      toast({ title: "Recognition Error", description: "An error occurred while trying to recognize your name. Please try again.", variant: "destructive" });
      setDetectedLanguage(null);
    } finally {
      setIsRecognizingName(false);
    }
  };


  return (
    <>
      <header className={cn("sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60")}>
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2 text-xl font-bold" passHref>
            <div onClick={handleLogoClick} aria-label="Site Logo - click multiple times rapidly for a surprise" role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleLogoClick(); }}} className="cursor-pointer">
              <Image src="/favicon22.png" alt="Myth Logo" width={28} height={28} className="h-7 w-7" />
            </div>
          </Link>

          {mounted && ( // Keep for desktop nav items
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const isDisabled = !!(item as any).disabled;
                const isActive = pathname === item.href;
                return (
                  <Button key={item.href} asChild variant="ghost" className={cn('text-sm font-medium', isDisabled ? 'cursor-not-allowed opacity-50' : isActive ? 'text-primary hover:bg-transparent' : 'text-muted-foreground hover:text-primary hover:bg-transparent')} disabled={isDisabled} tabIndex={isDisabled ? -1 : undefined}>
                    <Link href={isDisabled ? '#' : item.href} onClick={(e) => { if (isDisabled) e.preventDefault(); }} aria-disabled={isDisabled} aria-current={isActive ? 'page' : undefined}>{item.label}</Link>
                  </Button>
                );
              })}
            </nav>
          )}
          <div className="flex items-center space-x-1">
            {/* Removed the outer `mounted &&` wrapper here, relying on props from RootLayout */}
            <Button variant="ghost" size="icon" onClick={toggleNameInputDialog} aria-label={isPersonalizationActive ? "Change personalized name" : "Personalize greeting"} className={cn(isPersonalizationActive && "text-primary")}>
              <Pencil className="h-[1.2rem] w-[1.2rem] transition-all duration-300 ease-in-out" />
            </Button>
            
            {isLightTheme && ( // This is the key condition for the screen drawing pencil
              <Button variant="ghost" size="icon" onClick={togglePencilMode} aria-label={isPencilModeActive ? "Disable Screen Drawing" : "Enable Screen Drawing"} className={cn(isPencilModeActive && "text-primary")}>
                <Edit3 className="h-[1.2rem] w-[1.2rem] transition-all duration-300 ease-in-out" />
              </Button>
            )}
            
            <Button variant="ghost" size="icon" onClick={toggleSoundEnabled} aria-label={isSoundEnabled ? "Mute sounds" : "Unmute sounds"}>
              {isSoundEnabled ? <Volume2 className="h-[1.2rem] w-[1.2rem]" /> : <VolumeX className="h-[1.2rem] w-[1.2rem]" />}
            </Button>
            
            {mounted && <ThemeSwitcher />} {/* ThemeSwitcher handles its own mounted state */}
          </div>
        </div>
      </header>

      <AlertDialog open={showPasswordDialog} onOpenChange={(isOpen) => { setShowPasswordDialog(isOpen); if (isOpen) updateLockoutStateFromStorage(); if (!isOpen) handlePasswordDialogClose(); }}>
        <AlertDialogContent>
          <form onSubmit={handlePasswordSubmitFormEvent}>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center">
                {showLockedUI ? <AlertTriangle className="mr-2 h-5 w-5 text-destructive" /> : <LockKeyhole className="mr-2 h-5 w-5 text-primary" />}
                {showLockedUI ? "Access Temporarily Disabled" : "Enter Secret Code"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {showLockedUI ? `Access to this feature has been temporarily disabled due to multiple incorrect attempts. Please try again after ${lockoutEndTime ? new Date(lockoutEndTime).toLocaleTimeString() : 'some time'}.` : "You've discovered a hidden path. Enter the password to proceed."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            {!showLockedUI && (
              <div className="py-4 relative">
                <Input type={showPasswordAttemptVisual ? "text" : "password"} placeholder="Password" value={passwordAttempt} onChange={(e) => setPasswordAttempt(e.target.value)} autoFocus className="pr-10" />
                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground" onClick={toggleShowPasswordAttemptVisual} aria-label={showPasswordAttemptVisual ? "Hide password" : "Show password"}>
                  {showPasswordAttemptVisual ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowPasswordDialog(false)} disabled={showLockedUI && lockoutEndTime !== null && Date.now() < lockoutEndTime}>{showLockedUI ? "Close" : "Cancel"}</AlertDialogCancel>
              {!showLockedUI && <Button type="submit">Unlock</Button>}
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showNameInputDialog} onOpenChange={(isOpen) => {
        if (!isOpen) {
            if (handwritingCanvasRef.current) {
                handwritingCanvasRef.current.clearCanvas();
            }
        }
        if (isOpen !== showNameInputDialog) { 
            toggleNameInputDialog();
        }
      }}>
        <DialogContent className="max-w-xs sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Draw Your Name</DialogTitle>
            <DialogDescription>
              Use your mouse or finger to write your name on the canvas below. 
              The AI will try to recognize it and detect the language.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 flex justify-center">
            <HandwritingCanvas ref={handwritingCanvasRef} width={280} height={110} />
          </div>
          <DialogFooter className="sm:justify-between items-center">
             <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => handwritingCanvasRef.current?.clearCanvas()}
              className="mt-2 sm:mt-0"
            >
              Clear Canvas
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveDrawnName}
              disabled={isRecognizingName}
              className="w-full sm:w-auto mt-2 sm:mt-0" 
            >
              {isRecognizingName ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isRecognizingName ? 'Recognizing...' : 'Save Drawn Name'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
