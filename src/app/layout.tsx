
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
  const { theme, resolvedTheme } = useTheme();
  const pathname = usePathname();

  useEffect(() => {
    setIsClient(true);
    console.log('RootLayout: isClient set to true');
  }, []);

  useEffect(() => {
    if (!isClient) return;
    console.log('RootLayout: Adding scroll listener');
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (scrollTop / docHeight);
      setScrollPercentage(isNaN(scrolled) || !isFinite(scrolled) ? 0 : scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); 

    return () => {
      console.log('RootLayout: Removing scroll listener');
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isClient]); 
  
  // Logging for theme states
  console.log('RootLayout Render: isClient is', isClient);
  console.log('RootLayout Render: rawTheme (from useTheme) is', theme);
  console.log('RootLayout Render: resolvedTheme is', resolvedTheme);

  const pathsToHide3DModel: string[] = []; 
  const shouldRenderThreeSceneOnPage = !pathsToHide3DModel.includes(pathname);
  
  const canRenderThreeScene = isClient && (resolvedTheme === 'light' || resolvedTheme === 'dark') && shouldRenderThreeSceneOnPage;
  const currentThemeForScene = (resolvedTheme === 'light' || resolvedTheme === 'dark') ? resolvedTheme : 'light';
  const threeSceneKey = resolvedTheme || 'initial-theme-key';

  console.log('RootLayout Render: canRenderThreeScene is', canRenderThreeScene);
  console.log('RootLayout Render: currentThemeForScene is', currentThemeForScene);
  console.log('RootLayout Render: Key for ThreeScene will be', threeSceneKey);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon22.png" type="image/png" sizes="any" />
      </head>
      <body className={cn(
          `${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen bg-background`,
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {canRenderThreeScene && (
            <Suspense fallback={<div style={{ height: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, zIndex: -1, backgroundColor: 'transparent' }} />}>
              <ThreeScene
                key={threeSceneKey} // Force re-mount on theme change
                scrollPercentage={scrollPercentage}
                currentTheme={currentThemeForScene}
              />
            </Suspense>
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
