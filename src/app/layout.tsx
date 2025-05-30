
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

// CRUCIAL: Ensure your font file GreaterTheory.otf exists at the path:
// /home/user/studio/public/fonts/GreaterTheory.otf
const greaterTheory = localFont({
  src: [
    {
      path: '../../public/fonts/GreaterTheory.otf', // Path relative to this file (src/app/layout.tsx)
      weight: '400', // Adjust if your font has a different default weight
      style: 'normal', // Adjust if your font has a different default style
    },
  ],
  variable: '--font-greater-theory',
  display: 'swap',
});

// Dynamically import CursorTail to ensure it's client-side only
const CursorTail = dynamic(() => import('@/components/effects/CursorTail'), { ssr: false });


function MainContentWithTheme({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  const { theme, resolvedTheme } = useTheme(); // theme is the setting, resolvedTheme is what's active

  useEffect(() => {
    setIsClient(true);
    console.log('[MainContentWithTheme] useEffect: isClient set to true');
  }, []);

  useEffect(() => {
    console.log('[MainContentWithTheme] useEffect: resolvedTheme changed to:', resolvedTheme);
  }, [resolvedTheme]);

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
          greaterTheory.variable // Apply the font variable to the body
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <MainContentWithTheme>{children}</MainContentWithTheme>
        </ThemeProvider>
      </body>
    </html>
  );
}
