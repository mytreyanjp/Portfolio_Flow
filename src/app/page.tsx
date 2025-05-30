
'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import ProjectCard from '@/components/portfolio/ProjectCard';
import ProjectFilter from '@/components/portfolio/ProjectFilter';
import type { Project } from '@/data/projects';
import { getProjects } from '@/services/projectsService';
import { Button } from '@/components/ui/button';
import { ArrowDown, Mail, FileText, AlertTriangle, X as XIcon, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { useTheme } from 'next-themes';

interface Filters {
  category: string;
}

export default function PortfolioPage() {
  const [filters, setFilters] = useState<Filters>({ category: '' });
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noProjectsMessageVisible, setNoProjectsMessageVisible] = useState(false);

  const welcomeSectionRef = useRef<HTMLElement>(null);
  const quickNavSectionRef = useRef<HTMLElement>(null);
  const projectsSectionRef = useRef<HTMLElement>(null);
  const introContentRef = useRef<HTMLDivElement>(null);
  const viewProjectsButtonRef = useRef<HTMLButtonElement>(null);

  const [isWelcomeVisible, setIsWelcomeVisible] = useState(false);
  const [isQuickNavVisible, setIsQuickNavVisible] = useState(false);
  const [isProjectsVisible, setIsProjectsVisible] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const { resolvedTheme } = useTheme();
  const [hasButtonClicked, setHasButtonClicked] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [buttonMaskStyle, setButtonMaskStyle] = useState({});

  useEffect(() => {
    const handleGlobalMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, []);

  useEffect(() => {
    if (viewProjectsButtonRef.current && resolvedTheme === 'dark' && !hasButtonClicked) {
      const button = viewProjectsButtonRef.current;
      const rect = button.getBoundingClientRect();
      const maskX = mousePosition.x - rect.left;
      const maskY = mousePosition.y - rect.top;
      const maskRadius = 200; 

      setButtonMaskStyle({
        '--mask-x': `${maskX}px`,
        '--mask-y': `${maskY}px`,
        '--mask-radius': `${maskRadius}px`,
        maskImage: `radial-gradient(circle var(--mask-radius) at var(--mask-x) var(--mask-y), black 0%, black 60%, transparent 100%)`,
        WebkitMaskImage: `radial-gradient(circle var(--mask-radius) at var(--mask-x) var(--mask-y), black 0%, black 60%, transparent 100%)`,
        opacity: 1, 
      });
    } else {
      setButtonMaskStyle({
        maskImage: 'none',
        WebkitMaskImage: 'none',
        opacity: 1,
      });
    }
  }, [mousePosition, resolvedTheme, hasButtonClicked, viewProjectsButtonRef]);


  useEffect(() => {
    const contentNode = introContentRef.current;
    if (!contentNode) return;

    const handleMouseMoveForGradient = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth) * 100;
      const y = (event.clientY / window.innerHeight) * 100;
      contentNode.style.setProperty('--gradient-center-x', `${x}%`);
      contentNode.style.setProperty('--gradient-center-y', `${y}%`);
    };

    window.addEventListener('mousemove', handleMouseMoveForGradient);
    return () => {
      window.removeEventListener('mousemove', handleMouseMoveForGradient);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0 && !hasScrolled) {
        setHasScrolled(true);
      }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [hasScrolled]);

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
    return () => {
      intersectionObservers.forEach(({ observer, ref }) => {
        if (ref.current) {
          observer.unobserve(ref.current);
        }
      });
    };
  }, []);

  const filteredProjects = useMemo(() => {
    if (isLoading || error) return [];
    const results = projects.filter(project => {
      const categoryMatch = filters.category ? project.category === filters.category : true;
      return categoryMatch;
    });
    setNoProjectsMessageVisible(results.length === 0 && !isLoading && (filters.category !== ''));
    return results;
  }, [filters, projects, isLoading, error]);

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
    if (newFilters.category === '') {
      setNoProjectsMessageVisible(false);
    }
  };

  const handleResetFilters = () => {
    setFilters({ category: '' });
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

  const showViewProjectsButton = resolvedTheme === 'light' || hasButtonClicked;


  return (
    <div className="py-6 px-12 mt-8">
      <section
        aria-labelledby="welcome-heading"
        className={cn(
          "text-center transition-all duration-700 ease-in-out mt-12",
          isWelcomeVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        )}
        ref={welcomeSectionRef}
      >
        <div className="max-w-3xl mx-auto" ref={introContentRef}>
          <h1
            id="portfolio-page-main-heading"
            className="font-display text-5xl sm:text-6xl md:text-7xl text-transparent bg-clip-text relative overflow-hidden mb-2"
            style={{
              backgroundImage:
                'radial-gradient(circle at var(--gradient-center-x, 50%) var(--gradient-center-y, 50%), hsl(var(--accent)) 5%, hsl(var(--primary)) 75%)',
            }}
          >
            Hello there
          </h1>
          <p
            className="font-display text-2xl sm:text-3xl md:text-4xl text-transparent bg-clip-text relative overflow-hidden mb-2"
             style={{
              backgroundImage:
                'radial-gradient(circle at calc(100% - var(--gradient-center-x, 50%)) calc(100% - var(--gradient-center-y, 50%)), hsl(var(--primary)) 5%, hsl(var(--accent)) 75%)',
            }}
          >
            Mytreyan here
          </p>
          <p className="font-subtext text-lg md:text-xl text-foreground mb-4">
            Can create light outta a blackhole
          </p>
          <Button
            ref={viewProjectsButtonRef}
            size="lg"
            variant="outline"
            className={cn(
              "shadow-md relative",
              "transition-all duration-200 ease-out", 
              "hover:scale-105 hover:bg-background"
            )}
            style={{
              ...buttonMaskStyle,
              opacity: 1, 
            }}
            onClick={() => {
              setHasButtonClicked(true);
              scrollToProjects();
            }}
          >
            View Projects <ArrowDown className="ml-2 h-5 w-5 animate-bounce" />
          </Button>
        </div>
      </section>

      <section
        aria-labelledby="quick-navigation-heading"
        className={cn(
          "py-8 text-center transition-all duration-700 ease-in-out mt-23",
          hasScrolled ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        )}
        ref={quickNavSectionRef}
      >
        <h2
          id="quick-navigation-heading"
          className="font-display text-2xl font-semibold mb-6 text-foreground"
        >
          Connect & Explore
        </h2>
        <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-4">
          <Button
            asChild
            size="lg"
            variant="outline"
            className="shadow-md hover:shadow-lg transition-transform duration-200 ease-out hover:scale-105 hover:bg-background w-full md:w-auto"
          >
            <Link href="/contact">
              <span className="flex items-center">
                <Mail className="mr-2 h-5 w-5" />
                Get in Touch
              </span>
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="shadow-md hover:shadow-lg transition-transform duration-200 ease-out hover:scale-105 hover:bg-background w-full md:w-auto"
          >
            <Link href="/resume">
              <span className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                View Resume
              </span>
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
          className="font-display text-3xl font-semibold mb-8 text-center text-foreground"
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
  );
}
