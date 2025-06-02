
import Link from 'next/link';
import type { Project } from '@/data/projects';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, Github, Image as ImageIcon, Loader2 } from 'lucide-react';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
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
      setEffectiveImageUrl(FALLBACK_IMAGE_URL); // Fallback on error
    } finally {
      setIsGeneratingAiImage(false);
    }
  }, [project.description, project.title, toast, aiImageGenerated]);

  useEffect(() => {
    setModelLoadFailedOrMissing(!project.model);
    setEffectiveImageUrl(project.imageUrl || null);
    setAiImageGenerated(false); // Reset AI image generation status when project changes
  }, [project]);

  useEffect(() => {
    if (modelLoadFailedOrMissing && !project.imageUrl && project.description && !aiImageGenerated && !isGeneratingAiImage) {
      triggerAiImageGeneration();
    } else if (modelLoadFailedOrMissing && !project.imageUrl && !project.description) {
      setEffectiveImageUrl(FALLBACK_IMAGE_URL);
    } else if (modelLoadFailedOrMissing && project.imageUrl) {
      setEffectiveImageUrl(project.imageUrl);
    }

  }, [modelLoadFailedOrMissing, project.imageUrl, project.description, triggerAiImageGeneration, aiImageGenerated, isGeneratingAiImage]);


  const handleModelErrorOrMissing = useCallback(() => {
    setModelLoadFailedOrMissing(true);
  }, []);

  const projectCategories = project.categories || [];
  const displayModelViewer = project.model && !modelLoadFailedOrMissing;

  return (
    <Card
      ref={cardRef}
      className={cn(
        "flex flex-col h-full overflow-hidden transform transition-all duration-300 hover:scale-[1.02] animate-fadeInUpScale",
        "w-full max-w-[363px] mx-auto" 
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="relative w-full h-48 mb-4 rounded-t-md overflow-hidden group bg-muted/70 dark:bg-muted">
        {displayModelViewer ? (
          <ProjectModelViewer
            modelPath={project.model}
            containerRef={cardRef}
            onModelErrorOrMissing={handleModelErrorOrMissing}
          />
        ) : isGeneratingAiImage ? (
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
            onError={() => setEffectiveImageUrl(FALLBACK_IMAGE_URL)} // Fallback if image URL itself is broken
          />
        ) : (
           <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
            <ImageIcon className="h-10 w-10 mb-2 text-gray-400" />
            No preview available
          </div>
        )}
      </div>
      <CardHeader className="pt-0">
        <CardTitle className="text-xl font-semibold">{project.title}</CardTitle>
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
      <CardFooter className="flex flex-col sm:flex-row sm:justify-start gap-2 pt-4 border-t">
        {project.liveLink && (
          <Button
            asChild
            variant="default"
            size="sm"
            className="w-full sm:w-auto transition-transform duration-200 ease-out hover:scale-105 hover:bg-primary"
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
            className="w-full sm:w-auto transition-transform duration-200 ease-out hover:scale-105 hover:bg-background"
          >
            <Link href={project.sourceLink} target="_blank" rel="noopener noreferrer">
              <span className="flex items-center">
                <Github className="mr-1 h-4 w-4" /> Source
              </span>
            </Link>
          </Button>
        )}
         {!project.liveLink && !project.sourceLink && (
           <Button variant="ghost" size="sm" disabled>No links available</Button>
         )}
      </CardFooter>
    </Card>
  );
}

