
import './globals.css'; // Keep globals for basic styling if any
import React from 'react';

// Minimal metadata for debugging
export const metadata = {
  title: 'PortfolioFlow Debug ISE',
  description: 'Debugging Internal Server Error for PortfolioFlow - Min Layout',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
