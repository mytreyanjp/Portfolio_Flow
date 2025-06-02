
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

  const lightThemeSoundRef = useRef<HTMLAudioElement | null>(null);
  const darkThemeSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setIsClient(true);
    // Initialize Audio objects on client-side
    // IMPORTANT: Replace these paths with your actual sound file paths in /public/sounds/
    lightThemeSoundRef.current = new Audio('/sounds/light-theme-sound.mp3'); 
    darkThemeSoundRef.current = new Audio('/sounds/dark-theme-sound.mp3');

    // Optional: Set loop if you want continuous sound
    // if (lightThemeSoundRef.current) lightThemeSoundRef.current.loop = true;
    // if (darkThemeSoundRef.current) darkThemeSoundRef.current.loop = true;

    return () => {
      // Cleanup audio elements on unmount
      lightThemeSoundRef.current?.pause();
      darkThemeSoundRef.current?.pause();
      lightThemeSoundRef.current = null;
      darkThemeSoundRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (isClient && resolvedTheme) {
      if (resolvedTheme === 'dark') {
        lightThemeSoundRef.current?.pause();
        if (lightThemeSoundRef.current) lightThemeSoundRef.current.currentTime = 0;
        darkThemeSoundRef.current?.play().catch(e => console.warn("Dark theme sound playback failed. Browser autoplay policies might be active.", e));
      } else if (resolvedTheme === 'light') {
        darkThemeSoundRef.current?.pause();
        if (darkThemeSoundRef.current) darkThemeSoundRef.current.currentTime = 0;
        lightThemeSoundRef.current?.play().catch(e => console.warn("Light theme sound playback failed. Browser autoplay policies might be active.", e));
      }
    }
  }, [resolvedTheme, isClient]);


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
      }, 5000); // 5 seconds
    }
    return () => {
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [showMobileMessage]);

  const currentIsDarkTheme = resolvedTheme === 'dark';
  const showDarkThemeEffects = isClient && currentIsDarkTheme;
  const isLightNotebookTheme = isClient && !currentIsDarkTheme;


  return (
    <>
      {showDarkThemeEffects && <CursorTail isDarkTheme={currentIsDarkTheme} />}
      {showDarkThemeEffects && <FirefliesEffect isDarkTheme={currentIsDarkTheme} />}
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        <main className={cn(
            "flex-grow container mx-auto py-8",
            "px-4 pb-20 md:pb-8" // Default paddings for all themes
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
          "antialiased flex flex-col min-h-screen bg-background", // bg-background is applied here
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

