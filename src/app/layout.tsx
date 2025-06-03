
'use client';

import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import React, { useState, useEffect, useRef, Suspense } from 'react';
// import { useTheme } from 'next-themes'; // Temporarily unused
// import dynamic from 'next/dynamic'; // Temporarily commented out as effects are already out
import { cn } from '@/lib/utils';
// import { usePathname } from 'next/navigation'; // Temporarily unused
// import localFont from 'next/font/local'; // Temporarily commented out
// import { useIsMobile } from '@/hooks/use-mobile'; // Temporarily unused
// import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; // Temporarily unused
// import { Terminal, X as XIcon, Laptop } from 'lucide-react'; // Temporarily unused
// import { NameProvider, useName } from '@/contexts/NameContext'; // Temporarily commented out
// import { AuthProvider } from '@/contexts/AuthContext'; // Temporarily commented out

// Temporarily commented out font loading
// const greaterTheory = localFont({
//   src: '../../public/fonts/GreaterTheory.otf',
//   variable: '--font-greater-theory',
//   display: 'swap',
//   preload: true, 
//   fallback: ['sans-serif'], 
// });

// const wastedVindey = localFont({
//   src: '../../public/fonts/Wasted-Vindey.ttf',
//   variable: '--font-wasted-vindey',
//   display: 'swap',
//   preload: true, 
//   fallback: ['sans-serif'], 
// });

// const CursorTail = dynamic(() => import('@/components/effects/CursorTail'), { ssr: false });
// const FirefliesEffect = dynamic(() => import('@/components/effects/FirefliesEffect'), { ssr: false });
// const LightModeDrawingCanvas = dynamic(() => import('@/components/effects/LightModeDrawingCanvas'), { ssr: false });


function MainContentWithTheme({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  // const { theme, resolvedTheme } = useTheme(); // Temporarily unused
  // const mobileStatus = useIsMobile(); // Temporarily unused
  // const [showMobileMessage, setShowMobileMessage] = useState(false); // Temporarily unused
  const [isSoundEnabled, setIsSoundEnabled] = useState(false); 
  // const { userName } = useName(); // Temporarily unused, NameProvider is commented out
  const [showNameInputDialog, setShowNameInputDialog] = useState(false);


  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setIsClient(true);
    // Minimal setup for sound, other effects and context dependencies removed for now
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


  // const currentIsDarkTheme = resolvedTheme === 'dark'; // Temporarily unused
  // const currentIsLightTheme = resolvedTheme === 'light'; // Temporarily unused
  // const isPersonalizationActive = !!userName; // Temporarily unused

  console.log("MainContentWithTheme rendering (simplified for ISE debugging)");

  return (
    <>
      {/* Visual effects like CursorTail, FirefliesEffect, LightModeDrawingCanvas are already commented out */}
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header 
          isSoundEnabled={isSoundEnabled} 
          toggleSoundEnabled={toggleSoundEnabled}
          isPersonalizationActive={false} // Simplified as NameProvider is out
          toggleNameInputDialog={toggleNameInputDialog}    
          showNameInputDialog={showNameInputDialog}         
          isLightTheme={false} // Simplified as useTheme logic is reduced
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
      {/* Mobile message alert temporarily removed as useIsMobile is out */}
    </>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  console.log("RootLayout rendering (simplified for ISE debugging)");
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon22.png" type="image/png" sizes="any" />
      </head>
      <body className={cn(
          "antialiased flex flex-col min-h-screen bg-background" 
          // Temporarily remove font variables: greaterTheory.variable, wastedVindey.variable 
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {/* <AuthProvider> */} {/* Temporarily commented out */}
            {/* <NameProvider> */} {/* Temporarily commented out */}
              <MainContentWithTheme>{children}</MainContentWithTheme>
            {/* </NameProvider> */}
          {/* </AuthProvider> */}
        </ThemeProvider>
      </body>
    </html>
  );
}
    
