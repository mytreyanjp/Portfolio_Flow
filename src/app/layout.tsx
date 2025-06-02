
'use client';

import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import localFont from 'next/font/local';
import { useIsMobile } from '@/hooks/use-mobile';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, X as XIcon, Laptop } from 'lucide-react';

// CRUCIAL: Ensure your font file GreaterTheory.otf exists at the path:
// /home/user/studio/public/fonts/GreaterTheory.otf
const greaterTheory = localFont({
  src: '../../public/fonts/GreaterTheory.otf',
  variable: '--font-greater-theory',
  display: 'swap',
});

// CRUCIAL: Ensure your font file Wasted-Vindey.ttf exists at the path:
// /home/user/studio/public/fonts/Wasted-Vindey.ttf
const wastedVindey = localFont({
  src: '../../public/fonts/Wasted-Vindey.ttf',
  variable: '--font-wasted-vindey',
  display: 'swap',
});

const CursorTail = dynamic(() => import('@/components/effects/CursorTail'), { ssr: false });
const FirefliesEffect = dynamic(() => import('@/components/effects/FirefliesEffect'), { ssr: false });


function MainContentWithTheme({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  const { theme, resolvedTheme } = useTheme();
  const mobileStatus = useIsMobile();
  const [showMobileMessage, setShowMobileMessage] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false); // Changed default to false

  const lightThemeSoundRef = useRef<HTMLAudioElement | null>(null);
  const darkThemeSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setIsClient(true);
    // Initialize Audio objects on client-side
    lightThemeSoundRef.current = new Audio('/sounds/dark-theme-sound.mp3'); 
    if (lightThemeSoundRef.current) {
      lightThemeSoundRef.current.volume = 0.5;
      lightThemeSoundRef.current.loop = true; 
    }
    darkThemeSoundRef.current = new Audio('/sounds/dark-theme-sound.mp3');
    if (darkThemeSoundRef.current) {
      darkThemeSoundRef.current.volume = 0.5;
      darkThemeSoundRef.current.loop = true;
    }


    // Load sound preference from localStorage
    const storedSoundPreference = localStorage.getItem('portfolioSoundEnabled');
    if (storedSoundPreference !== null) {
      setIsSoundEnabled(storedSoundPreference === 'true');
    }

    return () => {
      lightThemeSoundRef.current?.pause();
      darkThemeSoundRef.current?.pause();
      lightThemeSoundRef.current = null;
      darkThemeSoundRef.current = null;
    };
  }, []);

  const toggleSoundEnabled = () => {
    setIsSoundEnabled(prev => {
      const newState = !prev;
      localStorage.setItem('portfolioSoundEnabled', String(newState));
      if (!newState) { // If sound is being disabled, pause sounds
        lightThemeSoundRef.current?.pause();
        // No need to reset currentTime if loop is true, it will restart from beginning on next play
        darkThemeSoundRef.current?.pause();
      } else {
        // If sound is being re-enabled, play the current theme's sound
        if (resolvedTheme === 'dark') {
          darkThemeSoundRef.current?.play().catch(e => console.warn("Dark theme sound playback failed.", e));
        } else if (resolvedTheme === 'light') {
          lightThemeSoundRef.current?.play().catch(e => console.warn("Light theme sound playback failed.", e));
        }
      }
      return newState;
    });
  };

  useEffect(() => {
    if (isClient && resolvedTheme && isSoundEnabled) {
      if (resolvedTheme === 'dark') {
        lightThemeSoundRef.current?.pause();
        // if (lightThemeSoundRef.current) lightThemeSoundRef.current.currentTime = 0; // Not needed for looping
        darkThemeSoundRef.current?.play().catch(e => console.warn("Dark theme sound playback failed.", e));
      } else if (resolvedTheme === 'light') {
        darkThemeSoundRef.current?.pause();
        // if (darkThemeSoundRef.current) darkThemeSoundRef.current.currentTime = 0; // Not needed for looping
        lightThemeSoundRef.current?.play().catch(e => console.warn("Light theme sound playback failed.", e));
      }
    } else if (!isSoundEnabled) { // Ensure sounds are paused if sound is globally disabled
        lightThemeSoundRef.current?.pause();
        darkThemeSoundRef.current?.pause();
    }
  }, [resolvedTheme, isClient, isSoundEnabled]);


  useEffect(() => {
    if (isClient && mobileStatus === true) {
      const dismissed = localStorage.getItem('dismissedMobileMessage');
      if (!dismissed) {
        setShowMobileMessage(true);
      }
    } else if (isClient && mobileStatus === false) {
      setShowMobileMessage(false);
    }
  }, [isClient, mobileStatus]);

  const handleDismissMobileMessage = () => {
    setShowMobileMessage(false);
    localStorage.setItem('dismissedMobileMessage', 'true');
  };

  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout> | undefined;
    if (showMobileMessage) {
      timerId = setTimeout(() => {
        handleDismissMobileMessage();
      }, 5000); 
    }
    return () => {
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [showMobileMessage]);

  const currentIsDarkTheme = resolvedTheme === 'dark';
  const showDarkThemeEffects = isClient && currentIsDarkTheme;

  return (
    <>
      {showDarkThemeEffects && <CursorTail isDarkTheme={currentIsDarkTheme} />}
      {showDarkThemeEffects && <FirefliesEffect isDarkTheme={currentIsDarkTheme} />}
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header isSoundEnabled={isSoundEnabled} toggleSoundEnabled={toggleSoundEnabled} />
        <main className={cn(
            "flex-grow container mx-auto py-8",
            "px-4 pb-20 md:pb-8" 
          )}
        >
          {children}
        </main>
        <Footer />
      </div>
      <Toaster />
      {showMobileMessage && (
        <Alert
          variant="default"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 w-11/12 max-w-md p-4 shadow-lg z-50 bg-card border-border/60"
        >
          <Laptop className="h-5 w-5 text-primary" />
          <AlertTitle className="font-semibold ml-2">Optimal Viewing Experience</AlertTitle>
          <AlertDescription className="ml-2 text-sm">
            For the best experience with all interactive features, we recommend viewing this site on a desktop or larger screen.
          </AlertDescription>
          <button
            onClick={handleDismissMobileMessage}
            className="absolute top-2 right-2 p-1 rounded-md hover:bg-muted/20 transition-colors"
            aria-label="Dismiss message"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </Alert>
      )}
    </>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon22.png" type="image/png" sizes="any" />
      </head>
      <body className={cn(
          "antialiased flex flex-col min-h-screen bg-background", 
          greaterTheory.variable, 
          wastedVindey.variable 
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <MainContentWithTheme>{children}</MainContentWithTheme>
        </ThemeProvider>
      </body>
    </html>
  );
}

