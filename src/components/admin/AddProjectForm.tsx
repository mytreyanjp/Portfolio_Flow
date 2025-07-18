
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
import { Loader2, Save, Edit, X as XIcon, PlusCircle, FileText, Grid3X3 } from 'lucide-react';
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
  imageUrl: z.string().url({ message: "Please enter a valid URL for the image." }).or(z.literal('')).optional(),
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
  // cloonedOID field removed from schema
  dataAiHint: z.string()
    .max(50, "AI hint too long (max 50 chars).")
    .refine(val => val === '' || val.split(' ').length <= 2, {
      message: "AI hint should be one or two keywords, or empty.",
    }).optional(),
  categories: z.array(z.string()).min(1, 'Please add at least one category.'),
  technologies: z.string().min(1, 'Please list at least one technology (comma-separated).'),
  liveLink: z.string().url({ message: "Please enter a valid URL." }).or(z.literal('')).optional(),
  sourceLink: z.string().url({ message: "Please enter a valid URL." }).or(z.literal('')).optional(),
  documentationLink: z.string().url({ message: "Please enter a valid URL." }).or(z.literal('')).optional(),
  videoLink: z.string().url({ message: "Please enter a valid URL." }).or(z.literal('')).optional(),
});

export type AddProjectFormValues = z.infer<typeof addProjectSchema>;

interface AddProjectFormProps {
  onProjectAdded: (newProjectData: Omit<Project, 'id' | 'cloonedOID'> & { id?: string }) => void;
  editingProject?: Project | null;
  onProjectUpdated?: (updatedProjectData: Project) => void;
  availableCategories: string[];
}

export default function AddProjectForm({ onProjectAdded, editingProject, onProjectUpdated, availableCategories }: AddProjectFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!editingProject;

  const [currentProjectCategories, setCurrentProjectCategories] = useState<string[]>([]);
  const [categoryInputValue, setCategoryInputValue] = useState('');
  const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = useState(false);
  const categoryInputRef = useRef<HTMLInputElement>(null);
  
  const [internalAvailableCategories, setInternalAvailableCategories] = useState<string[]>(availableCategories);

  useEffect(() => {
    setInternalAvailableCategories(availableCategories.sort((a,b) => a.localeCompare(b)));
  }, [availableCategories]);


  const form = useForm<AddProjectFormValues>({
    resolver: zodResolver(addProjectSchema),
    defaultValues: {
      title: '',
      description: '',
      longDescription: '',
      imageUrl: '',
      modelPath: '',
      // cloonedOID removed from default values
      dataAiHint: '',
      categories: [],
      technologies: '',
      liveLink: '',
      sourceLink: '',
      documentationLink: '',
      videoLink: '',
    },
  });

  useEffect(() => {
    if (isEditMode && editingProject) {
      form.reset({
        title: editingProject.title || '',
        description: editingProject.description || '',
        longDescription: editingProject.longDescription || '',
        imageUrl: editingProject.imageUrl || '',
        modelPath: editingProject.model || '',
        // editingProject.cloonedOID is not used here anymore
        dataAiHint: editingProject.dataAiHint || '',
        categories: editingProject.categories || [],
        technologies: editingProject.technologies ? editingProject.technologies.join(', ') : '',
        liveLink: editingProject.liveLink || '',
        sourceLink: editingProject.sourceLink || '',
        documentationLink: editingProject.documentationLink || '',
        videoLink: editingProject.videoLink || '',
      });
      setCurrentProjectCategories(editingProject.categories || []);
    } else {
      form.reset({
        title: '',
        description: '',
        longDescription: '',
        imageUrl: '',
        modelPath: '',
        // cloonedOID removed
        dataAiHint: '',
        categories: [],
        technologies: '',
        liveLink: '',
        sourceLink: '',
        documentationLink: '',
        videoLink: '',
      });
      setCurrentProjectCategories([]);
    }
  }, [editingProject, form, isEditMode]);

  useEffect(() => {
    form.setValue('categories', currentProjectCategories, { shouldValidate: true, shouldDirty: true });
  }, [currentProjectCategories, form]);


  const handleAddCategory = useCallback((category: string) => {
    const newCategory = category.trim();
    if (newCategory && !currentProjectCategories.includes(newCategory)) {
      setCurrentProjectCategories(prev => [...prev, newCategory]);
    }
    if (newCategory && !internalAvailableCategories.some(cat => cat.toLowerCase() === newCategory.toLowerCase())) {
      setInternalAvailableCategories(prev => [...prev, newCategory].sort((a,b) => a.localeCompare(b)));
    }
    setCategoryInputValue('');
    categoryInputRef.current?.focus();
  }, [currentProjectCategories, internalAvailableCategories]);

  const handleRemoveCategory = (categoryToRemove: string) => {
    setCurrentProjectCategories(prev => prev.filter(cat => cat !== categoryToRemove));
  };

  const filteredCategorySuggestions = internalAvailableCategories.filter(
    cat => cat.toLowerCase().includes(categoryInputValue.toLowerCase()) && !currentProjectCategories.includes(cat)
  );

  async function onSubmit(data: AddProjectFormValues) {
    setIsSubmitting(true);
    try {
      const techArray = data.technologies.split(',').map(tech => tech.trim()).filter(Boolean);
      
      let defaultAiHint = 'project image';
      // Adjusted defaultAiHint logic as cloonedOID is removed
      if (data.modelPath && data.modelPath.trim() !== '') {
        defaultAiHint = '3d model';
      }
      
      if (isEditMode && editingProject) {
        const updatePayload: any = { // Use 'any' or a more specific type that omits cloonedOID
          title: data.title,
          description: data.description,
          longDescription: data.longDescription,
          imageUrl: data.imageUrl,
          model: data.modelPath,
          // cloonedOID removed from updatePayload
          dataAiHint: data.dataAiHint,
          categories: data.categories,
          technologies: techArray,
          liveLink: data.liveLink,
          sourceLink: data.sourceLink,
          documentationLink: data.documentationLink,
          videoLink: data.videoLink,
          updatedAt: serverTimestamp(),
        };
        // Ensure cloonedOID is explicitly removed if it existed
        if (editingProject.cloonedOID) {
            updatePayload.cloonedOID = null; // Or FieldValue.delete() if you prefer to remove the field entirely
        }


        const projectRef = doc(db, 'projects', editingProject.id);
        await updateDoc(projectRef, updatePayload);
        
        toast({
          title: 'Project Updated!',
          description: `Project "${data.title}" has been successfully updated.`,
        });

        if (onProjectUpdated) {
          const updatedProjectData = { ...editingProject, ...updatePayload };
          delete updatedProjectData.cloonedOID; // Ensure it's not in the callback if set to null
          onProjectUpdated(updatedProjectData as Project);
        }

      } else { // Create mode
        const projectDataToSave: any = {
          title: data.title,
          description: data.description,
          categories: data.categories,
          technologies: techArray,
          dataAiHint: data.dataAiHint || defaultAiHint,
          createdAt: serverTimestamp(),
        };
        // cloonedOID removed from save logic
        if (data.longDescription && data.longDescription.trim() !== '') projectDataToSave.longDescription = data.longDescription;
        if (data.imageUrl && data.imageUrl.trim() !== '') projectDataToSave.imageUrl = data.imageUrl;
        if (data.modelPath && data.modelPath.trim() !== '') projectDataToSave.model = data.modelPath;
        if (data.liveLink && data.liveLink.trim() !== '') projectDataToSave.liveLink = data.liveLink;
        if (data.sourceLink && data.sourceLink.trim() !== '') projectDataToSave.sourceLink = data.sourceLink;
        if (data.documentationLink && data.documentationLink.trim() !== '') projectDataToSave.documentationLink = data.documentationLink;
        if (data.videoLink && data.videoLink.trim() !== '') projectDataToSave.videoLink = data.videoLink;
        
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
          const newProjectForCallback: Omit<Project, 'id' | 'cloonedOID'> & { id: string } = { // Adjusted type
              id: docRef.id,
              ...projectDataToSave,
          };
          onProjectAdded(newProjectForCallback); 
        }
        form.reset(); 
        setCurrentProjectCategories([]); 
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
                Direct link to an image for the project card. Used if no 3D model is provided, or as a fallback.
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
              <FormLabel>Self-Hosted 3D Model Path (Optional, .glb format)</FormLabel>
              <FormControl>
                <Input placeholder="/models/your-model.glb or https://example.com/model.glb" {...field} />
              </FormControl>
              <FormDescription>
                Path to a .glb model file (e.g., <code>/models/cool-robot.glb</code>). Leave empty if using just an image.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* CloonedOID FormField removed */}
        
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
                Keywords for AI image generation if a placeholder/fallback is used. Defaults based on model type.
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
                           const newTypedValue = e.target.value;
                           setCategoryInputValue(newTypedValue);
                           if (newTypedValue.trim()) {
                             if(!isCategoryPopoverOpen) setIsCategoryPopoverOpen(true);
                           }
                        }}
                        onFocus={() => {
                           if (categoryInputValue.trim() || filteredCategorySuggestions.length > 0) {
                             if(!isCategoryPopoverOpen) setIsCategoryPopoverOpen(true);
                           }
                        }}
                        onKeyDownCapture={(e) => {
                          if (e.key === 'Enter' && categoryInputValue.trim()) {
                            e.preventDefault();
                            const exactMatchSuggestion = filteredCategorySuggestions.find(
                              (s) => s.toLowerCase() === categoryInputValue.trim().toLowerCase()
                            );
                            if (exactMatchSuggestion) {
                              handleAddCategory(exactMatchSuggestion);
                            } else {
                              handleAddCategory(categoryInputValue.trim());
                            }
                          } else if (e.key === 'Backspace' && !categoryInputValue && currentProjectCategories.length > 0) {
                            e.preventDefault();
                            handleRemoveCategory(currentProjectCategories[currentProjectCategories.length - 1]);
                          } else if (e.key === 'Escape') {
                            setIsCategoryPopoverOpen(false);
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
                            if (categoryInputValue.trim()) {
                                handleAddCategory(categoryInputValue.trim());
                            }
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
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <Command>
                    <CommandList>
                       <CommandEmpty>
                         {categoryInputValue.trim() 
                           ? `No suggestions. Press Enter or click '+' to add "${categoryInputValue.trim()}".` 
                           : "Type to search or add new."}
                       </CommandEmpty>
                      {filteredCategorySuggestions.length > 0 && (
                        <CommandGroup heading="Suggestions">
                          {filteredCategorySuggestions.map(cat => (
                            <CommandItem
                              key={cat}
                              value={cat}
                              onSelect={() => {
                                handleAddCategory(cat);
                                setIsCategoryPopoverOpen(false);
                              }}
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
                Add relevant categories. Type to search or add new ones.
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

        <div className="space-y-6">
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
          <FormField
            control={form.control}
            name="documentationLink"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Documentation Link (Optional)</FormLabel>
                <FormControl>
                  <Input type="url" placeholder="https://yourproject.docs" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="videoLink"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Video Link (Optional)</FormLabel>
                <FormControl>
                  <Input type="url" placeholder="https://youtube.com/watch?v=..." {...field} />
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
