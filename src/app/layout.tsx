
import './globals.css'; // Keep globals for basic styling if any
import React from 'react';

// Minimal metadata for debugging
export const metadata = {
  title: 'PortfolioFlow Debug',
  description: 'Debugging Internal Server Error for PortfolioFlow',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  console.log("layout.tsx: Simplified RootLayout rendering now.");
  return (
    <html lang="en">
      <body>
        {/* Removed ThemeProvider, AuthProvider, NameProvider, Header, Footer, MainContentWithTheme */}
        {children}
      </body>
    </html>
  );
}
