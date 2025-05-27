
'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
// import dynamic from 'next/dynamic'; // ThreeScene is now in layout
import ProjectCard from '@/components/portfolio/ProjectCard';
import ProjectFilter, { Filters } from '@/components/portfolio/ProjectFilter';
import type { Project } from '@/data/projects';
import { getProjects } from '@/services/projectsService';
import { Button } from '@/components/ui/button';
import { ArrowDown, Loader2, AlertTriangle } from 'lucide-react';
// import { useTheme } from 'next-themes'; // Only needed if page.tsx uses theme for other things
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// ThreeScene is no longer imported or rendered here
// const ThreeScene = dynamic(() => import('@/components/portfolio/ThreeScene'), {
//   ssr: false,
//   loading: () => <div style={{ height: '100vh', width: '100vw', position: 'fixed' }} />,
// });

export default function PortfolioPage() {
  const [filters, setFilters] = useState<Filters>({ category: '', technologies: [] });
  // const [scrollPercentage, setScrollPercentage] = useState(0); // Moved to layout
  // const [isClient, setIsClient] = useState(false); // Moved to layout or not needed if only for ThreeScene
  // const { resolvedTheme } = useTheme(); // Keep if theme is used for page-specific logic, otherwise remove

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const welcomeSectionRef = useRef<HTMLElement>(null);
  const projectsSectionRef = useRef<HTMLElement>(null);
  const [isWelcomeVisible, setIsWelcomeVisible] = useState(false);
  const [isProjectsVisible, setIsProjectsVisible] = useState(false);

  // useEffect(() => { // isClient state setup, moved to layout
  //   setIsClient(true);
  // }, []);

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
    // if (isClient) { // Fetch projects based on a general client-side check if needed, or just directly
    fetchProjects();
    // }
  }, []); // Removed isClient dependency if it was only for ThreeScene

  // Scroll percentage calculation moved to layout
  // useEffect(() => {
  //   const handleScroll = () => { /* ... */ };
  //   window.addEventListener('scroll', handleScroll, { passive: true });
  //   handleScroll();
  //   return () => window.removeEventListener('scroll', handleScroll);
  // }, []);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
    };

    const welcomeObserver = new IntersectionObserver(([entry]) => {
      setIsWelcomeVisible(entry.isIntersecting);
    }, observerOptions);

    if (welcomeSectionRef.current) {
      welcomeObserver.observe(welcomeSectionRef.current);
    }

    const projectsObserver = new IntersectionObserver(([entry]) => {
      setIsProjectsVisible(entry.isIntersecting);
    }, observerOptions);

    if (projectsSectionRef.current) {
      projectsObserver.observe(projectsSectionRef.current);
    }

    return () => {
      if (welcomeSectionRef.current) {
        welcomeObserver.unobserve(welcomeSectionRef.current);
      }
      if (projectsSectionRef.current) {
        projectsObserver.unobserve(projectsSectionRef.current);
      }
    };
  }, []);


  const filteredProjects = useMemo(() => {
    if (isLoading || error) return [];
    return projects.filter(project => {
      const categoryMatch = filters.category ? project.category === filters.category : true;
      const techMatch = filters.technologies.length > 0
        ? filters.technologies.every(tech => project.technologies.includes(tech))
        : true;
      return categoryMatch && techMatch;
    });
  }, [filters, projects, isLoading, error]);

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({ category: '', technologies: [] });
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


  return (
    <>
      {/* ThreeScene component is removed from here; it's now in RootLayout */}
      {/* The main content div now doesn't need z-10 if the layout handles global background layering */}
      <div className="space-y-12">
        <section
          aria-labelledby="welcome-heading"
          className={cn(
            "text-left py-12 md:py-16 transition-all duration-700 ease-in-out",
            isWelcomeVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}
          ref={welcomeSectionRef}
        >
          <div className="max-w-3xl ml-0 mr-auto">
            <h1 id="welcome-heading" className="text-4xl md:text-5xl font-bold mb-6 text-primary">
              Hi, my name is Mytreyan.
            </h1>
            <p className="text-lg md:text-xl text-foreground mb-4">
              Can create light outta a blackhole
            </p>
            <Button size="lg" onClick={scrollToProjects} className="rounded-full shadow-lg hover:shadow-primary/30 transition-shadow">
              View Projects <ArrowDown className="ml-2 h-5 w-5 animate-bounce" />
            </Button>
          </div>
        </section>

         <p className={cn(
            "text-center -mt-8 text-muted-foreground text-sm transition-all duration-700 ease-in-out",
            isWelcomeVisible ? "opacity-100" : "opacity-0"
          )}>
            The background animates as you scroll!
          </p>

        <section
          id="projects-section"
          aria-labelledby="projects-heading"
          className={cn(
            "pt-8 transition-all duration-700 ease-in-out",
            isProjectsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}
          ref={projectsSectionRef}
        >
          <h2 id="projects-heading" className="text-3xl font-semibold mb-8 text-center">
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
              <p className="text-center text-muted-foreground py-8 animate-fadeInUpScale" style={{ animationDelay: '0s' }}>
                  No projects match the current filters. Try adjusting your selection or reset filters.
              </p>
            )
          )}
        </section>
      </div>
    </>
  );
}
