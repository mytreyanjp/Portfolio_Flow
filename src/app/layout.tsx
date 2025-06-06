
'use client';

import './globals.css';
import React, { useState, useEffect, useCallback, type ReactNode, useRef } from 'react';
import { useTheme } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { NameProvider } from '@/contexts/NameContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import localFont from 'next/font/local';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

import CursorTail from '@/components/effects/CursorTail';
import FirefliesEffect from '@/components/effects/FirefliesEffect';

const greaterTheory = localFont({
  src: '../../public/fonts/GreaterTheory.otf',
  display: 'swap',
  variable: '--font-greater-theory',
});

const wastedVindey = localFont({
  src: '../../public/fonts/Wasted-Vindey.ttf',
  display: 'swap',
  variable: '--font-wasted-vindey',
});

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isClient, setIsClient] = useState(false);
  const { resolvedTheme } = useTheme(); 
  const { toast } = useToast(); 

  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const [isPersonalizationActive, setIsPersonalizationActive] = useState(false);
  const [showNameInputDialog, setShowNameInputDialog] = useState(false);
  
  const clickSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setIsClient(true);
    const storedSoundPref = localStorage.getItem('portfolioSoundEnabled');
    if (storedSoundPref) {
      setIsSoundEnabled(JSON.parse(storedSoundPref));
    }
    const storedName = localStorage.getItem('portfolioUserName');
    if (storedName) {
      setIsPersonalizationActive(true);
    }

    // Initialize the Audio object on the client
    if (typeof Audio !== "undefined") {
      clickSoundRef.current = new Audio('/sounds/dark-theme-sound.mp3');
      clickSoundRef.current.preload = 'auto';
    }

  }, []);

  const toggleSoundEnabled = useCallback(() => {
    // Toggle the state first
    const newSoundState = !isSoundEnabled;
    setIsSoundEnabled(newSoundState);
    localStorage.setItem('portfolioSoundEnabled', JSON.stringify(newSoundState));

    // Only play sound if it was just turned ON
    if (newSoundState && clickSoundRef.current) {
      clickSoundRef.current.currentTime = 0; // Rewind to start
      clickSoundRef.current.play().catch(error => {
        if (error.name === 'NotSupportedError' || error.message.includes('failed to load')) {
          console.error(
            "Audio play failed. Ensure '/sounds/dark-theme-sound.mp3' exists in the 'public/sounds/' folder and is a valid audio file.",
            error
          );
           toast({ title: "Audio Error", description: "Sound file '/sounds/dark-theme-sound.mp3' missing or invalid.", variant: "destructive" });
        } else {
          console.warn("Audio play failed for dark-theme-sound.mp3:", error);
        }
      });
    }
  }, [isSoundEnabled, toast]);

  const toggleNameInputDialog = useCallback(() => {
    setShowNameInputDialog(prev => !prev);
  }, []);

  useEffect(() => {
    if (isClient) {
      console.log('RootLayout: Current resolved theme:', resolvedTheme);
    }
  }, [resolvedTheme, isClient]);

  useEffect(() => {
    const storedName = localStorage.getItem('portfolioUserName');
    if (storedName) {
      setIsPersonalizationActive(true);
    } else {
      setIsPersonalizationActive(false);
    }
  }, [showNameInputDialog]); 


  if (!isClient) {
    return (
      <html lang="en" className={cn(greaterTheory.variable, wastedVindey.variable, "h-full")}>
        <head>
          <title>PortfolioFlow</title>
          <meta name="description" content="PortfolioFlow App" />
          <link rel="icon" href="/favicon22.png" type="image/png" sizes="any" />
          <link rel="apple-touch-icon" href="/favicon22.png" type="image/png" />
        </head>
        <body className="h-full">
          {/* Simple loading placeholder for SSR or initial client render */}
        </body>
      </html>
    );
  }
  
  return (
    <html lang="en" className={cn(greaterTheory.variable, wastedVindey.variable, "h-full")}>
      <head>
         <title>PortfolioFlow</title>
         <meta name="description" content="PortfolioFlow App" />
         <link rel="icon" href="/favicon22.png" type="image/png" sizes="any" />
         <link rel="apple-touch-icon" href="/favicon22.png" type="image/png" />
      </head>
      <body className="h-full bg-background text-foreground font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <NameProvider>
              <div className="relative flex min-h-screen flex-col z-[10]"> {/* Added z-[10] */}
                <Header
                  isSoundEnabled={isSoundEnabled}
                  toggleSoundEnabled={toggleSoundEnabled}
                  isPersonalizationActive={isPersonalizationActive}
                  toggleNameInputDialog={toggleNameInputDialog}
                  showNameInputDialog={showNameInputDialog}
                />
                <main className="flex-1 container mx-auto px-4 py-28 md:py-36 mt-16 mb-16">
                  {children}
                </main>
                <Footer />
              </div>
              <Toaster />
              <CursorTail />
              <FirefliesEffect />
            </NameProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
