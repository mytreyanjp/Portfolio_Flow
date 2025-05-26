import Image from 'next/image';
import Link from 'next/link';
import type { Project } from '@/data/projects';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, Github } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  index: number; // Added index for animation delay
}

export default function ProjectCard({ project, index }: ProjectCardProps) {
  return (
    <Card 
      className="flex flex-col h-full overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:scale-[1.02] animate-fadeInUpScale"
      style={{ animationDelay: `${index * 100}ms` }} // Staggered animation
    >
      <CardHeader>
        <div className="relative w-full h-48 mb-4 rounded-t-md overflow-hidden group"> {/* Added group for image scale on card hover */}
          <Image
            src={project.imageUrl}
            alt={project.title}
            layout="fill"
            objectFit="cover"
            className="transition-transform duration-300 group-hover:scale-105" // Image scales on card hover now
            data-ai-hint={project.dataAiHint}
          />
        </div>
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
