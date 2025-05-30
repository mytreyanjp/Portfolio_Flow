
'use client';

import { Geist_Sans, Geist_Mono } from 'next/font/google'; // Changed: Removed 'as Geist' alias
import { Lobster, Poppins } from 'next/font/google'; // Import new fonts
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

const CursorTail = dynamic(() => import('@/components/effects/CursorTail'), { ssr: false });

const geistSans = Geist_Sans({ // Changed: Used Geist_Sans directly
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Initialize custom fonts
const lobster = Lobster({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-lobster', // CSS variable
  display: 'swap',
});

const poppins = Poppins({
  weight: ['400', '600', '700'], // Specify needed weights
  subsets: ['latin'],
  variable: '--font-poppins', // CSS variable
  display: 'swap',
});

function MainContentWithTheme({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  const { theme, resolvedTheme } = useTheme();

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
  
  // Condition to render CursorTail: only on client and when theme is resolved
  const showCursorTail = isClient && (resolvedTheme === 'light' || resolvedTheme === 'dark');

  return (
    <>
      {showCursorTail && <CursorTail isDarkTheme={currentIsDarkTheme} />}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        {/* Responsive bottom padding: pb-20 for small screens (footer visible), pb-8 for md+ (footer hidden) */}
        <main className="flex-grow container mx-auto px-4 py-8 pb-20 md:pb-8">
          {children}
        </main>
        <Footer /> {/* This is now the mobile-only navigation footer */}
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
          `${geistSans.variable} ${geistMono.variable} ${lobster.variable} ${poppins.variable} antialiased flex flex-col min-h-screen bg-background`, // Add new font variables
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <MainContentWithTheme>{children}</MainContentWithTheme>
        </ThemeProvider>
      </body>
    </html>
  );
}
