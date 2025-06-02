
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { categories as projectCategories, allTechnologies, Project } from '@/data/projects';
import React, { useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

// Ensure projectCategories is correctly typed for z.enum
const categoryEnumValues = projectCategories as [string, ...string[]];

const addProjectSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().min(10, 'Short description must be at least 10 characters.'),
  longDescription: z.string().optional(),
  modelPath: z.string()
    .refine(val => {
      if (val === '') return true; // Allow empty string

      // Check for local path
      if (val.startsWith('/models/') && val.endsWith('.glb')) {
        return true;
      }

      // Check for absolute URL
      if ((val.startsWith('http://') || val.startsWith('https://')) && val.endsWith('.glb')) {
        try {
          new URL(val); // Validate if it's a structurally sound URL
          return true;
        } catch (e) {
          return false; // Invalid URL structure
        }
      }
      return false; // Doesn't match either pattern
    }, {
      message: "Model path must be a valid HTTP/HTTPS URL ending with .glb (e.g., https://cdn.example.com/model.glb), a local path (e.g., /models/my_model.glb), or empty."
    })
    .optional(),
  dataAiHint: z.string()
    .max(50, "AI hint too long (max 50 chars).")
    .refine(val => val === '' || val.split(' ').length <= 2, {
      message: "AI hint should be one or two keywords, or empty.",
    }).optional(),
  category: z.enum(categoryEnumValues),
  technologies: z.string().min(1, 'Please list at least one technology (comma-separated).'),
  liveLink: z.string().url({ message: "Please enter a valid URL." }).or(z.literal('')).optional(),
  sourceLink: z.string().url({ message: "Please enter a valid URL." }).or(z.literal('')).optional(),
  imageUrl: z.string().url({ message: "Please enter a valid URL for the image." }).or(z.literal('')).optional(),
});

export type AddProjectFormValues = z.infer<typeof addProjectSchema>;

export default function AddProjectForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AddProjectFormValues>({
    resolver: zodResolver(addProjectSchema),
    defaultValues: {
      title: '',
      description: '',
      longDescription: '',
      modelPath: '',
      dataAiHint: '',
      category: projectCategories[0], // Default to the first category
      technologies: '',
      liveLink: '',
      sourceLink: '',
      imageUrl: '',
    },
  });

  async function onSubmit(data: AddProjectFormValues) {
    setIsSubmitting(true);
    try {
      const projectData: Omit<Project, 'id'> & { createdAt: any } = {
        title: data.title,
        description: data.description,
        longDescription: data.longDescription || '',
        model: data.modelPath || undefined, // Store as undefined if empty
        dataAiHint: data.dataAiHint || (data.modelPath ? '3d model' : 'project image'),
        category: data.category,
        technologies: data.technologies.split(',').map(tech => tech.trim()).filter(Boolean),
        liveLink: data.liveLink || undefined,
        sourceLink: data.sourceLink || undefined,
        imageUrl: data.imageUrl || undefined, // Store as undefined if empty
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'projects'), projectData);
      
      toast({
        title: 'Project Added!',
        description: `Project "${data.title}" has been successfully saved to the database with ID: ${docRef.id}.`,
        duration: 7000,
      });
      if (data.modelPath && data.modelPath.startsWith('/models/')) {
        toast({
            title: '3D Model Reminder',
            description: `Ensure your model ${data.modelPath} is placed in the public/models directory.`,
            duration: 7000,
        });
      }
      form.reset();
    } catch (error) {
      console.error("Error adding project to Firestore: ", error);
      toast({
        title: 'Error Saving Project',
        description: `Failed to save project to the database. ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
        duration: 7000,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Title</FormLabel>
              <FormControl>
                <Input placeholder="My Awesome Project" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Short Description</FormLabel>
              <FormControl>
                <Textarea placeholder="A brief summary of the project (shows on card)." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="longDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Long Description (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Detailed explanation of the project (for project detail page)." {...field} rows={5} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://placehold.co/600x400.png" {...field} />
              </FormControl>
              <FormDescription>
                A direct link to an image for the project card. If a model path is also provided, the model viewer will be prioritized.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="modelPath"
          render={({ field }) => (
            <FormItem>
              <FormLabel>3D Model Path (Optional, .glb format)</FormLabel>
              <FormControl>
                <Input placeholder="/models/your-model.glb or https://example.com/model.glb" {...field} />
              </FormControl>
              <FormDescription>
                Path to the .glb model file. Can be a local path within your <code>public/models</code> directory (e.g., <code>/models/cool-robot.glb</code>) or a full URL (e.g., <code>https://example.com/model.glb</code>). Leave empty if not using a 3D model.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="dataAiHint"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image AI Hint (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., futuristic city" {...field} />
              </FormControl>
              <FormDescription>
                One or two keywords for AI image generation/search if a placeholder/fallback image is used.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {projectCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="technologies"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Technologies Used</FormLabel>
              <FormControl>
                <Input placeholder="React, Next.js, Three.js" {...field} />
              </FormControl>
              <FormDescription>
                Comma-separated list of technologies. (e.g., {allTechnologies.slice(0,3).join(', ')}, ...)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="liveLink"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Live Demo Link (Optional)</FormLabel>
                <FormControl>
                  <Input type="url" placeholder="https://yourproject.live" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sourceLink"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source Code Link (Optional)</FormLabel>
                <FormControl>
                  <Input type="url" placeholder="https://github.com/your/repo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          className={cn(
            "w-full text-lg py-6",
            "hover:scale-105 transition-transform duration-200 ease-out hover:bg-primary"
          )}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Adding Project...
            </>
          ) : (
            <>
              <Save className="mr-2 h-5 w-5" />
              Add Project
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
