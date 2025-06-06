
'use client';

import type { Metadata } from 'next';
import ContactForm from '@/components/contact/ContactForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, MapPin } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useName } from '@/contexts/NameContext'; // Import useName

export default function ContactPage() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { userName } = useName(); // Get userName from context

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (headingRef.current) {
        const { clientX, clientY } = event;
        // Parallax for other elements - can be kept or removed if not used elsewhere
        const x = (clientX / window.innerWidth - 0.5) * 2; 
        const y = (clientY / window.innerHeight - 0.5) * 2; 
        const sensitivity = 10; 
        setParallaxOffset({ x: x * sensitivity, y: y * sensitivity });

        // For dynamic gradient on main heading
        const gradientX = (event.clientX / window.innerWidth) * 100;
        const gradientY = (event.clientY / window.innerHeight) * 100;
        headingRef.current.style.setProperty('--gradient-center-x', `${gradientX}%`);
        headingRef.current.style.setProperty('--gradient-center-y', `${gradientY}%`);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // This parallaxStyle object remains defined but won't be applied to the Contact Info heading
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
        "relative z-0 max-w-4xl mx-auto pt-0 pb-8 transition-all duration-700 ease-in-out font-title",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      )}
    >
      <h1
        id="contact-page-main-heading"
        ref={headingRef}
        className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-12 text-transparent bg-clip-text relative overflow-hidden"
        style={{
          backgroundImage: 'radial-gradient(circle at var(--gradient-center-x, 50%) var(--gradient-center-y, 50%), hsl(var(--accent)) 5%, hsl(var(--primary)) 75%)',
        }}
      >
        Let's Connect
      </h1>

      <div className="grid md:grid-cols-2 gap-12 items-start">
        <section aria-labelledby="contact-form-section">
          <h2 id="contact-form-section" className="sr-only">Contact Form</h2>
          <Card className={cn("shadow-xl", "transition-transform duration-200 ease-out hover:scale-[1.02]")}>
            <CardHeader>
              <CardTitle className="text-2xl text-foreground font-title">Send a Message</CardTitle>
              <CardDescription>Fill out the form below and I'll get back to you as soon as possible.</CardDescription>
            </CardHeader>
            <CardContent>
              <ContactForm />
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="contact-info-section" className="space-y-8">
           <h2
            id="contact-info-section-heading"
            className="text-2xl font-semibold mb-6 text-center md:text-left text-foreground font-title"
            // parallaxStyle removed from here
           >
            Contact Information
           </h2>
          <Card className={cn("shadow-lg", "transition-transform duration-200 ease-out hover:scale-[1.02]")}>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start space-x-4">
                <Mail className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground">Email</h3>
                  <a href="mailto:mytreyan197@gmail.com" className="text-primary hover:underline">
                    mytreyan197@gmail.com
                  </a>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Phone className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground">Phone</h3>
                  <a href="tel:+919380744449" className="text-primary hover:underline">
                    +91 9380744449
                  </a>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <MapPin className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground">Location</h3>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Chennai,Tamilnadu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Chennai, Tamilnadu
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="text-center md:text-left">
            <p className="text-muted-foreground">
              {userName ? `Hey ${userName}, I'm` : "I'm"} always open to discussing new projects, creative ideas or opportunities to be part of your visions.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
