
'use client';

import './globals.css';
import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { useTheme } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { NameProvider } from '@/contexts/NameContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import localFont from 'next/font/local';
import { cn } from '@/lib/utils'; // Ensure this import is present

// import CursorTail from '@/components/effects/CursorTail';
// import FirefliesEffect from '@/components/effects/FirefliesEffect';
// import LightModeDrawingCanvas from '@/components/effects/LightModeDrawingCanvas';

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
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const [isPersonalizationActive, setIsPersonalizationActive] = useState(false);
  const [showNameInputDialog, setShowNameInputDialog] = useState(false);

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
  }, []);

  const toggleSoundEnabled = useCallback(() => {
    setIsSoundEnabled(prev => {
      const newState = !prev;
      localStorage.setItem('portfolioSoundEnabled', JSON.stringify(newState));
      return newState;
    });
  }, []);

  const toggleNameInputDialog = useCallback(() => {
    setShowNameInputDialog(prev => !prev);
  }, []);

  useEffect(() => {
    const storedName = localStorage.getItem('portfolioUserName');
    if (storedName) {
      setIsPersonalizationActive(true);
    } else {
      setIsPersonalizationActive(false);
    }
  }, [showNameInputDialog]);

  const isLightTheme = isClient && resolvedTheme === 'light';

  if (!isClient) {
    return (
      <html lang="en" className={cn(greaterTheory.variable, wastedVindey.variable, "h-full")}>
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
              <div className="relative flex min-h-screen flex-col">
                <Header
                  isSoundEnabled={isSoundEnabled}
                  toggleSoundEnabled={toggleSoundEnabled}
                  isPersonalizationActive={isPersonalizationActive}
                  toggleNameInputDialog={toggleNameInputDialog}
                  showNameInputDialog={showNameInputDialog}
                  isLightTheme={isLightTheme}
                />
                <main className="flex-1 container mx-auto px-4 py-8 md:py-12 mt-16 mb-16 md:mt-0 md:mb-0">
                  {children}
                </main>
                <Footer />
              </div>
              <Toaster />
              {/* <CursorTail isDarkTheme={resolvedTheme === 'dark'} /> */}
              {/* <FirefliesEffect isDarkTheme={resolvedTheme === 'dark'} /> */}
              {/* <LightModeDrawingCanvas isDrawingActive={isPencilModeActive} /> */}
            </NameProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
