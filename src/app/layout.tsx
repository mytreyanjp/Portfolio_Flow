
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
import { NameProvider, useName } from '@/contexts/NameContext';
import { AuthProvider } from '@/contexts/AuthContext'; // Added AuthProvider

const greaterTheory = localFont({
  src: '../../public/fonts/GreaterTheory.otf',
  variable: '--font-greater-theory',
  display: 'swap',
  preload: true, 
  fallback: ['sans-serif'], 
});

const wastedVindey = localFont({
  src: '../../public/fonts/Wasted-Vindey.ttf',
  variable: '--font-wasted-vindey',
  display: 'swap',
  preload: true, 
  fallback: ['sans-serif'], 
});

// const CursorTail = dynamic(() => import('@/components/effects/CursorTail'), { ssr: false });
// const FirefliesEffect = dynamic(() => import('@/components/effects/FirefliesEffect'), { ssr: false });
// const LightModeDrawingCanvas = dynamic(() => import('@/components/effects/LightModeDrawingCanvas'), { ssr: false });


function MainContentWithTheme({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  const { theme, resolvedTheme } = useTheme();
  const mobileStatus = useIsMobile();
  const [showMobileMessage, setShowMobileMessage] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false); 
  
  const { userName } = useName(); // Get userName from context
  const [showNameInputDialog, setShowNameInputDialog] = useState(false);


  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setIsClient(true);
    backgroundAudioRef.current = new Audio('/sounds/dark-theme-sound.mp3'); 
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.volume = 0.5;
      backgroundAudioRef.current.loop = true; 
    }

    const storedSoundPreference = localStorage.getItem('portfolioSoundEnabled');
    if (storedSoundPreference !== null) {
      setIsSoundEnabled(storedSoundPreference === 'true');
    } else {
      localStorage.setItem('portfolioSoundEnabled', String(false));
      setIsSoundEnabled(false); 
    }
    
    return () => {
      backgroundAudioRef.current?.pause();
      backgroundAudioRef.current = null;
    };
  }, []);

  const toggleSoundEnabled = () => {
    const newSoundState = !isSoundEnabled;
    setIsSoundEnabled(newSoundState);
    localStorage.setItem('portfolioSoundEnabled', String(newSoundState));
  };

  const toggleNameInputDialog = () => {
    setShowNameInputDialog(prev => !prev);
  };


  useEffect(() => {
    if (isClient && backgroundAudioRef.current) {
      if (isSoundEnabled) {
        backgroundAudioRef.current.play().catch(e => console.warn("Background sound playback failed.", e));
      } else {
        backgroundAudioRef.current.pause();
      }
    }
  }, [isSoundEnabled, isClient]);


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
  const currentIsLightTheme = resolvedTheme === 'light';
  // const showDarkThemeEffects = isClient && currentIsDarkTheme;
  // const showLightThemeEffects = isClient && currentIsLightTheme;
  const isPersonalizationActive = !!userName;


  return (
    <>
      {/* {showDarkThemeEffects && <CursorTail isDarkTheme={currentIsDarkTheme} />} */}
      {/* {showDarkThemeEffects && <FirefliesEffect isDarkTheme={currentIsDarkTheme} />} */}
      {/* {showLightThemeEffects && <LightModeDrawingCanvas isDrawingActive={false} />} */}
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header 
          isSoundEnabled={isSoundEnabled} 
          toggleSoundEnabled={toggleSoundEnabled}
          isPersonalizationActive={isPersonalizationActive} 
          toggleNameInputDialog={toggleNameInputDialog}    
          showNameInputDialog={showNameInputDialog}         
          isLightTheme={currentIsLightTheme}
        />
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
          <AuthProvider> {/* Added AuthProvider */}
            <NameProvider>
              <MainContentWithTheme>{children}</MainContentWithTheme>
            </NameProvider>
          </AuthProvider> {/* Added AuthProvider */}
        </ThemeProvider>
      </body>
    </html>
  );
}
    