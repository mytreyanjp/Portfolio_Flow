
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ProjectCard from '@/components/portfolio/ProjectCard';
import ProjectFilter, { type Filters } from '@/components/portfolio/ProjectFilter';
import type { Project } from '@/data/projects';
import { getProjects, getUniqueCategoriesFromProjects } from '@/services/projectsService';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Palette, Code2, MessageSquare, FileTextIcon, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useName } from '@/contexts/NameContext';
import { translateText } from '@/ai/flows/translate-text-flow';
import Link from 'next/link';

const INITIAL_FILTERS: Filters = { category: '' };
const ORIGINAL_GREETING_PREFIX = "Hello ";
const ORIGINAL_GREETING_NO_NAME = "Hello there, ";
const ORIGINAL_NAME_FALLBACK = "Mytreyan here";
const ORIGINAL_MOTTO = "can create light outta a blackhole";

export default function PortfolioPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userName, detectedLanguage, isLoadingName } = useName();

  const [greetingPrefixText, setGreetingPrefixText] = useState(ORIGINAL_GREETING_PREFIX);
  const [greetingNoNameText, setGreetingNoNameText] = useState(ORIGINAL_GREETING_NO_NAME);
  const [nameFallbackText, setNameFallbackText] = useState(ORIGINAL_NAME_FALLBACK);
  const [mottoText, setMottoText] = useState(ORIGINAL_MOTTO);
  const [isTextProcessed, setIsTextProcessed] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoadingProjects(true);
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
      setIsLoadingProjects(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleScroll = () => {
      if (!hasScrolled) {
        setHasScrolled(true);
        window.removeEventListener('scroll', handleScroll);
      }
    };

    if (!hasScrolled) {
      window.addEventListener('scroll', handleScroll);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [hasScrolled]);


  useEffect(() => {
    setIsTextProcessed(false);

    if (isLoadingName) {
      return;
    }

    const processTextContent = async () => {
      if (detectedLanguage && detectedLanguage !== 'en') {
        try {
          const [
            translatedGreetingPrefix,
            translatedGreetingNoName,
            translatedNameFallback,
            translatedMotto,
          ] = await Promise.all([
            translateText({ textToTranslate: ORIGINAL_GREETING_PREFIX, targetLanguage: detectedLanguage }),
            translateText({ textToTranslate: ORIGINAL_GREETING_NO_NAME, targetLanguage: detectedLanguage }),
            translateText({ textToTranslate: ORIGINAL_NAME_FALLBACK, targetLanguage: detectedLanguage }),
            translateText({ textToTranslate: ORIGINAL_MOTTO, targetLanguage: detectedLanguage }),
          ]);
          setGreetingPrefixText(translatedGreetingPrefix.translatedText);
          setGreetingNoNameText(translatedGreetingNoName.translatedText);
          setNameFallbackText(translatedNameFallback.translatedText);
          setMottoText(translatedMotto.translatedText);
        } catch (e) {
          console.warn(`Translation to ${detectedLanguage} failed, falling back to original:`, e);
          setGreetingPrefixText(ORIGINAL_GREETING_PREFIX);
          setGreetingNoNameText(ORIGINAL_GREETING_NO_NAME);
          setNameFallbackText(ORIGINAL_NAME_FALLBACK);
          setMottoText(ORIGINAL_MOTTO);
        }
      } else {
        setGreetingPrefixText(ORIGINAL_GREETING_PREFIX);
        setGreetingNoNameText(ORIGINAL_GREETING_NO_NAME);
        setNameFallbackText(ORIGINAL_NAME_FALLBACK);
        setMottoText(ORIGINAL_MOTTO);
      }
      setIsTextProcessed(true);
    };

    processTextContent();
  }, [detectedLanguage, isLoadingName]);

  const displayGreeting = isLoadingName || !isTextProcessed
    ? "..."
    : userName
      ? `${greetingPrefixText}${userName}, ${nameFallbackText}`
      : `${greetingNoNameText}${nameFallbackText}`;

  const displayMotto = isLoadingName || !isTextProcessed ? "..." : mottoText;

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

  const isPageReady = !isLoadingProjects && !isLoadingName && isTextProcessed;

  if (!isPageReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">
          {isLoadingProjects ? "Loading projects..." : "Preparing content..."}
        </p>
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
    <div className="container mx-auto px-4 py-8">
      <header className="mb-12 text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-2">
          {displayGreeting}
        </h1>
        <p className="text-lg text-muted-foreground font-subtext italic max-w-2xl mx-auto mb-8">
          {displayMotto}
        </p>
      </header>

      <section
        className={cn(
          "mb-16 p-6 bg-card border border-border rounded-xl shadow-lg",
          "transition-all duration-700 ease-in-out",
          hasScrolled ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
        )}
      >
        <h2 className="text-2xl font-semibold text-center text-foreground mb-6">Explore &amp; Connect</h2>
        <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4">
          <Button
            asChild
            size="lg"
            className="bg-black text-primary-foreground hover:bg-black hover:scale-105 transition-transform duration-200 ease-out w-full sm:w-auto"
          >
            <Link href="/contact">
              <MessageSquare className="mr-2 h-5 w-5" /> Get in Touch
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            className="bg-black text-primary-foreground hover:bg-black hover:scale-105 transition-transform duration-200 ease-out w-full sm:w-auto"
          >
            <Link href="/resume">
              <FileTextIcon className="mr-2 h-5 w-5" /> View My Resume
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            className="bg-black text-primary-foreground hover:bg-black hover:scale-105 transition-transform duration-200 ease-out w-full sm:w-auto"
          >
            <Link href="/mr-m">
              <Bot className="mr-2 h-5 w-5" /> Meet Mr.M
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

      {filteredProjects.length === 0 && !isLoadingProjects && (
        <div className="text-center py-10">
          <Palette className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-xl text-muted-foreground">No projects match your current filters.</p>
          <p className="text-sm text-muted-foreground mt-2">Try adjusting or resetting the filters.</p>
        </div>
      )}

      {filteredProjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
          {filteredProjects.map((project, index) => (
            <ProjectCard key={project.id || index} project={project} index={index} />
          ))}
        </div>
      )}

      {projects.length > 0 && filteredProjects.length > 0 && !isLoadingProjects && (
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
