
'use client';

import type { Metadata } from 'next';
import ResumeDownloader from '@/components/resume/ResumeDownloader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Briefcase, GraduationCap, Lightbulb, CheckCircle, Instagram, Github, Linkedin, Percent, Loader2, Link as LinkIcon } from 'lucide-react';
import Image from 'next/image';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import SkillBar from '@/components/resume/SkillBar';
import type { ResumeData, Skill, EducationEntry, WorkExperienceEntry, AwardEntry } from '@/data/resumeData';
import { getResumeData } from '@/services/resumeService';
import { DEFAULT_RESUME_DATA } from '@/data/resumeData';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';


const SectionSkeleton: React.FC<{ itemCount?: number, itemLineCount?: number, includeSubtext?: boolean }> = ({ itemCount = 2, itemLineCount = 3, includeSubtext = false }) => (
  <div className="space-y-6">
    {[...Array(itemCount)].map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-5 w-3/4" />
        {includeSubtext && <Skeleton className="h-4 w-1/2" />}
        {[...Array(itemLineCount)].map((_, j) => (
          <Skeleton key={j} className="h-4 w-full" />
        ))}
      </div>
    ))}
  </div>
);

export default function ResumePage() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
  const [hoveredSkillLevel, setHoveredSkillLevel] = useState<number | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [resumeContent, setResumeContent] = useState<ResumeData>(DEFAULT_RESUME_DATA);
  const [isLoadingResume, setIsLoadingResume] = useState(true);

  const fetchResumeDetails = useCallback(async () => {
    setIsLoadingResume(true);
    try {
      const data = await getResumeData();
      setResumeContent(data);
    } catch (error) {
      console.error("Failed to fetch resume details:", error);
      setResumeContent(DEFAULT_RESUME_DATA); // Fallback to default on error
    } finally {
      setIsLoadingResume(false);
    }
  }, []);

  useEffect(() => {
    fetchResumeDetails();
  }, [fetchResumeDetails]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (headingRef.current) {
        const { clientX, clientY } = event;
        const x = (clientX / window.innerWidth - 0.5) * 2;
        const y = (clientY / window.innerHeight - 0.5) * 2;
        const sensitivity = 10; 
        setParallaxOffset({ x: x * sensitivity, y: y * sensitivity });

        const gradientX = (event.clientX / window.innerWidth) * 100;
        const gradientY = (event.clientY / window.innerHeight) * 100;
        headingRef.current.style.setProperty('--gradient-center-x', `${gradientX}%`);
        headingRef.current.style.setProperty('--gradient-center-y', `${gradientY}%`);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const parallaxStyle = {
    transform: `translate(${parallaxOffset.x}px, ${parallaxOffset.y}px)`,
    transition: 'transform 0.1s ease-out',
  };

  useEffect(() => {
    const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 };
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), observerOptions);
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => { if (sectionRef.current) observer.unobserve(sectionRef.current) };
  }, []);

  const handleSkillHover = (level: number | null) => setHoveredSkillLevel(level);

  return (
    <div
      ref={sectionRef}
      className={cn("relative z-0 max-w-4xl mx-auto py-8 transition-all duration-700 ease-in-out", isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10")}
    >
      <header className="text-center mb-12">
        <h1
          id="resume-page-main-heading"
          ref={headingRef}
          className="font-display text-3xl md:text-4xl font-bold text-transparent bg-clip-text relative overflow-hidden"
          style={{ backgroundImage: 'radial-gradient(circle at var(--gradient-center-x, 50%) var(--gradient-center-y, 50%), hsl(var(--accent)) 5%, hsl(var(--primary)) 75%)' }}
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
                  <Image src="/mytreyan.jpg" alt="Profile Picture of Mytreyan" width={120} height={120} className="object-cover w-full h-full hover:scale-110 transition-transform duration-300 ease-in-out" data-ai-hint="profile photo" />
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-foreground font-display">Mytreyan</h2>
              <div className="mt-6 w-full"> <ResumeDownloader /> </div>
            </CardContent>
          </Card>
           <div className="mt-4 text-center">
            <p className="text-sm text-black dark:text-white font-subtext">
              {isLoadingResume ? <Skeleton className="h-4 w-3/4 mx-auto mb-1" /> : resumeContent.education[0]?.degree || DEFAULT_RESUME_DATA.education[0].degree} <br />
              <a href={isLoadingResume ? "#" : (resumeContent.education[0]?.institution ? "https://www.annauniv.edu/#gsc.tab=0" : "#")} target="_blank" rel="noopener noreferrer" className="text-black dark:text-white hover:underline">
                {isLoadingResume ? <Skeleton className="h-4 w-1/2 mx-auto" /> : resumeContent.education[0]?.institution || DEFAULT_RESUME_DATA.education[0].institution}
              </a>
            </p>
            <div className="flex justify-center space-x-3 mt-4">
              {[
                { href: resumeContent.instagramUrl, label: 'Instagram', Icon: Instagram },
                { href: resumeContent.githubUrl, label: 'GitHub', Icon: Github },
                { href: resumeContent.linkedinUrl, label: 'LinkedIn', Icon: Linkedin },
              ].map(({ href, label, Icon }) => (
                (isLoadingResume || href) && (
                  <a key={label} href={isLoadingResume ? '#' : href} aria-label={label} target="_blank" rel="noopener noreferrer" className="p-2 bg-card text-primary rounded-full shadow-md hover:bg-accent hover:text-accent-foreground transition-all duration-200 ease-out hover:scale-110">
                    {isLoadingResume ? <Skeleton className="h-4 w-4" /> : <Icon className="w-4 h-4" />}
                  </a>
                )
              ))}
            </div>
          </div>
        </div>

        <Card className={cn("md:col-span-2 shadow-lg", "transition-transform duration-200 ease-out hover:scale-[1.02]")}>
          <CardHeader><CardTitle className="font-display text-2xl flex items-center text-foreground"><Lightbulb className="mr-2 h-6 w-6 text-primary"/> Summary</CardTitle></CardHeader>
          <CardContent>
             {isLoadingResume ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
                </div>
              ) : (
                <ul className="space-y-3 text-foreground/80 leading-relaxed">
                  {resumeContent.summaryItems.map((item, index) => ( <li key={index} className="flex items-start"> <span className="mr-2 mt-1 text-primary shrink-0 text-xl leading-none">&bull;</span> <span>{item}</span> </li> ))}
                </ul>
              )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-10">
        <Card className={cn("shadow-lg", "transition-transform duration-200 ease-out hover:scale-[1.02]")}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display text-2xl flex items-center text-foreground"><CheckCircle className="mr-2 h-6 w-6 text-primary"/> Key Skills</CardTitle>
            <div className="flex items-baseline space-x-1 text-right">
              <span key={hoveredSkillLevel === null ? 'infinity' : hoveredSkillLevel} className="text-2xl font-bold text-primary animate-numberRollIn">
                {hoveredSkillLevel !== null ? `${hoveredSkillLevel}` : (isLoadingResume ? '...' : '∞')}
              </span>
              <Percent className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingResume ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {[...Array(6)].map((_, i) => ( <div key={i} className="space-y-2"> <Skeleton className="h-4 bg-muted rounded w-3/4" /> <Skeleton className="h-2.5 bg-muted rounded-full" /> </div> ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0">
                {resumeContent.skills.map(skill => ( <SkillBar key={skill.id || skill.name} name={skill.name} level={skill.level} onHoverSkill={handleSkillHover} /> ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={cn("shadow-lg", "transition-transform duration-200 ease-out hover:scale-[1.02]")}>
          <CardHeader><CardTitle className="font-display text-2xl flex items-center text-foreground"><Briefcase className="mr-2 h-6 w-6 text-primary"/> Experience</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {isLoadingResume ? <SectionSkeleton itemCount={2} /> : 
              resumeContent.experience.length > 0 ? (
                resumeContent.experience.map((exp, index) => (
                  <div key={exp.id || index}>
                    <h3 className="font-semibold text-lg text-foreground">{exp.jobTitle}</h3>
                    <p className="text-sm text-muted-foreground">{exp.company} | {exp.dates}</p>
                    <ul className="list-disc list-inside mt-2 text-foreground/80 space-y-1">
                      {exp.responsibilities.map((resp, rIndex) => <li key={rIndex}>{resp}</li>)}
                    </ul>
                  </div>
                ))
              ) : <p className="text-muted-foreground">No work experience listed.</p>
            }
          </CardContent>
        </Card>

        <Card className={cn("shadow-lg", "transition-transform duration-200 ease-out hover:scale-[1.02]")}>
          <CardHeader><CardTitle className="font-display text-2xl flex items-center text-foreground"><GraduationCap className="mr-2 h-6 w-6 text-primary"/> Education</CardTitle></CardHeader>
          <CardContent className="space-y-6">
             {isLoadingResume ? <SectionSkeleton itemCount={1} includeSubtext /> : 
              resumeContent.education.length > 0 ? (
                resumeContent.education.map((edu, index) => (
                  <div key={edu.id || index}>
                    <h3 className="font-semibold text-lg text-foreground">{edu.degree}</h3>
                    <p className="text-sm text-muted-foreground">{edu.institution} | {edu.dates}</p>
                    {edu.description && <p className="mt-1 text-foreground/80">{edu.description}</p>}
                  </div>
                ))
              ) : <p className="text-muted-foreground">No education details listed.</p>
            }
          </CardContent>
        </Card>

        <Card className={cn("shadow-lg", "transition-transform duration-200 ease-out hover:scale-[1.02]")}>
          <CardHeader><CardTitle className="font-display text-2xl flex items-center text-foreground"><Award className="mr-2 h-6 w-6 text-primary"/> Awards & Certifications</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {isLoadingResume ? <SectionSkeleton itemCount={2} itemLineCount={1} /> :
              resumeContent.awards.length > 0 ? (
                resumeContent.awards.map((award, index) => (
                  <div key={award.id || index} className="text-foreground/80">
                    {award.url ? (
                      <Link href={award.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline inline-flex items-center group">
                        {award.title} <LinkIcon className="ml-1.5 h-3.5 w-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    ) : (
                      <span className="font-medium text-foreground">{award.title}</span>
                    )}
                    {(award.issuer || award.date) && (
                      <span className="text-sm text-muted-foreground block">
                        {award.issuer}{award.issuer && award.date ? ' - ' : ''}{award.date}
                      </span>
                    )}
                  </div>
                ))
              ) : <p className="text-muted-foreground">No awards or certifications listed.</p>
            }
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
