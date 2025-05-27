
'use client';

// import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';

const ThreeScene = dynamic(() => import('@/components/portfolio/ThreeScene'), {
  ssr: false,
  loading: () => <div style={{ height: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, zIndex: -1, backgroundColor: 'transparent' }} />,
});

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
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const { theme: rawTheme, resolvedTheme } = useTheme(); // theme is raw, resolvedTheme is the actual applied theme

  useEffect(() => {
    setIsClient(true);
    // console.log("RootLayout useEffect: isClient set to true");
  }, []);

  useEffect(() => {
    if (!isClient) return;
    // console.log("RootLayout useEffect: Adding scroll listener");

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const percentage = scrollHeight > 0 ? currentScrollY / scrollHeight : 0;
      setScrollPercentage(Math.min(1, Math.max(0, percentage)));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initialize on mount

    return () => {
      // console.log("RootLayout useEffect: Removing scroll listener");
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isClient]);

  // console.log("RootLayout Render: isClient is", isClient);
  // console.log("RootLayout Render: rawTheme (from useTheme) is", rawTheme);
  // console.log("RootLayout Render: resolvedTheme is", resolvedTheme);

  // Determine if ThreeScene can be rendered and what theme to pass
  const canRenderThreeScene = isClient && (resolvedTheme === 'light' || resolvedTheme === 'dark');
  const currentThemeForScene: 'light' | 'dark' =
    (resolvedTheme === 'light' || resolvedTheme === 'dark') ? resolvedTheme : 'light'; // Default to 'light' if undefined briefly

  // console.log("RootLayout Render: canRenderThreeScene is", canRenderThreeScene);
  // console.log("RootLayout Render: currentThemeForScene is", currentThemeForScene);
  // console.log("RootLayout Render: Key for ThreeScene will be", resolvedTheme || 'initial-theme-key');
  
  const currentHtmlClass = resolvedTheme || ''; 

  return (
    <html lang="en" suppressHydrationWarning className={currentHtmlClass}>
      <body className={cn(
          `${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen bg-background`,
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {canRenderThreeScene && (
            <ThreeScene
              key={resolvedTheme || 'initial-theme-key'} // Force remount on theme change
              scrollPercentage={scrollPercentage}
              currentTheme={currentThemeForScene}
            />
          )}
          <div className="relative z-10 flex flex-col min-h-screen"> {/* Content must be above ThreeScene */}
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
