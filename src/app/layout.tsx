
'use client';

import { Geist, Geist_Mono } from 'next/font/google';
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

// Dynamically import CursorTail to ensure it's client-side only
const CursorTail = dynamic(() => import('@/components/effects/CursorTail'), { ssr: false });


const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isClient, setIsClient] = useState(false);
  const { theme, resolvedTheme } = useTheme(); 

  useEffect(() => {
    setIsClient(true);
    console.log('[RootLayout] useEffect: isClient set to true');
  }, []);
  
  useEffect(() => {
    // This log will show when resolvedTheme changes or is initially set
    console.log('[RootLayout] useEffect: resolvedTheme changed to:', resolvedTheme);
  }, [resolvedTheme]);

  // Render phase logs
  console.log('[RootLayout] RENDER: isClient is', isClient);
  console.log('[RootLayout] RENDER: rawTheme (from useTheme) is', theme);
  console.log('[RootLayout] RENDER: resolvedTheme is', resolvedTheme);

  // Determine if CursorTail should be shown based on theme
  // CursorTail is only shown if it's client-side AND the theme is dark.
  const showCursorTail = isClient && resolvedTheme === 'dark';

  if (isClient) { // Only log this part if we are on the client
    console.log(`[RootLayout] RENDER: showCursorTail condition evaluates to: ${showCursorTail} (isClient: ${isClient}, resolvedTheme: ${resolvedTheme})`);
    if (showCursorTail) {
      console.log(`[RootLayout] About to render CursorTail because resolvedTheme is: "${resolvedTheme}"`);
    } else {
      console.log(`[RootLayout] NOT rendering CursorTail. resolvedTheme is: "${resolvedTheme}" (needs to be 'dark' and client-side)`);
    }
  }


  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon22.png" type="image/png" sizes="any" />
      </head>
      <body className={cn(
          `${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen bg-background`,
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {showCursorTail && (
            <CursorTail key={resolvedTheme} isDarkTheme={resolvedTheme === 'dark'} />
          )}
          <div className="relative z-10 flex flex-col min-h-screen"> {/* Content wrapper above background */}
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
              {children}
            </main>
            <Footer />
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
