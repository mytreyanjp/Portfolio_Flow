
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ProjectCard from '@/components/portfolio/ProjectCard';
import ProjectFilter, { Filters } from '@/components/portfolio/ProjectFilter';
import { projectsData, Project } from '@/data/projects';
import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';

// Dynamically import ThreeScene to ensure it's client-side only
const ThreeScene = dynamic(() => import('@/components/portfolio/ThreeScene'), {
  ssr: false,
  // Loading placeholder removed as it's a background element
});

export default function PortfolioPage() {
  const [filters, setFilters] = useState<Filters>({ category: '', technologies: [] });
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Set to true after initial mount on client
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const percentage = scrollHeight > 0 ? currentScrollY / scrollHeight : 0;
      setScrollPercentage(Math.min(1, Math.max(0, percentage))); // Clamp between 0 and 1
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);


  const filteredProjects = useMemo(() => {
    return projectsData.filter(project => {
      const categoryMatch = filters.category ? project.category === filters.category : true;
      const techMatch = filters.technologies.length > 0 
        ? filters.technologies.every(tech => project.technologies.includes(tech)) 
        : true;
      return categoryMatch && techMatch;
    });
  }, [filters]);

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({ category: '', technologies: [] });
  };
  
  const scrollToProjects = () => {
    document.getElementById('projects-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {isClient && <ThreeScene scrollPercentage={scrollPercentage} />}
      <div className="relative z-10 space-y-12"> {/* Content wrapper needs to be above background */}
        <section aria-labelledby="welcome-heading" className="text-center py-12 md:py-16 bg-gradient-to-br from-background/80 to-primary/5 rounded-xl shadow-inner backdrop-blur-sm">
          <div className="max-w-3xl mx-auto">
            <h1 id="welcome-heading" className="text-4xl md:text-5xl font-bold mb-6 text-primary">
              Hi
            </h1>
            <p className="text-lg md:text-xl text-foreground/80 mb-8">
              Explore a curated collection of my projects, blending creativity with cutting-edge technology. 
              Dive into interactive 3D experiences and discover innovative solutions.
            </p>
            <Button size="lg" onClick={scrollToProjects} className="rounded-full shadow-lg hover:shadow-primary/30 transition-shadow">
              View Projects <ArrowDown className="ml-2 h-5 w-5 animate-bounce" />
            </Button>
          </div>
        </section>

        {/* The original ThreeScene section is removed as it's now a background */}
        {/* 
        <section aria-labelledby="three-d-heading">
          <h2 id="three-d-heading" className="text-3xl font-semibold mb-6 text-center">
            Interactive 3D Showcase
          </h2>
          <ThreeScene /> // This instance is removed
           <p className="text-center mt-4 text-muted-foreground text-sm">
            Interact with the scene! Drag to rotate, scroll to zoom.
          </p>
        </section> 
        */}
         <p className="text-center -mt-8 text-muted-foreground text-sm">
            The background animates as you scroll!
          </p>


        <section id="projects-section" aria-labelledby="projects-heading" className="pt-8"> {/* Added pt-8 for spacing if needed */}
          <h2 id="projects-heading" className="text-3xl font-semibold mb-8 text-center">
            My Projects
          </h2>
          <ProjectFilter 
            filters={filters} 
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
          />
          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No projects match the current filters. Try adjusting your selection or reset filters.</p>
          )}
        </section>
      </div>
    </>
  );
}
