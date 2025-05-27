
'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import ProjectCard from '@/components/portfolio/ProjectCard';
import ProjectFilter, { Filters } from '@/components/portfolio/ProjectFilter';
import type { Project } from '@/data/projects';
import { getProjects } from '@/services/projectsService';
import { Button } from '@/components/ui/button';
import { ArrowDown, Loader2, AlertTriangle, X as XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


export default function PortfolioPage() {
  const [filters, setFilters] = useState<Filters>({ category: '', technologies: [] });
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noProjectsMessageVisible, setNoProjectsMessageVisible] = useState(true);


  const welcomeSectionRef = useRef<HTMLElement>(null);
  const projectsSectionRef = useRef<HTMLElement>(null);
  const [isWelcomeVisible, setIsWelcomeVisible] = useState(false);
  const [isProjectsVisible, setIsProjectsVisible] = useState(false);


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
    const results = projects.filter(project => {
      const categoryMatch = filters.category ? project.category === filters.category : true;
      const techMatch = filters.technologies.length > 0
        ? filters.technologies.every(tech => project.technologies.includes(tech))
        : true;
      return categoryMatch && techMatch;
    });
    // Show the message if filters are active and results are empty
    setNoProjectsMessageVisible(results.length === 0 && (filters.category !== '' || filters.technologies.length > 0));
    return results;
  }, [filters, projects, isLoading, error]);

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
    // If new filters lead to results, or if filters are cleared, ensure message visibility is reset if needed
    // The check is mainly handled by filteredProjects useMemo, but explicitly show if filters are reset
    if (newFilters.category === '' && newFilters.technologies.length === 0) {
      setNoProjectsMessageVisible(false); // No message if filters are cleared and projects might exist
    } else {
      // Visibility will be determined by filteredProjects effect
    }
  };

  const handleResetFilters = () => {
    setFilters({ category: '', technologies: [] });
    setNoProjectsMessageVisible(false); // Hide message when filters are reset
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
            <h1 id="welcome-heading" className="text-6xl md:text-7xl font-bold mb-2 text-primary">
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
              noProjectsMessageVisible && (
                <Alert 
                  variant="destructive" 
                  className="relative py-8 text-center animate-fadeInUpScale"
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
