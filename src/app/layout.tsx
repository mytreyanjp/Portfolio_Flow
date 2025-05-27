
'use client'; // Make layout a client component to use hooks

// import type { Metadata } from 'next'; // Metadata can still be defined, but in a client component, it's more for static parts or needs specific handling for dynamic updates.
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';

// Dynamically import ThreeScene to ensure it's client-side only
const ThreeScene = dynamic(() => import('@/components/portfolio/ThreeScene'), {
  ssr: false,
  // Placeholder for ThreeScene during dynamic import, covers the screen
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

// Static metadata can be here. For dynamic, you'd use useMetadata or other patterns.
// export const metadata: Metadata = { // This is problematic in client components for dynamic titles per page
//   title: {
//     default: 'PortfolioFlow',
//     template: '%s | PortfolioFlow',
//   },
//   description: 'Interactive 3D portfolio showcasing projects and skills.',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const { resolvedTheme } = useTheme(); // resolvedTheme can be undefined initially

  useEffect(() => {
    setIsClient(true);
    console.log("RootLayout: isClient set to true");
  }, []);

  useEffect(() => {
    if (!isClient) return; // Only run scroll listener on client
    console.log("RootLayout: Adding scroll listener");

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const percentage = scrollHeight > 0 ? currentScrollY / scrollHeight : 0;
      setScrollPercentage(Math.min(1, Math.max(0, percentage)));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initialize on mount

    return () => {
      console.log("RootLayout: Removing scroll listener");
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isClient]);

  useEffect(() => {
    // This log helps debug the resolvedTheme value
    if (isClient) {
      console.log("RootLayout: resolvedTheme is", resolvedTheme);
    }
  }, [isClient, resolvedTheme]);

  // Determine if ThreeScene can be rendered
  const canRenderThreeScene = isClient && (resolvedTheme === 'light' || resolvedTheme === 'dark');

  return (
    <html lang="en" suppressHydrationWarning className={resolvedTheme || ''}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen bg-background`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {canRenderThreeScene && (
            <ThreeScene
              key={resolvedTheme} /* Force re-mount on theme change */
              scrollPercentage={scrollPercentage}
              currentTheme={resolvedTheme as ('light' | 'dark')} // We've ensured it's 'light' or 'dark'
            />
          )}
          <div className="relative z-10 flex flex-col min-h-screen"> {/* Wrapper to sit above ThreeScene */}
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
