
'use client';

import type { Metadata } from 'next';
import AiIntroGeneratorForm from '@/components/ai/AiIntroGeneratorForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export default function AiIntroPage() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const { clientX, clientY } = event;
      const x = (clientX / window.innerWidth - 0.5) * 2;
      const y = (clientY / window.innerHeight - 0.5) * 2;
      const sensitivity = 10; 
      setParallaxOffset({ x: x * sensitivity, y: y * sensitivity });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const parallaxStyle = {
    transform: `translate(${parallaxOffset.x}px, ${parallaxOffset.y}px)`,
    transition: 'transform 0.1s ease-out',
  };
  

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
    };

    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, observerOptions);

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);
  

  return (
    <div 
      ref={sectionRef}
      className={cn(
        "max-w-3xl mx-auto py-8 transition-all duration-700 ease-in-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      )}
    >
      <header className="text-center mb-12">
        <div> 
          <Sparkles className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
          <h1 
            id="ai-intro-page-main-heading"
            className="text-4xl font-bold text-transparent bg-clip-text mb-4 heading-hover-reveal relative overflow-hidden" // font-title removed
            style={{
              ...parallaxStyle,
              backgroundImage: 'radial-gradient(circle at center, hsl(var(--accent)) 10%, hsl(var(--primary)) 90%)',
            }}
          >
            AI-Powered Introduction Generator
          </h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Craft the perfect first impression. Let AI help you create tailored introductory messages 
          for potential employers.
        </p>
      </header>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-foreground">Generate Your Custom Intro</CardTitle> {/* font-title removed */}
          <CardDescription>
            Provide some details about yourself and the job you're applying for, 
            and our AI will whip up a personalized message.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AiIntroGeneratorForm />
        </CardContent>
      </Card>
      
      <div className="mt-10 p-6 bg-card border border-border rounded-lg shadow-md">
        <h3 
          className="text-xl font-semibold text-foreground mb-3" // font-title removed
        >
          How it Works:
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-foreground/80">
          <li>Enter the employer's name and the job title.</li>
          <li>List your key skills relevant to the role.</li>
          <li>Briefly describe your experience.</li>
          <li>Choose your desired tone (Formal, Casual, or Enthusiastic).</li>
          <li>Click "Generate Intro" and let the AI do its magic!</li>
        </ol>
        <p className="mt-4 text-sm text-muted-foreground">
          This tool uses advanced AI to help you stand out. Remember to review and personalize the generated message further.
        </p>
      </div>
    </div>
  );
}
