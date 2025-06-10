
import Link from 'next/link';
import type { Project } from '@/data/projects';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, Github, Image as ImageIcon, Loader2, FileText, Grid3X3 } from 'lucide-react'; // Added Grid3X3 for Clooned
import React, { useRef, useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Script from 'next/script'; // Import next/script
import { cn } from '@/lib/utils';
import { generateProjectImage } from '@/ai/flows/generate-project-image-flow';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const ProjectModelViewer = dynamic(() => import('./ProjectModelViewer'), {
  ssr: false,
  loading: () => <div className="w-full h-48 bg-muted rounded-t-md animate-pulse" />,
});

interface ProjectCardProps {
  project: Project;
  index: number;
}

const FALLBACK_IMAGE_URL = 'https://placehold.co/600x400.png?text=Preview+Unavailable';
const CLOONED_SCRIPT_SRC = "https://clooned.com/wp-content/uploads/cloons/scripts/clooned.js";

export default function ProjectCard({ project, index }: ProjectCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [effectiveImageUrl, setEffectiveImageUrl] = useState<string | null>(project.imageUrl || null);
  const [isGeneratingAiImage, setIsGeneratingAiImage] = useState(false);
  const [modelLoadFailedOrMissing, setModelLoadFailedOrMissing] = useState(!project.model);
  const [aiImageGenerated, setAiImageGenerated] = useState(false);

  const triggerAiImageGeneration = useCallback(async () => {
    if (!project.description || aiImageGenerated) return;

    setIsGeneratingAiImage(true);
    try {
      const result = await generateProjectImage({ description: project.description });
      setEffectiveImageUrl(result.imageUrl);
      setAiImageGenerated(true);
    } catch (error) {
      console.error("AI Image Generation Error:", error);
      toast({
        title: "AI Image Error",
        description: `Could not generate image for "${project.title}". Using placeholder.`,
        variant: "destructive",
      });
      setEffectiveImageUrl(FALLBACK_IMAGE_URL); 
    } finally {
      setIsGeneratingAiImage(false);
    }
  }, [project.description, project.title, toast, aiImageGenerated]);

  useEffect(() => {
    // Reset states when project prop changes
    setModelLoadFailedOrMissing(!project.model);
    setEffectiveImageUrl(project.imageUrl || null);
    setAiImageGenerated(false);
    // Do not automatically trigger AI generation here if cloonedOID is present
  }, [project]);

  useEffect(() => {
    // This effect handles image fallback logic if NOT using Clooned
    if (project.cloonedOID) return; // Skip if Clooned is used

    if (modelLoadFailedOrMissing && !project.imageUrl && project.description && !aiImageGenerated && !isGeneratingAiImage) {
      triggerAiImageGeneration();
    } else if (modelLoadFailedOrMissing && !project.imageUrl && !project.description) {
      setEffectiveImageUrl(FALLBACK_IMAGE_URL);
    } else if (modelLoadFailedOrMissing && project.imageUrl) {
      setEffectiveImageUrl(project.imageUrl);
    }
  }, [
    project.cloonedOID, 
    modelLoadFailedOrMissing, 
    project.imageUrl, 
    project.description, 
    triggerAiImageGeneration, 
    aiImageGenerated, 
    isGeneratingAiImage
  ]);


  const handleModelErrorOrMissing = useCallback(() => {
    setModelLoadFailedOrMissing(true);
  }, []);

  const projectCategories = project.categories || [];
  
  const useCloonedViewer = !!project.cloonedOID;
  const useThreeJSViewer = !useCloonedViewer && !!project.model && !modelLoadFailedOrMissing;
  const showImageFallback = !useCloonedViewer && !useThreeJSViewer;

  return (
    <Card
      ref={cardRef}
      className={cn(
        "flex flex-col h-full overflow-hidden transform transition-all duration-300 hover:scale-[1.02] animate-fadeInUpScale",
        "w-full max-w-[363px] mx-auto" 
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="relative w-full h-48 mb-4 rounded-t-md overflow-hidden group bg-muted/70 dark:bg-muted flex items-center justify-center">
        {useCloonedViewer && (
          <>
            <Script src={CLOONED_SCRIPT_SRC} strategy="lazyOnload" />
            {/* Ensure the clooned-object and its container fill the space */}
            <div className="w-full h-full clooned-object-container">
              <clooned-object features="lsc;dt;fs" oid={project.cloonedOID} style={{ width: '100%', height: '100%', display: 'block' }}></clooned-object>
            </div>
          </>
        )}
        {useThreeJSViewer && (
          <ProjectModelViewer
            modelPath={project.model}
            containerRef={cardRef}
            onModelErrorOrMissing={handleModelErrorOrMissing}
          />
        )}
        {showImageFallback && (
          isGeneratingAiImage ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground text-sm bg-muted/50 dark:bg-muted/80">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              Generating Preview...
            </div>
          ) : effectiveImageUrl ? (
            <img
              src={effectiveImageUrl}
              alt={project.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={project.dataAiHint || project.categories.join(' ') || 'project image'}
              onError={() => {
                if (effectiveImageUrl !== FALLBACK_IMAGE_URL) { // Prevent infinite loop if fallback itself fails
                    setEffectiveImageUrl(FALLBACK_IMAGE_URL);
                }
              }}
            />
          ) : (
             <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
              <ImageIcon className="h-10 w-10 mb-2 text-gray-400" />
              No preview available
            </div>
          )
        )}
      </div>
      <CardHeader className="pt-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">{project.title}</CardTitle>
          {useCloonedViewer && <Grid3X3 className="h-5 w-5 text-primary" title="Clooned 3D View" />}
        </div>
        <CardDescription className="text-sm h-16 overflow-hidden">{project.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="mb-3">
          <h4 className="text-xs font-medium text-muted-foreground mb-1">Categories</h4>
          <div className="flex flex-wrap gap-1">
            {projectCategories.length > 0 ? (
              projectCategories.slice(0, 3).map((cat) => (
                <Badge key={cat} variant="secondary" className="text-xs">{cat}</Badge>
              ))
            ) : (
              <Badge variant="secondary" className="text-xs">Uncategorized</Badge>
            )}
            {projectCategories.length > 3 && <Badge variant="secondary" className="text-xs">...</Badge>}
          </div>
        </div>
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1">Technologies</h4>
          <div className="flex flex-wrap gap-1">
            {project.technologies.slice(0, 4).map((tech) => (
              <Badge key={tech} variant="outline" className="text-xs">
                {tech}
              </Badge>
            ))}
            {project.technologies.length > 4 && <Badge variant="outline" className="text-xs">...</Badge>}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap justify-start gap-2 pt-4 border-t">
        {project.liveLink && (
          <Button
            asChild
            variant="default"
            size="sm"
            className="flex-grow sm:flex-grow-0 transition-transform duration-200 ease-out hover:scale-105 hover:bg-primary"
          >
            <Link href={project.liveLink} target="_blank" rel="noopener noreferrer">
              <span className="flex items-center">
                Live Demo <ArrowUpRight className="ml-1 h-4 w-4" />
              </span>
            </Link>
          </Button>
        )}
        {project.sourceLink && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="flex-grow sm:flex-grow-0 transition-transform duration-200 ease-out hover:scale-105 hover:bg-background"
          >
            <Link href={project.sourceLink} target="_blank" rel="noopener noreferrer">
              <span className="flex items-center">
                <Github className="mr-1 h-4 w-4" /> Source
              </span>
            </Link>
          </Button>
        )}
        {project.documentationLink && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="flex-grow sm:flex-grow-0 transition-transform duration-200 ease-out hover:scale-105 hover:bg-background"
          >
            <Link href={project.documentationLink} target="_blank" rel="noopener noreferrer">
              <span className="flex items-center">
                <FileText className="mr-1 h-4 w-4" /> Docs
              </span>
            </Link>
          </Button>
        )}
         {!project.liveLink && !project.sourceLink && !project.documentationLink && (
           <Button variant="ghost" size="sm" disabled className="w-full sm:w-auto">No links available</Button>
         )}
      </CardFooter>
    </Card>
  );
}
