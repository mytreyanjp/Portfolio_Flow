
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
    console.log('[RootLayout] useEffect: resolvedTheme changed to:', resolvedTheme);
  }, [resolvedTheme]);

  // Render phase logs
  console.log('[RootLayout] RENDER: isClient is', isClient);
  console.log('[RootLayout] RENDER: rawTheme (from useTheme) is', theme);
  console.log('[RootLayout] RENDER: resolvedTheme is', resolvedTheme);
  
  const currentIsDarkTheme = resolvedTheme === 'dark';
  console.log('[RootLayout] RENDER: currentIsDarkTheme evaluates to:', currentIsDarkTheme);


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
          {isClient && (
            <CursorTail key={resolvedTheme || 'cursor-tail-default-key'} isDarkTheme={currentIsDarkTheme} />
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
