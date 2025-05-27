
import Link from 'next/link';
import type { Project } from '@/data/projects';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, Github } from 'lucide-react';
import React, { useRef } from 'react'; // Import useRef
import dynamic from 'next/dynamic';

// Dynamically import ProjectModelViewer to ensure Three.js is client-side only
const ProjectModelViewer = dynamic(() => import('./ProjectModelViewer'), {
  ssr: false,
  loading: () => <div className="w-full h-48 bg-muted rounded-t-md animate-pulse" />,
});

interface ProjectCardProps {
  project: Project;
  index: number;
}

export default function ProjectCard({ project, index }: ProjectCardProps) {
  const cardRef = useRef<HTMLDivElement>(null); // Ref for the card itself

  return (
    <Card 
      ref={cardRef} // Assign ref to the card
      className="flex flex-col h-full overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:scale-[1.02] animate-fadeInUpScale"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="relative w-full h-48 mb-4 rounded-t-md overflow-hidden group bg-muted">
        {project.modelUrl ? (
          <ProjectModelViewer modelUrl={project.modelUrl} containerRef={cardRef} />
        ) : project.imageUrl ? (
          // Fallback to image if modelUrl is not provided
          <img // Using <img> for simplicity, next/image can be used if needed
            src={project.imageUrl}
            alt={project.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={project.dataAiHint}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
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
          <h4 className="text-xs font-medium text-muted-foreground mb-1">Category</h4>
          <Badge variant="secondary">{project.category}</Badge>
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
      <CardFooter className="flex justify-start space-x-2 pt-4 border-t">
        {project.liveLink && (
          <Button asChild variant="default" size="sm">
            <Link href={project.liveLink} target="_blank" rel="noopener noreferrer">
              Live Demo <ArrowUpRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        )}
        {project.sourceLink && (
          <Button asChild variant="outline" size="sm">
            <Link href={project.sourceLink} target="_blank" rel="noopener noreferrer">
              <Github className="mr-1 h-4 w-4" /> Source
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
