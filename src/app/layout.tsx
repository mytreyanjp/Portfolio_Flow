
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
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const percentage = scrollHeight > 0 ? currentScrollY / scrollHeight : 0;
      setScrollPercentage(Math.min(1, Math.max(0, percentage)));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initialize on mount

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isClient]);

  const currentThemeForScene: 'light' | 'dark' =
    (resolvedTheme === 'light' || resolvedTheme === 'dark') ? resolvedTheme : 'light'; 

  const threeSceneKey = resolvedTheme || 'initial-theme-key';
  
  const pathsToHide3DModel: string[] = []; // No paths to hide model, it's global
  const shouldRenderThreeSceneOnPage = !pathsToHide3DModel.includes(pathname);
  const shouldRenderThreeScene = isClient && shouldRenderThreeSceneOnPage && (resolvedTheme === 'light' || resolvedTheme === 'dark');

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
          <div className="relative z-10 flex flex-col min-h-screen">
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
