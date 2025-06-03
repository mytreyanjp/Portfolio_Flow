
'use client'; // Keep as client component for simplicity in this test

import React from 'react';
import { Button } from '@/components/ui/button'; // Keep a simple ShadCN import
import Link from 'next/link'; // Keep a simple Next.js import

console.log("page.tsx (Simplified for ISE Debug): Script start");

export default function PortfolioPage() {
  console.log("page.tsx: PortfolioPage (simplified for ISE debug) component rendering/mounting");
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-12 mt-8 text-center">
      <h1
        id="portfolio-page-main-heading"
        className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-transparent bg-clip-text mb-2"
        style={{
          backgroundImage:
            'radial-gradient(circle at center, hsl(var(--accent)) 5%, hsl(var(--primary)) 75%)',
        }}
      >
        Simplified Page
      </h1>
      <p className="text-lg text-muted-foreground mb-4">
        This is a simplified version of the portfolio page for debugging.
      </p>
      <p className="mb-4">
        If you no longer see the "Internal ServerError", the issue was likely in the
        original content of this page or the components it rendered (e.g., ProjectCard, ProjectFilter,
        data fetching with getProjects).
      </p>
      <p className="mb-8">
        If the "Internal Server Error" persists, the problem is likely in a more global file
        like <code>src/app/layout.tsx</code>, <code>next.config.ts</code>, or Firebase initialization.
      </p>
      <Link href="/contact">
        <Button variant="outline">Test Contact Page</Button>
      </Link>

      <div className="mt-12 p-6 bg-card border rounded-lg text-left">
        <h2 className="text-xl font-semibold mb-3">Next Steps:</h2>
        <p className="mb-2">
          <strong>Please check your Firebase App Hosting logs.</strong>
        </p>
        <p className="mb-2">
          It will contain the full, detailed error message and stack trace that reveals the exact cause of the "Internal Server Error", along with any console.log statements we've added.
        </p>
        <p>
          Copy and paste that full error log here so I can help you fix it.
        </p>
      </div>
    </div>
  );
}
