
'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import ProjectCard from '@/components/portfolio/ProjectCard';
import ProjectFilter, { Filters } from '@/components/portfolio/ProjectFilter';
import type { Project } from '@/data/projects';
import { getProjects } from '@/services/projectsService';
import { Button } from '@/components/ui/button';
import { ArrowDown, Loader2, AlertTriangle, X as XIcon, Mail, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';

export default function PortfolioPage() {
  const [filters, setFilters] = useState<Filters>({ category: '', technologies: [] });
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noProjectsMessageVisible, setNoProjectsMessageVisible] = useState(false);

  const welcomeSectionRef = useRef<HTMLElement>(null);
  const quickNavSectionRef = useRef<HTMLElement>(null);
  const projectsSectionRef = useRef<HTMLElement>(null);
  const [isWelcomeVisible, setIsWelcomeVisible] = useState(false);
  const [isQuickNavVisible, setIsQuickNavVisible] = useState(false);
  const [isProjectsVisible, setIsProjectsVisible] = useState(false);

  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
  const parallaxSensitivity = 15; 

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedProjects = await getProjects();
        setProjects(fetchedProjects);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching projects.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);


  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
    };

    const observers: [React.RefObject<HTMLElement>, React.Dispatch<React.SetStateAction<boolean>>][] = [
      [welcomeSectionRef, setIsWelcomeVisible],
      [quickNavSectionRef, setIsQuickNavVisible],
      [projectsSectionRef, setIsProjectsVisible],
    ];

    const intersectionObservers = observers.map(([ref, setVisible]) => {
      const observer = new IntersectionObserver(([entry]) => {
        setVisible(entry.isIntersecting);
      }, observerOptions);
      if (ref.current) {
        observer.observe(ref.current);
      }
      return { observer, ref };
    });
    
    const handleMouseMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth - 0.5) * parallaxSensitivity;
      const y = (event.clientY / window.innerHeight - 0.5) * parallaxSensitivity;
      setParallaxOffset({ x: -x, y: -y }); 
    };
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      intersectionObservers.forEach(({ observer, ref }) => {
        if (ref.current) {
          observer.unobserve(ref.current);
        }
      });
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [parallaxSensitivity]);


  const filteredProjects = useMemo(() => {
    if (isLoading || error) return [];
    const results = projects.filter(project => {
      const categoryMatch = filters.category ? project.category === filters.category : true;
      const techMatch = filters.technologies.length > 0
        ? filters.technologies.every(tech => project.technologies.includes(tech))
        : true;
      return categoryMatch && techMatch;
    });
    setNoProjectsMessageVisible(results.length === 0 && !isLoading && (filters.category !== '' || filters.technologies.length > 0));
    return results;
  }, [filters, projects, isLoading, error]);

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
    if (newFilters.category === '' && newFilters.technologies.length === 0) {
      setNoProjectsMessageVisible(false); 
    }
  };

  const handleResetFilters = () => {
    setFilters({ category: '', technologies: [] });
    setNoProjectsMessageVisible(false);
  };

  const scrollToProjects = () => {
    document.getElementById('projects-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const gridKey = useMemo(() => JSON.stringify(filters) + `_loading:${isLoading}_error:${!!error}`, [filters, isLoading, error]);

  const ProjectSkeletonCard = () => (
    <div className="flex flex-col h-full overflow-hidden animate-fadeInUpScale">
      <Skeleton className="w-full h-48 mb-4 rounded-t-md" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="pt-2">
          <Skeleton className="h-5 w-1/4 mb-2" />
          <Skeleton className="h-5 w-1/3" />
        </div>
        <div className="pt-2">
          <Skeleton className="h-5 w-1/4 mb-2" />
          <div className="flex flex-wrap gap-1">
            <Skeleton className="h-5 w-10" />
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-8" />
          </div>
        </div>
        <div className="flex justify-start space-x-2 pt-4 border-t mt-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </div>
  );

  const parallaxStyle = {
    transform: `translate(${parallaxOffset.x}px, ${parallaxOffset.y}px)`,
    transition: 'transform 0.1s ease-out' 
  };

  return (
    <>
      <div className="space-y-12 py-6 px-12"> {/* Increased px-6 to px-12 */}
        <section
          aria-labelledby="welcome-heading"
          className={cn(
            "text-center transition-all duration-700 ease-in-out",
            isWelcomeVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}
          ref={welcomeSectionRef}
          style={parallaxStyle}
        >
          <div className="max-w-3xl mx-auto">
            <h1 id="welcome-heading" className="text-7xl md:text-7xl font-bold mb-2 text-primary">
              Hi
            </h1>
            <p className="text-3xl md:text-4xl font-semibold mb-4 text-primary">
              my name is Mytreyan.
            </p>
            <p className="text-lg md:text-xl text-foreground mb-6">
              Can create light outta a blackhole
            </p>
            <Button size="lg" onClick={scrollToProjects} className="rounded-full shadow-lg hover:shadow-primary/30 transition-shadow">
              View Projects <ArrowDown className="ml-2 h-5 w-5 animate-bounce" />
            </Button>
          </div>
        </section>

        <section
          aria-labelledby="quick-navigation-heading"
          className={cn(
            "py-8 text-center transition-all duration-700 ease-in-out",
            isQuickNavVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}
          ref={quickNavSectionRef}
        >
          <h2 
            id="quick-navigation-heading" 
            className="text-2xl font-semibold mb-6 text-foreground"
            style={parallaxStyle}
          >
            Connect & Explore
          </h2>
          <div className="flex justify-center space-x-4">
            <Button asChild size="lg" variant="outline" className="shadow-md hover:shadow-lg transition-shadow">
              <Link href="/contact">
                <Mail className="mr-2 h-5 w-5" />
                Get in Touch
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="shadow-md hover:shadow-lg transition-shadow">
              <Link href="/resume">
                <FileText className="mr-2 h-5 w-5" />
                View Resume
              </Link>
            </Button>
          </div>
        </section>

        <section
          id="projects-section"
          aria-labelledby="projects-heading"
          className={cn(
            "pt-8 transition-all duration-700 ease-in-out",
            isProjectsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}
          ref={projectsSectionRef}
        >
          <h2 
            id="projects-heading" 
            className="text-3xl font-semibold mb-8 text-center"
            style={parallaxStyle}
          >
            My Projects
          </h2>
          <ProjectFilter
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
          />
          {error && (
            <div className="text-center py-8 text-destructive flex flex-col items-center animate-fadeInUpScale">
              <AlertTriangle className="h-12 w-12 mb-4" />
              <p className="text-xl font-semibold">Failed to load projects</p>
              <p>{error}</p>
              <Button onClick={() => window.location.reload()} className="mt-4">Try Again</Button>
            </div>
          )}
          {!error && (
            isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(3)].map((_, i) => <ProjectSkeletonCard key={`skeleton-${i}`} />)}
              </div>
            ) : filteredProjects.length > 0 ? (
              <div key={gridKey} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProjects.map((project, index) => (
                  <ProjectCard key={project.id} project={project} index={index} />
                ))}
              </div>
            ) : (
              noProjectsMessageVisible && (
                <Alert 
                  variant="destructive" 
                  className="relative py-8 text-center animate-fadeInUpScale bg-destructive/10" 
                  style={{ animationDelay: '0s' }}
                >
                  <button 
                    onClick={() => setNoProjectsMessageVisible(false)} 
                    className="absolute top-2 right-2 p-1 rounded-md hover:bg-destructive/20 transition-colors"
                    aria-label="Dismiss message"
                  >
                    <XIcon className="h-5 w-5" />
                  </button>
                  <AlertTriangle className="h-8 w-8 mx-auto mb-3" />
                  <AlertTitle className="font-semibold text-lg mb-2">No Projects Found</AlertTitle>
                  <AlertDescription>
                    No projects match the current filters. Try adjusting your selection or reset filters.
                  </AlertDescription>
                </Alert>
              )
            )
          )}
        </section>
      </div>
    </>
  );
}

