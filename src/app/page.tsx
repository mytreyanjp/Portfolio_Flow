
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ProjectCard from '@/components/portfolio/ProjectCard';
import ProjectFilter, { type Filters } from '@/components/portfolio/ProjectFilter';
import type { Project } from '@/data/projects';
import { getProjects, getUniqueCategoriesFromProjects } from '@/services/projectsService';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Palette, Code2, Sparkles, MessageSquare, FileTextIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useName } from '@/contexts/NameContext';
import { translateText } from '@/ai/flows/translate-text-flow';
import Link from 'next/link';

const INITIAL_FILTERS: Filters = { category: '' };
const ORIGINAL_GREETING_PREFIX = "Hello "; // Adjusted for "{userName}, "
const ORIGINAL_GREETING_NO_NAME = "Hello there, "; // Used when no userName
const ORIGINAL_NAME_FALLBACK = "Mytreyan here";
const ORIGINAL_MOTTO = "Crafting digital experiences, one line of code at a time.";

export default function PortfolioPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { userName, detectedLanguage, isLoadingName } = useName(); // Added isLoadingName

  const [greetingPrefixText, setGreetingPrefixText] = useState(ORIGINAL_GREETING_PREFIX);
  const [greetingNoNameText, setGreetingNoNameText] = useState(ORIGINAL_GREETING_NO_NAME);
  const [nameFallbackText, setNameFallbackText] = useState(ORIGINAL_NAME_FALLBACK);
  const [mottoText, setMottoText] = useState(ORIGINAL_MOTTO);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedProjects, fetchedCategories] = await Promise.all([
        getProjects(),
        getUniqueCategoriesFromProjects(),
      ]);

      setProjects(fetchedProjects);
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
    if (isLoadingName) { // Don't run translation if context is still loading
        // Optionally set to placeholders if desired, or just wait
        // setGreetingPrefixText("...");
        // setGreetingNoNameText("...");
        // setNameFallbackText("...");
        // setMottoText("...");
        return;
    }

    const translateContent = async (text: string, targetLang: string) => {
      if (!text || !targetLang || targetLang === 'en') return text;
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
        translateContent(ORIGINAL_GREETING_PREFIX, detectedLanguage),
        translateContent(ORIGINAL_GREETING_NO_NAME, detectedLanguage),
        translateContent(ORIGINAL_NAME_FALLBACK, detectedLanguage),
        translateContent(ORIGINAL_MOTTO, detectedLanguage),
      ]).then(([translatedGreetingPrefix, translatedGreetingNoName, translatedNameFallback, translatedMotto]) => {
        setGreetingPrefixText(translatedGreetingPrefix);
        setGreetingNoNameText(translatedGreetingNoName);
        setNameFallbackText(translatedNameFallback);
        setMottoText(translatedMotto);
      });
    } else {
      setGreetingPrefixText(ORIGINAL_GREETING_PREFIX);
      setGreetingNoNameText(ORIGINAL_GREETING_NO_NAME);
      setNameFallbackText(ORIGINAL_NAME_FALLBACK);
      setMottoText(ORIGINAL_MOTTO);
    }
  }, [detectedLanguage, isLoadingName]); // Added isLoadingName dependency

  const displayGreeting = isLoadingName
    ? "..." // Placeholder while name context is loading
    : userName
      ? `${greetingPrefixText}${userName}, ${nameFallbackText}`
      : `${greetingNoNameText}${nameFallbackText}`;

  const displayMotto = isLoadingName ? "..." : mottoText; // Placeholder for motto


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
    const currentRef = pageRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }
    return () => {
      if (currentRef && observer) {
        observer.unobserve(currentRef);
      }
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
        <h1 className="text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-2">
          {displayGreeting}
        </h1>
        <p className="text-lg text-muted-foreground font-subtext italic max-w-2xl mx-auto mb-8">
          {displayMotto}
        </p>
      </header>

      <section className="mb-16 p-6 bg-card border border-border rounded-xl shadow-lg">
        <h2 className="text-2xl font-semibold text-center text-foreground mb-3">Explore &amp; Connect</h2>
        <p className="text-muted-foreground text-center max-w-xl mx-auto mb-6">
          Dive deeper into my work, or get in touch to discuss potential collaborations, projects, or just to say hi!
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button asChild size="lg" className="hover:scale-105 transition-transform duration-200 ease-out hover:bg-primary w-full sm:w-auto">
            <Link href="/contact">
              <MessageSquare className="mr-2 h-5 w-5" /> Get in Touch
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="hover:scale-105 transition-transform duration-200 ease-out hover:bg-background w-full sm:w-auto">
            <Link href="/resume">
              <FileTextIcon className="mr-2 h-5 w-5" /> View My Resume
            </Link>
          </Button>
        </div>
      </section>

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
