
'use client';

import type { Metadata } from 'next';
import ResumeDownloader from '@/components/resume/ResumeDownloader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Briefcase, GraduationCap, Lightbulb, CheckCircle, Instagram, Github, Linkedin, Percent } from 'lucide-react';
import Image from 'next/image';
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import SkillBar from '@/components/resume/SkillBar';

const skills = [
  { name: 'JavaScript & Python', level: 90 },
  { name: 'Web Development (React/Next.js)', level: 90 },
  { name: 'Data Structures & Algorithms', level: 85 },
  { name: 'C/C++ & Java', level: 75 },
  { name: 'SQL & Databases', level: 80 },
  { name: '3D Modeling (Blender, Unity)', level: 85 },
  { name: 'Machine Learning Concepts', level: 70 },
  { name: 'Video/Image Editing', level: 70 },
  { name: 'Computer Hardware Basics', level: 65 },
  { name: 'Leadership & Problem Solving', level: 90 },
];

export default function ResumePage() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
  const [hoveredSkillLevel, setHoveredSkillLevel] = useState<number | null>(null);

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

  const handleSkillHover = (level: number | null) => {
    setHoveredSkillLevel(level);
  };

  return (
    <div
      ref={sectionRef}
      className={cn(
        "relative z-0 max-w-4xl mx-auto py-8 transition-all duration-700 ease-in-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      )}
    >
      <header className="text-center mb-12">
        <h1
          id="resume-page-main-heading"
          className="font-display text-3xl md:text-4xl font-bold text-transparent bg-clip-text heading-hover-reveal relative overflow-hidden"
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
        <div className="md:col-span-1 flex flex-col items-center">
           <Card className={cn("shadow-lg w-full", "transition-transform duration-200 ease-out hover:scale-[1.02]")}>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="relative mb-4 group">
                <div className="rounded-full overflow-hidden w-[120px] h-[120px]">
                  <Image
                    src="/mytreyan.jpg"
                    alt="Profile Picture of Mytreyan"
                    width={120}
                    height={120}
                    className="object-cover w-full h-full hover:scale-110 transition-transform duration-300 ease-in-out"
                    data-ai-hint="profile photo"
                  />
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-foreground font-display">Mytreyan</h2>
              <div className="mt-6 w-full">
                <ResumeDownloader />
              </div>
            </CardContent>
          </Card>
           <div className="mt-4 text-center">
            <p className="text-sm text-black dark:text-white font-subtext">
              BTech IT<br />
              <a
                href="https://www.annauniv.edu/#gsc.tab=0"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black dark:text-white hover:underline"
              >
                CEG, Anna university
              </a>
            </p>
            <div className="flex justify-center space-x-3 mt-4">
              <a
                href="https://www.instagram.com/mytreyn?igsh=YnZyanJmOTZwaW1l"
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-card text-primary rounded-full shadow-md hover:bg-accent hover:text-accent-foreground transition-all duration-200 ease-out hover:scale-110"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://github.com/mytreyanjp"
                aria-label="GitHub"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-card text-primary rounded-full shadow-md hover:bg-accent hover:text-accent-foreground transition-all duration-200 ease-out hover:scale-110"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://in.linkedin.com/in/mytreyan-jp-49226a2a7&ved=2ahUKEwj3rtuY_8qNAxWA2TgGHXl_O7gQFnoECBoQAQ&usg=AOvVaw3D68WydBGZLTSn9LRwey7Z"
                aria-label="LinkedIn"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-card text-primary rounded-full shadow-md hover:bg-accent hover:text-accent-foreground transition-all duration-200 ease-out hover:scale-110"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <Card className={cn("md:col-span-2 shadow-lg", "transition-transform duration-200 ease-out hover:scale-[1.02]")}>
          <CardHeader>
            <CardTitle className="font-display text-2xl flex items-center text-foreground"><Lightbulb className="mr-2 h-6 w-6 text-primary"/> Summary</CardTitle>
          </CardHeader>
          <CardContent>
             <ul className="space-y-3 text-foreground/80 leading-relaxed">
              <li className="flex items-start">
                <span className="mr-2 mt-1 text-primary shrink-0 text-xl leading-none">&bull;</span>
                <span>IT student skilled in web dev, data structures, C++, Java, Python, JavaScript.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1 text-primary shrink-0 text-xl leading-none">&bull;</span>
                <span>Proficient in Machine Learning, 3D Modeling (Blender/Unity), SQL.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1 text-primary shrink-0 text-xl leading-none">&bull;</span>
                <span>Practical experience in 3D design, video/image editing, and hardware.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1 text-primary shrink-0 text-xl leading-none">&bull;</span>
                <span>Proactive leader, eager for challenges and driving innovative solutions.</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-10">
        <Card className={cn("shadow-lg", "transition-transform duration-200 ease-out hover:scale-[1.02]")}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display text-2xl flex items-center text-foreground">
              <CheckCircle className="mr-2 h-6 w-6 text-primary"/> Key Skills
            </CardTitle>
            <div className="flex items-baseline space-x-1 text-right">
              <span
                key={hoveredSkillLevel === null ? 'infinity' : hoveredSkillLevel} 
                className="text-2xl font-bold text-primary animate-numberRollIn"
              >
                {hoveredSkillLevel !== null ? `${hoveredSkillLevel}` : '∞'}
              </span>
              <Percent className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0">
              {skills.map(skill => (
                <SkillBar
                  key={skill.name}
                  name={skill.name}
                  level={skill.level}
                  onHoverSkill={handleSkillHover}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className={cn("shadow-lg", "transition-transform duration-200 ease-out hover:scale-[1.02]")}>
          <CardHeader>
            <CardTitle className="font-display text-2xl flex items-center text-foreground"><Briefcase className="mr-2 h-6 w-6 text-primary"/> Experience (Placeholder)</CardTitle>
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

        <Card className={cn("shadow-lg", "transition-transform duration-200 ease-out hover:scale-[1.02]")}>
          <CardHeader>
            <CardTitle className="font-display text-2xl flex items-center text-foreground"><GraduationCap className="mr-2 h-6 w-6 text-primary"/> Education (Placeholder)</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <h3 className="font-semibold text-lg text-foreground">M.S. in Computer Science</h3>
              <p className="text-sm text-muted-foreground">University of Technology - Graduated 2018</p>
              <p className="mt-1 text-foreground/80">Specialized in Human-Computer Interaction and Graphics.</p>
            </div>
          </CardContent>
        </Card>

        <Card className={cn("shadow-lg", "transition-transform duration-200 ease-out hover:scale-[1.02]")}>
          <CardHeader>
            <CardTitle className="font-display text-2xl flex items-center text-foreground"><Award className="mr-2 h-6 w-6 text-primary"/> Awards & Certifications (Placeholder)</CardTitle>
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
