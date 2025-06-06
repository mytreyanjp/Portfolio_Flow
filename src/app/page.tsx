
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef, type CSSProperties } from 'react';
import ProjectCard from '@/components/portfolio/ProjectCard';
import ProjectFilter, { type Filters } from '@/components/portfolio/ProjectFilter';
import type { Project } from '@/data/projects';
import { getProjects, getUniqueCategoriesFromProjects } from '@/services/projectsService';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Palette, Code2, MessageSquare, FileTextIcon, Bot, Eye as ViewIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useName } from '@/contexts/NameContext';
import { translateText } from '@/ai/flows/translate-text-flow';
import Link from 'next/link';
import { useTheme } from 'next-themes';

const INITIAL_FILTERS: Filters = { category: '' };

// New constants for personalized greeting
const ORIGINAL_GREETING_WITH_NAME_PREFIX = "Hello ";
const ORIGINAL_GREETING_WITH_NAME_SUFFIX = ", I'm Mytreyan"; // Comma is part of the suffix
const ORIGINAL_GREETING_WITHOUT_NAME = "Hello there, I'm Mytreyan";
const ORIGINAL_MOTTO = "can create light outta a blackhole";

const FLASHLIGHT_RADIUS = 150; 

interface CSSWithCustomProps extends React.CSSProperties {
  [key: `--${string}`]: string | number;
}

export default function PortfolioPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userName, detectedLanguage, isLoadingName } = useName();
  const { resolvedTheme } = useTheme();

  // State for translated text parts
  const [greetingWithNamePrefixText, setGreetingWithNamePrefixText] = useState(ORIGINAL_GREETING_WITH_NAME_PREFIX);
  const [greetingWithNameSuffixText, setGreetingWithNameSuffixText] = useState(ORIGINAL_GREETING_WITH_NAME_SUFFIX);
  const [greetingWithoutNameText, setGreetingWithoutNameText] = useState(ORIGINAL_GREETING_WITHOUT_NAME);
  // mottoText state removed, ORIGINAL_MOTTO will be used directly

  const [isTextProcessed, setIsTextProcessed] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const viewProjectsButtonRef = useRef<HTMLButtonElement>(null);

  const [isViewProjectsButtonClicked, setIsViewProjectsButtonClicked] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [buttonDynamicStyles, setButtonDynamicStyles] = useState<CSSWithCustomProps>({});

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const clicked = localStorage.getItem('viewProjectsButtonClicked');
      if (clicked === 'true') {
        setIsViewProjectsButtonClicked(true);
      }
    }
  }, []);

  useEffect(() => {
    if (!isClient || !viewProjectsButtonRef.current) return;

    const isFlashlightEffectActive = resolvedTheme === 'dark' && !isViewProjectsButtonClicked;

    if (!isFlashlightEffectActive) {
      setButtonDynamicStyles({}); 
      return;
    }

    const initialStyles: CSSWithCustomProps = {
      '--flashlight-radius': '0px',
      '--flashlight-x': '0px',
      '--flashlight-y': '0px',
    };
    setButtonDynamicStyles(initialStyles);

    const handleMouseMove = (event: MouseEvent) => {
      if (!viewProjectsButtonRef.current) return; 
      const rect = viewProjectsButtonRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const newMoveStyles: CSSWithCustomProps = {
        '--flashlight-radius': `${FLASHLIGHT_RADIUS}px`,
        '--flashlight-x': `${x}px`,
        '--flashlight-y': `${y}px`,
      };
      setButtonDynamicStyles(newMoveStyles);
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isClient, resolvedTheme, isViewProjectsButtonClicked]);


  useEffect(() => {
    const handleMouseMoveHeading = (event: MouseEvent) => {
      if (headingRef.current) {
        const gradientX = (event.clientX / window.innerWidth) * 100;
        const gradientY = (event.clientY / window.innerHeight) * 100;
        headingRef.current.style.setProperty('--gradient-center-x', `${gradientX}%`);
        headingRef.current.style.setProperty('--gradient-center-y', `${gradientY}%`);
      }
    };
    if (isClient) {
      window.addEventListener('mousemove', handleMouseMoveHeading);
    }
    return () => {
      if (isClient) {
        window.removeEventListener('mousemove', handleMouseMoveHeading);
      }
    };
  }, [isClient]);

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
      if (!hasScrolled && isClient) {
        setHasScrolled(true);
        window.removeEventListener('scroll', handleScroll);
      }
    };

    if (!hasScrolled && isClient) {
      window.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (isClient) {
        window.removeEventListener('scroll', handleScroll);
      }
    };
  }, [hasScrolled, isClient]);


  useEffect(() => {
    setIsTextProcessed(false);

    if (isLoadingName || !isClient) {
      return;
    }

    const processTextContent = async () => {
      if (detectedLanguage && detectedLanguage !== 'en') {
        try {
          const [
            translatedGreetingWithNamePrefix,
            translatedGreetingWithNameSuffix,
            translatedGreetingWithoutName,
            // Motto translation removed
          ] = await Promise.all([
            translateText({ textToTranslate: ORIGINAL_GREETING_WITH_NAME_PREFIX, targetLanguage: detectedLanguage }),
            translateText({ textToTranslate: ORIGINAL_GREETING_WITH_NAME_SUFFIX, targetLanguage: detectedLanguage }),
            translateText({ textToTranslate: ORIGINAL_GREETING_WITHOUT_NAME, targetLanguage: detectedLanguage }),
            // translateText({ textToTranslate: ORIGINAL_MOTTO, targetLanguage: detectedLanguage }), // Removed
          ]);
          setGreetingWithNamePrefixText(translatedGreetingWithNamePrefix.translatedText);
          setGreetingWithNameSuffixText(translatedGreetingWithNameSuffix.translatedText);
          setGreetingWithoutNameText(translatedGreetingWithoutName.translatedText);
          // setMottoText(translatedMotto.translatedText); // Removed
        } catch (e) {
          console.warn(`Translation to ${detectedLanguage} failed, falling back to original:`, e);
          setGreetingWithNamePrefixText(ORIGINAL_GREETING_WITH_NAME_PREFIX);
          setGreetingWithNameSuffixText(ORIGINAL_GREETING_WITH_NAME_SUFFIX);
          setGreetingWithoutNameText(ORIGINAL_GREETING_WITHOUT_NAME);
          // setMottoText(ORIGINAL_MOTTO); // Removed
        }
      } else {
        // Set to original English strings if no (other) language detected or if it's English
        setGreetingWithNamePrefixText(ORIGINAL_GREETING_WITH_NAME_PREFIX);
        setGreetingWithNameSuffixText(ORIGINAL_GREETING_WITH_NAME_SUFFIX);
        setGreetingWithoutNameText(ORIGINAL_GREETING_WITHOUT_NAME);
        // setMottoText(ORIGINAL_MOTTO); // Removed
      }
      setIsTextProcessed(true);
    };

    processTextContent();
  }, [detectedLanguage, isLoadingName, isClient]);

  const displayGreeting = !isClient || isLoadingName || !isTextProcessed
    ? "..."
    : userName
      ? `${greetingWithNamePrefixText}${userName}${greetingWithNameSuffixText}`
      : `${greetingWithoutNameText}`;

  const displayMotto = !isClient || isLoadingName ? "..." : ORIGINAL_MOTTO; // Directly use ORIGINAL_MOTTO

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

  const handleViewProjectsClick = () => {
    setIsViewProjectsButtonClicked(true);
    if (isClient) {
      localStorage.setItem('viewProjectsButtonClicked', 'true');
      const projectsSection = document.getElementById('project-filters-section');
      if (projectsSection) {
        projectsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };
  
  const isPageReady = isClient && !isLoadingProjects && !isLoadingName && isTextProcessed;


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

  const showFlashlightEffect = isClient && resolvedTheme === 'dark' && !isViewProjectsButtonClicked;

  return (
    <div className="container mx-auto px-4 pt-16 pb-8">
      <header className="mb-8 text-center">
        <h1
          ref={headingRef}
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold text-transparent bg-clip-text mb-2 relative overflow-hidden"
          style={{
            backgroundImage: 'radial-gradient(circle at var(--gradient-center-x, 50%) var(--gradient-center-y, 50%), hsl(var(--accent)) 10%, hsl(var(--primary)) 90%)',
          }}
        >
          {displayGreeting}
        </h1>
        <p className="text-lg text-muted-foreground font-subtext italic max-w-2xl mx-auto">
          {displayMotto}
        </p>
      </header>

      <div
        className={cn(
            "flex justify-center mb-12", 
            "transition-opacity duration-500 ease-in-out",
            "opacity-100" 
        )}
      >
        <Button
            ref={viewProjectsButtonRef}
            variant="ghost"
            size="lg"
            className={cn(
              "w-full sm:w-auto",
              "transition-transform duration-300 ease-out hover:scale-105", 
              "text-foreground dark:text-primary-foreground", 
              "hover:bg-transparent dark:hover:bg-transparent", 
              showFlashlightEffect ? "flashlight-clip" : "opacity-100 pointer-events-auto"
            )}
            style={showFlashlightEffect ? buttonDynamicStyles : {}}
            onClick={handleViewProjectsClick}
          >
            <ViewIcon className="mr-2 h-5 w-5" /> View Projects
        </Button>
      </div>

      <section
        aria-label="Quick navigation links"
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
            className={cn(
              "w-full sm:w-auto transition-transform duration-200 ease-out hover:scale-105",
              "bg-card text-foreground hover:bg-card hover:text-foreground", 
              "dark:bg-black dark:text-primary-foreground dark:hover:bg-black dark:hover:text-primary-foreground" 
            )}
          >
            <Link href="/contact">
              <MessageSquare className="mr-2 h-5 w-5" /> Get in Touch
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            className={cn(
              "w-full sm:w-auto transition-transform duration-200 ease-out hover:scale-105",
              "bg-card text-foreground hover:bg-card hover:text-foreground",
              "dark:bg-black dark:text-primary-foreground dark:hover:bg-black dark:hover:text-primary-foreground"
            )}
          >
            <Link href="/resume">
              <FileTextIcon className="mr-2 h-5 w-5" /> View My Resume
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            className={cn(
              "w-full sm:w-auto transition-transform duration-200 ease-out hover:scale-105",
              "bg-card text-foreground hover:bg-card hover:text-foreground",
              "dark:bg-black dark:text-primary-foreground dark:hover:bg-black dark:hover:text-primary-foreground"
            )}
          >
            <Link href="/mr-m">
              <Bot className="mr-2 h-5 w-5" /> Meet Mr.M
            </Link>
          </Button>
        </div>
      </section>
      
      <div id="project-filters-section">
        <ProjectFilter
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          availableCategories={allCategories}
        />
      </div>

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

