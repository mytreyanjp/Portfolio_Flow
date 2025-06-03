
'use client';

import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useTheme } from 'next-themes';
// import dynamic from 'next/dynamic'; // Visual effects still commented out
import { cn } from '@/lib/utils';
// import { usePathname } from 'next/navigation'; // Temporarily unused
import localFont from 'next/font/local'; // Restored
// import { useIsMobile } from '@/hooks/use-mobile'; // Temporarily unused
// import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; // Temporarily unused
// import { Terminal, X as XIcon, Laptop } from 'lucide-react'; // Temporarily unused
import { NameProvider, useName } from '@/contexts/NameContext'; // Restored
import { AuthProvider } from '@/contexts/AuthContext'; // Restored

// Custom fonts restored
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

// Visual effects still commented out
// const CursorTail = dynamic(() => import('@/components/effects/CursorTail'), { ssr: false });
// const FirefliesEffect = dynamic(() => import('@/components/effects/FirefliesEffect'), { ssr: false });
// const LightModeDrawingCanvas = dynamic(() => import('@/components/effects/LightModeDrawingCanvas'), { ssr: false });


function MainContentWithTheme({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  const { resolvedTheme } = useTheme(); // Restored
  // const mobileStatus = useIsMobile(); // Still commented out, as is the Alert that uses it
  // const [showMobileMessage, setShowMobileMessage] = useState(false); // Still commented out
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const { userName } = useName(); // Restored
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
    setIsSoundEnabled(storedSoundPreference === 'true');
    
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


  const currentIsLightTheme = resolvedTheme === 'light'; // Restored
  const isPersonalizationActive = !!userName; // Restored logic

  return (
    <>
      {/* Visual effects like CursorTail, FirefliesEffect, LightModeDrawingCanvas are still commented out */}
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header
          isSoundEnabled={isSoundEnabled}
          toggleSoundEnabled={toggleSoundEnabled}
          isPersonalizationActive={isPersonalizationActive} // Updated
          toggleNameInputDialog={toggleNameInputDialog}
          showNameInputDialog={showNameInputDialog}
          isLightTheme={currentIsLightTheme} // Updated
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
      {/* Mobile message alert still commented out */}
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
          // Custom font variables restored
          greaterTheory.variable, wastedVindey.variable
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AuthProvider> {/* Restored */}
            <NameProvider> {/* Restored */}
              <MainContentWithTheme>{children}</MainContentWithTheme>
            </NameProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
    
