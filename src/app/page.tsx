
'use client'; // Keep as client component for simplicity in this test

import React from 'react';

export default function PortfolioPage() {
  return (
    <div>
      <h1>Minimal Page for ISE Debug</h1>
      <p>If you see this, the basic Next.js rendering is working.</p>
      <p>
        If you still get an "Internal Server Error", the problem is likely in
        Firebase configuration, Next.js build, or server environment variables.
        Please check Firebase App Hosting logs for detailed errors.
      </p>
    </div>
  );
}
