
'use client';

import MrMChatInterface from '@/components/ai/MrMChatInterface';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react'; // Added imports

export default function MrMPage() {
  const headingRef = useRef<HTMLHeadingElement>(null); // Ref for the heading

  // Effect for cursor-interactive gradient
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (headingRef.current) {
        const gradientX = (event.clientX / window.innerWidth) * 100;
        const gradientY = (event.clientY / window.innerHeight) * 100;
        headingRef.current.style.setProperty('--gradient-center-x', `${gradientX}%`);
        headingRef.current.style.setProperty('--gradient-center-y', `${gradientY}%`);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <header className="text-center mb-12">
        <Bot className="h-16 w-16 text-primary mx-auto mb-4 animate-bounce" />
        <h1
          ref={headingRef} // Added ref
          className="text-4xl font-display font-bold text-transparent bg-clip-text relative overflow-hidden" // Added relative and overflow-hidden
          style={{
            // Updated backgroundImage to use CSS variables
            backgroundImage: 'radial-gradient(circle at var(--gradient-center-x, 50%) var(--gradient-center-y, 50%), hsl(var(--accent)) 10%, hsl(var(--primary)) 90%)',
          }}
        >
          Chat with Mr.M
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Ask me anything about Mytreyan's projects!
        </p>
      </header>

      <Card className="shadow-xl">
        <CardContent className="pt-6">
          <MrMChatInterface />
        </CardContent>
      </Card>

      <div className="mt-10 p-6 bg-card border border-border rounded-lg shadow-md text-sm text-muted-foreground">
        <h3 className="text-lg font-semibold text-foreground mb-3">How it works:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Mr.M has access to information about Mytreyan's portfolio projects.</li>
          <li>Ask questions like "Tell me about the portfolio project" or "What technologies were used in the AI Intro Generator?".</li>
          <li>Mr.M will do its best to answer based on the project data available.</li>
          <li>If you ask something outside of project details, Mr.M might not be able to help.</li>
        </ul>
      </div>
    </div>
  );
}
