
'use client';

import MrMChatInterface from '@/components/ai/MrMChatInterface';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

export default function MrMPage() {
  const headingRef = useRef<HTMLHeadingElement>(null); 

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
          ref={headingRef} 
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold text-transparent bg-clip-text relative overflow-hidden"
          style={{
            backgroundImage: 'radial-gradient(circle at var(--gradient-center-x, 50%) var(--gradient-center-y, 50%), hsl(var(--accent)) 10%, hsl(var(--primary)) 90%)',
          }}
        >
          Chat with Mr.M
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Your AI assistant for project-specific questions. Select a project below to begin!
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
          <li>Select a project from the list to start chatting with Mr.M about it.</li>
          <li>Mr.M has access to the details of the selected project.</li>
          <li>Ask questions like "What was the main challenge in this project?" or "What technologies were used?".</li>
          <li>Mr.M will do its best to answer based on the information available for that specific project and its general knowledge.</li>
          <li>Remember, as an AI, Mr.M may not always be perfectly accurate, so always double-check critical information.</li>
        </ul>
      </div>
    </div>
  );
}
