
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Save, Trash2, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ResumeData, Skill } from '@/data/resumeData';
import { getResumeData, updateResumeData } from '@/services/resumeService';
import { DEFAULT_RESUME_DATA } from '@/data/resumeData';

const skillSchema = z.object({
  id: z.string().optional(), // For React key, not stored in DB with this ID usually
  name: z.string().min(1, 'Skill name is required.'),
  level: z.coerce.number().min(0, 'Level must be at least 0.').max(100, 'Level must be at most 100.'),
});

const editResumeSchema = z.object({
  summary: z.string().min(10, 'Summary must be at least 10 characters.'),
  skills: z.array(skillSchema).min(1, 'At least one skill is required.'),
});

type EditResumeFormValues = z.infer<typeof editResumeSchema>;

export default function EditResumeForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const form = useForm<EditResumeFormValues>({
    resolver: zodResolver(editResumeSchema),
    defaultValues: {
      summary: DEFAULT_RESUME_DATA.summaryItems.join('\n'),
      skills: DEFAULT_RESUME_DATA.skills.map(s => ({...s, id: Math.random().toString(36).substring(7) })),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'skills',
  });

  const fetchResume = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const data = await getResumeData();
      form.reset({
        summary: data.summaryItems.join('\n'),
        skills: data.skills.map(skill => ({
          ...skill,
          id: skill.id || Math.random().toString(36).substring(7), // Ensure id for keys
        })),
      });
    } catch (error) {
      toast({
        title: 'Error Loading Resume Data',
        description: error instanceof Error ? error.message : 'Could not load resume data.',
        variant: 'destructive',
      });
      // Keep default values if fetch fails
    } finally {
      setIsLoadingData(false);
    }
  }, [form, toast]);

  useEffect(() => {
    fetchResume();
  }, [fetchResume]);

  async function onSubmit(data: EditResumeFormValues) {
    setIsSubmitting(true);
    try {
      const resumeDataToSave: Partial<ResumeData> = {
        summaryItems: data.summary.split('\n').map(line => line.trim()).filter(line => line.length > 0),
        skills: data.skills.map(skill => ({ name: skill.name, level: skill.level })), // Only name and level for DB
      };
      await updateResumeData(resumeDataToSave);
      toast({
        title: 'Resume Updated!',
        description: 'Your resume has been successfully updated.',
      });
      fetchResume(); // Re-fetch to ensure form data is in sync after update
    } catch (error) {
      toast({
        title: 'Error Updating Resume',
        description: error instanceof Error ? error.message : 'Failed to update resume.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
        <span>Loading resume data...</span>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="summary"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xl font-semibold">Professional Summary</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter your professional summary. Each line will be a bullet point."
                  rows={6}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Write a concise summary of your professional profile. Each new line will be treated as a separate bullet point on your resume page.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormLabel className="text-xl font-semibold">Key Skills</FormLabel>
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-end space-x-3 p-3 border rounded-md bg-muted/30">
              <FormField
                control={form.control}
                name={`skills.${index}.name`}
                render={({ field: nameField }) => (
                  <FormItem className="flex-grow">
                    <FormLabel>Skill Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., React" {...nameField} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`skills.${index}.level`}
                render={({ field: levelField }) => (
                  <FormItem className="w-28">
                    <FormLabel>Proficiency (%)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 90" {...levelField} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => remove(index)}
                aria-label="Remove skill"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ id: Math.random().toString(36).substring(7), name: '', level: 75 })}
            className="mt-2"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Skill
          </Button>
          <FormMessage>{form.formState.errors.skills?.message || form.formState.errors.skills?.root?.message}</FormMessage>
        </div>

        <Button
          type="submit"
          className={cn(
            "w-full text-lg py-6",
            "hover:scale-105 transition-transform duration-200 ease-out hover:bg-primary"
          )}
          disabled={isSubmitting || isLoadingData}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Saving Resume...
            </>
          ) : (
            <>
              <Save className="mr-2 h-5 w-5" />
              Save Resume
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
