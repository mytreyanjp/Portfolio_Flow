
'use client';

import type { Metadata } from 'next';
import ContactForm from '@/components/contact/ContactForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, MapPin } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export default function ContactPage() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const { clientX, clientY } = event;
      const x = (clientX / window.innerWidth - 0.5) * 2;
      const y = (clientY / window.innerHeight - 0.5) * 2;
      const sensitivity = 15;
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
        "max-w-4xl mx-auto py-8 transition-all duration-700 ease-in-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      )}
    >
      <h1 
        id="contact-page-main-heading"
        className="text-4xl font-bold text-center mb-12 text-transparent bg-clip-text heading-hover-reveal relative overflow-hidden"
        style={{
          ...parallaxStyle,
          backgroundImage: 'radial-gradient(circle at center, hsl(var(--accent)) 10%, hsl(var(--primary)) 90%)',
        }}
      >
        Let's Connect
      </h1>
      
      <div className="grid md:grid-cols-2 gap-12 items-start">
        <section aria-labelledby="contact-form-section">
          <h2 id="contact-form-section" className="sr-only">Contact Form</h2>
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Send a Message</CardTitle>
              <CardDescription>Fill out the form below and I'll get back to you as soon as possible.</CardDescription>
            </CardHeader>
            <CardContent>
              <ContactForm />
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="contact-info-section" className="space-y-8">
           <h2 
            id="contact-info-section" 
            className="text-2xl font-semibold mb-6 text-center md:text-left text-foreground"
           >
            Contact Information
           </h2>
          <Card className="shadow-lg">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start space-x-4">
                <Mail className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold">Email</h3>
                  <a href="mailto:placeholder@example.com" className="text-accent hover:underline">
                    placeholder@example.com
                  </a>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Phone className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold">Phone</h3>
                  <p className="text-muted-foreground">(123) 456-7890 (Placeholder)</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <MapPin className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold">Location</h3>
                  <p className="text-muted-foreground">Planet Earth (Remote Friendly)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="text-center md:text-left">
            <p className="text-muted-foreground">
              I'm always open to discussing new projects, creative ideas or opportunities to be part of your visions.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
