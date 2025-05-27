
'use client';

// import type { Metadata } from 'next'; // Metadata typically in server components or static
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
  const { theme: rawTheme, resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();

  useEffect(() => {
    setIsClient(true);
    console.log('RootLayout: isClient set to true');
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const percentage = scrollHeight > 0 ? currentScrollY / scrollHeight : 0;
      setScrollPercentage(Math.min(1, Math.max(0, percentage)));
    };
    console.log('RootLayout: Adding scroll listener');
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initialize on mount

    return () => {
      console.log('RootLayout: Removing scroll listener');
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isClient]);
  
  // Logging for theme states
  console.log('RootLayout Render: isClient is', isClient);
  console.log('RootLayout Render: rawTheme (from useTheme) is', rawTheme);
  console.log('RootLayout Render: resolvedTheme is', resolvedTheme);

  const canRenderThreeScene = isClient; // Render as soon as client is ready
  const currentThemeForScene = (resolvedTheme === 'light' || resolvedTheme === 'dark') ? resolvedTheme : 'light'; // Default to 'light' if undefined
  const threeSceneKey = resolvedTheme || 'initial-theme-key'; // Key changes when resolvedTheme becomes defined

  console.log('RootLayout Render: canRenderThreeScene is', canRenderThreeScene);
  console.log('RootLayout Render: currentThemeForScene is', currentThemeForScene);
  console.log('RootLayout Render: Key for ThreeScene will be', threeSceneKey);
  
  const pathsToHide3DModel: string[] = []; 
  const shouldRenderThreeSceneOnPage = !pathsToHide3DModel.includes(pathname);
  const shouldRenderThreeScene = canRenderThreeScene && shouldRenderThreeSceneOnPage;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
          `${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen bg-background`,
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {shouldRenderThreeScene && (
            <ThreeScene
              key={threeSceneKey}
              scrollPercentage={scrollPercentage}
              currentTheme={currentThemeForScene}
            />
          )}
          <div className="relative z-10 flex flex-col min-h-screen"> {/* Content on top */}
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
