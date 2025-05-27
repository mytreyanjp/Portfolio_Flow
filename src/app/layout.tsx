
'use client';

// import type { Metadata } from 'next'; // Metadata typically in server components or static
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import React, { useState, useEffect } from 'react'; // Removed useRef as scroll listener is moved
// import { useTheme } from 'next-themes'; // Theme logic remains for UI
// import dynamic from 'next/dynamic'; // ThreeScene import removed
import { cn } from '@/lib/utils';
// import { usePathname } from 'next/navigation'; // Pathname logic for hiding scene removed

// const ThreeScene = dynamic(() => import('@/components/portfolio/ThreeScene'), {
//   ssr: false,
//   loading: () => <div style={{ height: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, zIndex: -1, backgroundColor: 'transparent' }} />,
// });

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
  // scrollPercentage state and effect removed from here
  const [isClient, setIsClient] = useState(false);
  // const { theme: rawTheme, resolvedTheme } = useTheme(); // resolvedTheme no longer needed here for ThreeScene
  // const pathname = usePathname(); // No longer needed for ThreeScene logic

  useEffect(() => {
    setIsClient(true);
    console.log('RootLayout: isClient set to true');
  }, []);

  // scroll listener useEffect removed

  // Logging for theme states - kept for UI theme debugging if needed
  // console.log('RootLayout Render: isClient is', isClient);
  // console.log('RootLayout Render: rawTheme (from useTheme) is', rawTheme);
  // console.log('RootLayout Render: resolvedTheme is', resolvedTheme);

  // ThreeScene related variables and logic removed
  // const currentThemeForScene = (resolvedTheme === 'light' || resolvedTheme === 'dark') ? resolvedTheme : 'light';
  // const threeSceneKey = resolvedTheme || 'initial-theme-key';

  // console.log('RootLayout Render: canRenderThreeScene conditions will be handled in page.tsx');
  // console.log('RootLayout Render: currentThemeForScene for global scene was', currentThemeForScene);
  // console.log('RootLayout Render: Key for ThreeScene for global scene was', threeSceneKey);
  
  // const pathsToHide3DModel: string[] = []; // This logic is no longer needed here
  // const shouldRenderThreeSceneOnPage = !pathsToHide3DModel.includes(pathname);
  // const canRenderThreeScene = isClient && (resolvedTheme === 'light' || resolvedTheme === 'dark') && shouldRenderThreeSceneOnPage;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
          `${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen bg-background`,
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {/* ThreeScene rendering removed from here */}
          {/* The main content wrapper. If ThreeScene is page-specific,
              this div's z-index relative to a page-specific ThreeScene needs to be managed by the page.
              For now, keeping it simple. */}
          <div className="flex flex-col min-h-screen"> {/* Removed relative z-10 for now, page will handle its bg */}
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
