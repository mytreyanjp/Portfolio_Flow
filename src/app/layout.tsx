
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

// Dynamically import CursorTail to ensure it's client-side only
const CursorTail = dynamic(() => import('@/components/effects/CursorTail'), { ssr: false });


function MainContentWithTheme({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  const { theme, resolvedTheme } = useTheme();
  const isMobile = useIsMobile();
  const [showMobileMessage, setShowMobileMessage] = useState(false);

  useEffect(() => {
    setIsClient(true);
    console.log('[MainContentWithTheme] useEffect: isClient set to true');
  }, []);

  useEffect(() => {
    console.log('[MainContentWithTheme] useEffect: resolvedTheme changed to:', resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    if (isClient && isMobile) {
      // Check if the message has been dismissed before
      const dismissed = localStorage.getItem('dismissedMobileMessage');
      if (!dismissed) {
        setShowMobileMessage(true);
      }
    } else {
      setShowMobileMessage(false);
    }
  }, [isClient, isMobile]);

  const handleDismissMobileMessage = () => {
    setShowMobileMessage(false);
    localStorage.setItem('dismissedMobileMessage', 'true');
  };


  console.log('[MainContentWithTheme] RENDER: isClient is', isClient);
  console.log('[MainContentWithTheme] RENDER: rawTheme (from useTheme) is', theme);
  console.log('[MainContentWithTheme] RENDER: resolvedTheme is', resolvedTheme);

  const currentIsDarkTheme = resolvedTheme === 'dark';
  console.log('[MainContentWithTheme] RENDER: currentIsDarkTheme evaluates to:', currentIsDarkTheme);
  
  const showCursorTail = isClient && currentIsDarkTheme;
  console.log(`[RootLayout] RENDER: showCursorTail is ${showCursorTail}, isClient is ${isClient}, resolvedTheme is ${resolvedTheme}`);
  

  return (
    <>
      {showCursorTail && <CursorTail isDarkTheme={currentIsDarkTheme} />}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 pb-20 md:pb-8">
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
  console.log('[RootLayout] RENDER: RootLayout component is rendering.');

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
