
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
import { useToast } from '@/hooks/use-toast';
import { allTechnologies, Project } from '@/data/projects';
import React, { useState, useEffect } from 'react';
import { Loader2, Save, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
// Combobox is no longer used here for categories

const addProjectSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().min(10, 'Short description must be at least 10 characters.'),
  longDescription: z.string().optional(),
  modelPath: z.string()
    .refine(val => {
      if (val === '') return true;
      if (val.startsWith('/models/') && val.endsWith('.glb')) return true;
      if ((val.startsWith('http://') || val.startsWith('https://')) && val.endsWith('.glb')) {
        try {
          new URL(val);
          return true;
        } catch (e) {
          return false;
        }
      }
      return false;
    }, {
      message: "Model path must be a valid HTTP/HTTPS URL ending with .glb (e.g., https://cdn.example.com/model.glb), a local path (e.g., /models/my_model.glb), or empty."
    })
    .optional(),
  dataAiHint: z.string()
    .max(50, "AI hint too long (max 50 chars).")
    .refine(val => val === '' || val.split(' ').length <= 2, {
      message: "AI hint should be one or two keywords, or empty.",
    }).optional(),
  categories: z.string().min(1, 'Please list at least one category (comma-separated).'), // Changed from category
  technologies: z.string().min(1, 'Please list at least one technology (comma-separated).'),
  liveLink: z.string().url({ message: "Please enter a valid URL." }).or(z.literal('')).optional(),
  sourceLink: z.string().url({ message: "Please enter a valid URL." }).or(z.literal('')).optional(),
  imageUrl: z.string().url({ message: "Please enter a valid URL for the image." }).or(z.literal('')).optional(),
});

export type AddProjectFormValues = z.infer<typeof addProjectSchema>;

interface AddProjectFormProps {
  onProjectAdded: (newProjectData: Omit<Project, 'id'> & { id?: string }) => void; // Allow id to be optional for new projects
  editingProject?: Project | null;
  onProjectUpdated?: (updatedProjectData: Project) => void;
  // availableCategories prop is removed as we use a text input now
}

export default function AddProjectForm({ onProjectAdded, editingProject, onProjectUpdated }: AddProjectFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!editingProject;

  const form = useForm<AddProjectFormValues>({
    resolver: zodResolver(addProjectSchema),
    defaultValues: {
      title: '',
      description: '',
      longDescription: '',
      modelPath: '',
      dataAiHint: '',
      categories: '', // Changed from category
      technologies: '',
      liveLink: '',
      sourceLink: '',
      imageUrl: '',
    },
  });

  useEffect(() => {
    if (isEditMode && editingProject) {
      form.reset({
        title: editingProject.title || '',
        description: editingProject.description || '',
        longDescription: editingProject.longDescription || '',
        modelPath: editingProject.model || '',
        dataAiHint: editingProject.dataAiHint || '',
        categories: editingProject.categories ? editingProject.categories.join(', ') : '', // Join array for input
        technologies: editingProject.technologies ? editingProject.technologies.join(', ') : '',
        liveLink: editingProject.liveLink || '',
        sourceLink: editingProject.sourceLink || '',
        imageUrl: editingProject.imageUrl || '',
      });
    } else {
      form.reset({
        title: '',
        description: '',
        longDescription: '',
        modelPath: '',
        dataAiHint: '',
        categories: '',
        technologies: '',
        liveLink: '',
        sourceLink: '',
        imageUrl: '',
      });
    }
  }, [editingProject, form, isEditMode]);


  async function onSubmit(data: AddProjectFormValues) {
    setIsSubmitting(true);
    try {
      const techArray = data.technologies.split(',').map(tech => tech.trim()).filter(Boolean);
      const catArray = data.categories.split(',').map(cat => cat.trim()).filter(Boolean);

      const projectDataToSave: any = {
        title: data.title,
        description: data.description,
        categories: catArray, // Save as array
        technologies: techArray,
        dataAiHint: data.dataAiHint || (data.modelPath && data.modelPath.trim() !== '' ? '3d model' : 'project image'),
      };

      if (data.longDescription && data.longDescription.trim() !== '') projectDataToSave.longDescription = data.longDescription;
      if (data.imageUrl && data.imageUrl.trim() !== '') projectDataToSave.imageUrl = data.imageUrl;
      if (data.modelPath && data.modelPath.trim() !== '') projectDataToSave.model = data.modelPath;
      if (data.liveLink && data.liveLink.trim() !== '') projectDataToSave.liveLink = data.liveLink;
      if (data.sourceLink && data.sourceLink.trim() !== '') projectDataToSave.sourceLink = data.sourceLink;
      
      if (isEditMode && editingProject) {
        const projectRef = doc(db, 'projects', editingProject.id);
        await updateDoc(projectRef, {
          ...projectDataToSave,
          updatedAt: serverTimestamp(),
        });
        
        toast({
          title: 'Project Updated!',
          description: `Project "${data.title}" has been successfully updated.`,
        });

        if (onProjectUpdated) {
          onProjectUpdated({ ...editingProject, ...projectDataToSave, id: editingProject.id });
        }

      } else {
        projectDataToSave.createdAt = serverTimestamp();
        const docRef = await addDoc(collection(db, 'projects'), projectDataToSave);
        
        toast({
          title: 'Project Added!',
          description: `Project "${data.title}" has been successfully saved.`,
        });
        
        if (data.modelPath && data.modelPath.startsWith('/models/')) {
          toast({
              title: '3D Model Reminder',
              description: `Ensure your model ${data.modelPath} is placed in the public/models directory.`,
              duration: 7000,
          });
        }

        if (onProjectAdded) {
          const newProjectForCallback: Omit<Project, 'id'> & { id: string } = {
              id: docRef.id, // Firestore generates the ID
              ...projectDataToSave, // Spread the rest of the data
          };
          onProjectAdded(newProjectForCallback); 
        }
        form.reset(); 
      }

    } catch (error) {
      toast({
        title: `Error ${isEditMode ? 'Updating' : 'Saving'} Project`,
        description: `Failed to ${isEditMode ? 'update' : 'save'} project. ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
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
                Path to the .glb model file. Can be a local path within your <code>public/models</code> directory (e.g., <code>/models/cool-robot.glb</code>) or a full URL. Leave empty if not using a 3D model.
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
                One or two keywords for AI image generation/search if a placeholder/fallback image is used. Default is 'project image' or '3d model' based on model path.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categories"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categories</FormLabel>
              <FormControl>
                <Input placeholder="Web Development, AI, 3D Art" {...field} />
              </FormControl>
              <FormDescription>
                Comma-separated list of categories.
              </FormDescription>
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
              {isEditMode ? 'Updating Project...' : 'Adding Project...'}
            </>
          ) : (
            <>
              {isEditMode ? <Edit className="mr-2 h-5 w-5" /> : <Save className="mr-2 h-5 w-5" />}
              {isEditMode ? 'Update Project' : 'Add Project'}
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
