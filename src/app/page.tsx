
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ProjectCard from '@/components/portfolio/ProjectCard'; // Default import
import ProjectFilter, { type Filters } from '@/components/portfolio/ProjectFilter';
import type { Project } from '@/data/projects';
import { getProjects, getUniqueCategoriesFromProjects } from '@/services/projectsService';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Sailboat, Palette, Code2, Sparkles } from 'lucide-react'; 
import { cn } from '@/lib/utils';
import { useName } from '@/contexts/NameContext'; 
import { translateText } from '@/ai/flows/translate-text-flow'; 

const INITIAL_FILTERS: Filters = { category: '' };
const ORIGINAL_MAIN_TITLE = "Mytreyan Here";
const ORIGINAL_SUBTITLE = "Explore My Creations. A collection of my projects, showcasing a blend of creativity and technical skill. Use the filters to navigate through different categories.";

export default function PortfolioPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { userName, detectedLanguage } = useName();

  const [greetingPart, setGreetingPart] = useState("");
  const [mainTitlePart, setMainTitlePart] = useState(ORIGINAL_MAIN_TITLE);
  const [pageSubtitle, setPageSubtitle] = useState(ORIGINAL_SUBTITLE);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedProjects, fetchedCategories] = await Promise.all([
        getProjects(),
        getUniqueCategoriesFromProjects(),
      ]);
      
      if (fetchedProjects.length > 1) {
        setProjects(fetchedProjects.filter(p => p.id !== 'default-project-1'));
      } else {
         setProjects(fetchedProjects.filter(p => p.id !== 'default-project-1' || (fetchedProjects[0]?.title === 'Sample Project: Interactive Model' && fetchedProjects.length === 1)));
      }
      
      setAllCategories(fetchedCategories);
    } catch (err) {
      console.error('Error fetching portfolio data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load portfolio data.');
      setProjects([]); 
      setAllCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  useEffect(() => {
    if (userName) {
        setGreetingPart(`Hello ${userName}, `);
    } else {
        setGreetingPart("");
    }
  }, [userName]);


  useEffect(() => {
    const translateContent = async (text: string, targetLang: string) => {
      try {
        const result = await translateText({ textToTranslate: text, targetLanguage: targetLang });
        return result.translatedText;
      } catch (e) {
        console.warn(`Translation failed for "${text}" to ${targetLang}:`, e);
        return text; 
      }
    };

    if (detectedLanguage && detectedLanguage !== 'en') { 
      Promise.all([
        translateContent(ORIGINAL_MAIN_TITLE, detectedLanguage),
        translateContent(ORIGINAL_SUBTITLE, detectedLanguage),
      ]).then(([translatedMain, translatedSub]) => {
        setMainTitlePart(translatedMain);
        setPageSubtitle(translatedSub);
      });
    } else {
      setMainTitlePart(ORIGINAL_MAIN_TITLE);
      setPageSubtitle(ORIGINAL_SUBTITLE);
    }
  }, [detectedLanguage]);


  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const categoryMatch = filters.category ? project.categories.includes(filters.category) : true;
      return categoryMatch;
    });
  }, [projects, filters]);

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };
  
  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    if (pageRef.current) {
      observer.observe(pageRef.current);
    }
    return () => {
      if (pageRef.current && observer) observer.unobserve(pageRef.current);
    };
  }, []);


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading projects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center py-12 px-4">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Failed to Load Projects</h2>
        <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
        <Button onClick={fetchData} variant="outline">
          <Loader2 className="mr-2 h-4 w-4" /> Try Again
        </Button>
      </div>
    );
  }

  return (
    <div 
      ref={pageRef} 
      className={cn(
        "container mx-auto px-4 py-8 transition-opacity duration-700 ease-in-out",
        isVisible ? "opacity-100" : "opacity-0"
      )}
    >
      <header className="mb-12 text-center">
        <div className="inline-block mb-4 p-3 bg-primary/10 rounded-full">
          <Sparkles className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-3">
          {greetingPart}{mainTitlePart}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {pageSubtitle}
        </p>
      </header>

      <ProjectFilter 
        filters={filters} 
        onFilterChange={handleFilterChange} 
        onResetFilters={handleResetFilters}
        availableCategories={allCategories} 
      />

      {filteredProjects.length === 0 ? (
        <div className="text-center py-10">
          <Palette className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-xl text-muted-foreground">No projects match your current filters.</p>
          <p className="text-sm text-muted-foreground mt-2">Try adjusting or resetting the filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
          {filteredProjects.map((project, index) => (
            <ProjectCard key={project.id || index} project={project} index={index} />
          ))}
        </div>
      )}
      
      {projects.length > 0 && filteredProjects.length > 0 && (
         <div className="mt-16 text-center">
          <Code2 className="h-10 w-10 text-primary/70 mx-auto mb-3"/>
          <p className="text-muted-foreground text-sm">
            Found {filteredProjects.length} project{filteredProjects.length === 1 ? '' : 's'}. 
            {filters.category ? ` (Filtered by: ${filters.category})` : ''}
          </p>
        </div>
      )}
    </div>
  );
}
