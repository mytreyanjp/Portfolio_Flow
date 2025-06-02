
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
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, Save, Edit, X as XIcon, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';

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
  categories: z.array(z.string()).min(1, 'Please add at least one category.'),
  technologies: z.string().min(1, 'Please list at least one technology (comma-separated).'), // Keep as string for now
  liveLink: z.string().url({ message: "Please enter a valid URL." }).or(z.literal('')).optional(),
  sourceLink: z.string().url({ message: "Please enter a valid URL." }).or(z.literal('')).optional(),
  imageUrl: z.string().url({ message: "Please enter a valid URL for the image." }).or(z.literal('')).optional(),
});

export type AddProjectFormValues = z.infer<typeof addProjectSchema>;

interface AddProjectFormProps {
  onProjectAdded: (newProjectData: Omit<Project, 'id'> & { id?: string }) => void;
  editingProject?: Project | null;
  onProjectUpdated?: (updatedProjectData: Project) => void;
  availableCategories: string[]; // For suggestions
}

export default function AddProjectForm({ onProjectAdded, editingProject, onProjectUpdated, availableCategories }: AddProjectFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!editingProject;

  const [currentProjectCategories, setCurrentProjectCategories] = useState<string[]>([]);
  const [categoryInputValue, setCategoryInputValue] = useState('');
  const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = useState(false);
  const categoryInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<AddProjectFormValues>({
    resolver: zodResolver(addProjectSchema),
    defaultValues: {
      title: '',
      description: '',
      longDescription: '',
      modelPath: '',
      dataAiHint: '',
      categories: [],
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
        categories: editingProject.categories || [],
        technologies: editingProject.technologies ? editingProject.technologies.join(', ') : '',
        liveLink: editingProject.liveLink || '',
        sourceLink: editingProject.sourceLink || '',
        imageUrl: editingProject.imageUrl || '',
      });
      setCurrentProjectCategories(editingProject.categories || []);
    } else {
      form.reset({
        title: '',
        description: '',
        longDescription: '',
        modelPath: '',
        dataAiHint: '',
        categories: [],
        technologies: '',
        liveLink: '',
        sourceLink: '',
        imageUrl: '',
      });
      setCurrentProjectCategories([]);
    }
  }, [editingProject, form, isEditMode]);

  // Sync currentProjectCategories with form state for validation
  useEffect(() => {
    form.setValue('categories', currentProjectCategories, { shouldValidate: true, shouldDirty: true });
  }, [currentProjectCategories, form]);


  const handleAddCategory = useCallback((category: string) => {
    const newCategory = category.trim();
    if (newCategory && !currentProjectCategories.includes(newCategory)) {
      setCurrentProjectCategories(prev => [...prev, newCategory]);
    }
    setCategoryInputValue('');
    setIsCategoryPopoverOpen(false);
    categoryInputRef.current?.focus();
  }, [currentProjectCategories]);

  const handleRemoveCategory = (categoryToRemove: string) => {
    setCurrentProjectCategories(prev => prev.filter(cat => cat !== categoryToRemove));
  };

  const filteredCategorySuggestions = availableCategories.filter(
    cat => cat.toLowerCase().includes(categoryInputValue.toLowerCase()) && !currentProjectCategories.includes(cat)
  );

  async function onSubmit(data: AddProjectFormValues) {
    setIsSubmitting(true);
    try {
      const techArray = data.technologies.split(',').map(tech => tech.trim()).filter(Boolean);
      
      const projectDataToSave: any = {
        title: data.title,
        description: data.description,
        categories: data.categories, // This is now an array from the form state
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
              id: docRef.id,
              ...projectDataToSave,
          };
          onProjectAdded(newProjectForCallback); 
        }
        form.reset(); 
        setCurrentProjectCategories([]); // Reset local category state
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
          name="categories" // This field is for Zod validation, UI is handled separately
          render={({ field }) => ( // field is not directly used for input, but for messages
            <FormItem>
              <FormLabel>Categories</FormLabel>
              <div className="flex flex-wrap gap-2 mb-2">
                {currentProjectCategories.map(cat => (
                  <Badge key={cat} variant="secondary" className="flex items-center gap-1">
                    {cat}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveCategory(cat)}
                    >
                      <XIcon className="h-3 w-3" />
                      <span className="sr-only">Remove {cat}</span>
                    </Button>
                  </Badge>
                ))}
              </div>
              <Popover open={isCategoryPopoverOpen} onOpenChange={setIsCategoryPopoverOpen}>
                <PopoverTrigger asChild>
                  <div className="relative">
                     <Input
                        ref={categoryInputRef}
                        type="text"
                        placeholder="Type or select a category"
                        value={categoryInputValue}
                        onChange={(e) => {
                           setCategoryInputValue(e.target.value);
                           if (!isCategoryPopoverOpen && e.target.value.trim()) {
                            setIsCategoryPopoverOpen(true);
                           } else if (isCategoryPopoverOpen && !e.target.value.trim() && filteredCategorySuggestions.length === 0) {
                            setIsCategoryPopoverOpen(false);
                           }
                        }}
                        onKeyDownCapture={(e) => {
                          if (e.key === 'Enter' && categoryInputValue.trim()) {
                            e.preventDefault();
                            handleAddCategory(categoryInputValue.trim());
                          } else if (e.key === 'Backspace' && !categoryInputValue && currentProjectCategories.length > 0) {
                            handleRemoveCategory(currentProjectCategories[currentProjectCategories.length - 1]);
                          }
                        }}
                        className="pr-8"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => {
                            if (categoryInputValue.trim()) handleAddCategory(categoryInputValue.trim());
                        }}
                        disabled={!categoryInputValue.trim()}
                        title="Add category"
                       >
                         <PlusCircle className="h-4 w-4" />
                       </Button>
                   </div>
                </PopoverTrigger>
                <PopoverContent 
                    className="w-[--radix-popover-trigger-width] p-0" 
                    align="start"
                    onOpenAutoFocus={(e) => e.preventDefault()} // Prevent focus trap, inputRef handles focus
                >
                  <Command>
                    {/* CommandInput is not used directly here to avoid double input field effect */}
                    <CommandList>
                      <CommandEmpty>
                        {categoryInputValue.trim() ? (
                          <CommandItem
                            onSelect={() => handleAddCategory(categoryInputValue.trim())}
                            value={`add-${categoryInputValue.trim()}`} // ensure unique value for selection
                            className="italic"
                          >
                            Add new: "{categoryInputValue.trim()}"
                          </CommandItem>
                        ) : (
                          "No category found."
                        )}
                      </CommandEmpty>
                      {filteredCategorySuggestions.length > 0 && (
                        <CommandGroup heading="Suggestions">
                          {filteredCategorySuggestions.map(cat => (
                            <CommandItem
                              key={cat}
                              value={cat}
                              onSelect={() => handleAddCategory(cat)}
                            >
                              {cat}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormDescription>
                Add relevant categories for your project. Type to search or add new ones.
              </FormDescription>
              <FormMessage /> {/* This will show Zod error for 'categories' field */}
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

