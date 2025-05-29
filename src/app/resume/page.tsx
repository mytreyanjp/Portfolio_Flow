
'use client';

import type { Metadata } from 'next';
import ResumeDownloader from '@/components/resume/ResumeDownloader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Briefcase, GraduationCap, Lightbulb, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

const skills = [
  { name: 'JavaScript (ES6+)', level: 90 },
  { name: 'TypeScript', level: 90 },
  { name: 'React & Next.js', level: 95 },
  { name: 'Three.js & WebGL', level: 80 },
  { name: 'Node.js & Express', level: 85 },
  { name: 'Python', level: 75 },
  { name: 'AI & Genkit', level: 70 },
  { name: 'UI/UX Design Principles', level: 80 },
  { name: 'Database (SQL/NoSQL)', level: 70 },
  { name: 'Cloud Platforms (Firebase/AWS)', level: 75 },
];

export default function ResumePage() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const { clientX, clientY } = event;
      const x = (clientX / window.innerWidth - 0.5) * 2;
      const y = (clientY / window.innerHeight - 0.5) * 2;
      const sensitivity = 10; // Reduced sensitivity
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
      <header className="text-center mb-12">
        <h1 
          id="resume-page-main-heading"
          className="text-4xl font-bold text-transparent bg-clip-text mb-4 heading-hover-reveal relative overflow-hidden"
          style={{
            ...parallaxStyle,
            backgroundImage: 'radial-gradient(circle at center, hsl(var(--accent)) 10%, hsl(var(--primary)) 90%)',
          }}
        >
          My Professional Profile
        </h1>
        <p className="text-lg text-muted-foreground">A snapshot of my journey, skills, and achievements.</p>
      </header>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <Card className="md:col-span-1 shadow-lg">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <Image 
              src="https://placehold.co/150x150.png" 
              alt="Profile Picture" 
              width={120} 
              height={120} 
              className="rounded-full mb-4 border-4 border-primary"
              data-ai-hint="profile avatar"
            />
            <h2 className="text-2xl font-semibold text-foreground">Your Name Here</h2>
            <p className="text-primary">Full Stack Developer & 3D Enthusiast</p>
            <div className="mt-6 w-full">
              <ResumeDownloader />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center text-foreground"><Lightbulb className="mr-2 h-6 w-6 text-primary"/> Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/80 leading-relaxed">
              Highly motivated and results-oriented developer with X years of experience in creating dynamic web applications and immersive 3D experiences. Passionate about leveraging cutting-edge technologies to solve complex problems and deliver exceptional user experiences. Proven ability to work effectively in agile environments, collaborate with cross-functional teams, and continuously learn and adapt to new challenges.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-10">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center text-foreground"><CheckCircle className="mr-2 h-6 w-6 text-primary"/> Key Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {skills.map(skill => (
                <div key={skill.name} className="mb-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{skill.name}</span>
                    <span className="text-sm font-medium text-primary">{skill.level}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: `${skill.level}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center text-foreground"><Briefcase className="mr-2 h-6 w-6 text-primary"/> Experience (Placeholder)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg text-foreground">Senior Developer at Tech Solutions Inc.</h3>
              <p className="text-sm text-muted-foreground">Jan 2021 - Present</p>
              <ul className="list-disc list-inside mt-2 text-foreground/80 space-y-1">
                <li>Led development of key features for a flagship product, improving performance by 20%.</li>
                <li>Mentored junior developers and contributed to best practices for code quality.</li>
                <li>Integrated Three.js for interactive 3D product demos on the company website.</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground">Web Developer at Creative Agency</h3>
              <p className="text-sm text-muted-foreground">Jun 2018 - Dec 2020</p>
              <ul className="list-disc list-inside mt-2 text-foreground/80 space-y-1">
                <li>Developed and maintained client websites using React and Node.js.</li>
                <li>Collaborated with designers to implement responsive and user-friendly interfaces.</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center text-foreground"><GraduationCap className="mr-2 h-6 w-6 text-primary"/> Education (Placeholder)</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <h3 className="font-semibold text-lg text-foreground">M.S. in Computer Science</h3>
              <p className="text-sm text-muted-foreground">University of Technology - Graduated 2018</p>
              <p className="mt-1 text-foreground/80">Specialized in Human-Computer Interaction and Graphics.</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center text-foreground"><Award className="mr-2 h-6 w-6 text-primary"/> Awards & Certifications (Placeholder)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-foreground/80">Certified Next.js Developer - 2022</p>
            <p className="text-foreground/80">Innovation Award - Tech Solutions Inc. - 2021</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
