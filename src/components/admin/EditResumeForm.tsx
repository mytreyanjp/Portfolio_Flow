
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
import { Loader2, Save, Trash2, PlusCircle, Link as LinkIcon, BookOpen, Briefcase, Award as AwardIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ResumeData, Skill, EducationEntry, WorkExperienceEntry, AwardEntry } from '@/data/resumeData';
import { getResumeData, updateResumeData } from '@/services/resumeService';
import { DEFAULT_RESUME_DATA } from '@/data/resumeData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const skillSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Skill name is required.'),
  level: z.coerce.number().min(0, 'Level must be at least 0.').max(100, 'Level must be at most 100.'),
});

const educationEntrySchema = z.object({
  id: z.string().optional(),
  degree: z.string().min(2, 'Degree name is required.'),
  institution: z.string().min(2, 'Institution name is required.'),
  dates: z.string().min(4, 'Dates are required.'),
  description: z.string().optional(),
});

const workExperienceEntrySchema = z.object({
  id: z.string().optional(),
  jobTitle: z.string().min(2, 'Job title is required.'),
  company: z.string().min(2, 'Company name is required.'),
  dates: z.string().min(4, 'Dates are required.'),
  responsibilities: z.string().min(10, 'At least one responsibility is required.'), // Will be split into array
});

const awardEntrySchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2, 'Award title is required.'),
  issuer: z.string().optional(),
  date: z.string().optional(),
  url: z.string().url({ message: "Please enter a valid URL or leave empty." }).or(z.literal('')).optional(),
});

const editResumeSchema = z.object({
  summary: z.string().min(10, 'Summary must be at least 10 characters.'),
  skills: z.array(skillSchema).min(1, 'At least one skill is required.'),
  education: z.array(educationEntrySchema).optional(),
  experience: z.array(workExperienceEntrySchema).optional(),
  awards: z.array(awardEntrySchema).optional(),
  instagramUrl: z.string().url({ message: "Please enter a valid URL or leave empty." }).or(z.literal('')).optional(),
  githubUrl: z.string().url({ message: "Please enter a valid URL or leave empty." }).or(z.literal('')).optional(),
  linkedinUrl: z.string().url({ message: "Please enter a valid URL or leave empty." }).or(z.literal('')).optional(),
});

type EditResumeFormValues = z.infer<typeof editResumeSchema>;

function generateId(prefix: string = 'item') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2,9)}`;
}

export default function EditResumeForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const form = useForm<EditResumeFormValues>({
    resolver: zodResolver(editResumeSchema),
    defaultValues: {
      summary: (DEFAULT_RESUME_DATA.summaryItems || []).join('\n'),
      skills: (DEFAULT_RESUME_DATA.skills || []).map(s => ({ ...s, id: s.id || generateId('skill') })),
      education: (DEFAULT_RESUME_DATA.education || []).map(e => ({ ...e, id: e.id || generateId('edu') })),
      experience: (DEFAULT_RESUME_DATA.experience || []).map(e => ({
        ...e,
        id: e.id || generateId('exp'),
        responsibilities: (e.responsibilities || []).join('\n')
      })),
      awards: (DEFAULT_RESUME_DATA.awards || []).map(a => ({ ...a, id: a.id || generateId('award') })),
      instagramUrl: DEFAULT_RESUME_DATA.instagramUrl || '',
      githubUrl: DEFAULT_RESUME_DATA.githubUrl || '',
      linkedinUrl: DEFAULT_RESUME_DATA.linkedinUrl || '',
    },
  });

  const { fields: skillFields, append: appendSkill, remove: removeSkill } = useFieldArray({ control: form.control, name: 'skills' });
  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({ control: form.control, name: 'education' });
  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({ control: form.control, name: 'experience' });
  const { fields: awardFields, append: appendAward, remove: removeAward } = useFieldArray({ control: form.control, name: 'awards' });

  const fetchResume = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const data = await getResumeData();
      form.reset({
        summary: (data.summaryItems || []).join('\n'),
        skills: (data.skills || []).map(s => ({ ...s, id: s.id || generateId('skill') })),
        education: (data.education || []).map(e => ({ ...e, id: e.id || generateId('edu') })),
        experience: (data.experience || []).map(e => ({
          ...e,
          id: e.id || generateId('exp'),
          responsibilities: (e.responsibilities || []).join('\n')
        })),
        awards: (data.awards || []).map(a => ({ ...a, id: a.id || generateId('award') })),
        instagramUrl: data.instagramUrl || '',
        githubUrl: data.githubUrl || '',
        linkedinUrl: data.linkedinUrl || '',
      });
    } catch (error) {
      toast({
        title: 'Error Loading Resume Data',
        description: error instanceof Error ? error.message : 'Could not load resume data.',
        variant: 'destructive',
      });
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
      const resumeDataToSave: ResumeData = {
        summaryItems: data.summary.split('\n').map(line => line.trim()).filter(line => line.length > 0),
        skills: (data.skills || []).map(skill => ({ name: skill.name, level: skill.level })),
        education: (data.education || []).map(edu => ({ degree: edu.degree, institution: edu.institution, dates: edu.dates, description: edu.description })),
        experience: (data.experience || []).map(exp => ({
          jobTitle: exp.jobTitle,
          company: exp.company,
          dates: exp.dates,
          responsibilities: exp.responsibilities.split('\n').map(line => line.trim()).filter(line => line.length > 0),
        })),
        awards: (data.awards || []).map(award => ({ title: award.title, issuer: award.issuer, date: award.date, url: award.url })),
        instagramUrl: data.instagramUrl,
        githubUrl: data.githubUrl,
        linkedinUrl: data.linkedinUrl,
      };
      await updateResumeData(resumeDataToSave);
      toast({
        title: 'Resume Updated!',
        description: 'Your resume has been successfully updated.',
      });
      fetchResume(); // Refetch to ensure form and data are in sync, including any server-side transformations
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
        
        <Card>
          <CardHeader><CardTitle className="text-xl font-semibold">Professional Summary</CardTitle></CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormControl><Textarea placeholder="Enter summary. Each line is a bullet point." rows={6} {...field} /></FormControl>
                  <FormDescription>Each new line will be a separate bullet point.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-xl font-semibold">Social Links</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="instagramUrl" render={({ field }) => ( <FormItem><FormLabel>Instagram URL</FormLabel><FormControl><Input placeholder="https://instagram.com/yourprofile" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="githubUrl" render={({ field }) => ( <FormItem><FormLabel>GitHub URL</FormLabel><FormControl><Input placeholder="https://github.com/yourprofile" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="linkedinUrl" render={({ field }) => ( <FormItem><FormLabel>LinkedIn URL</FormLabel><FormControl><Input placeholder="https://linkedin.com/in/yourprofile" {...field} /></FormControl><FormMessage /></FormItem> )} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-semibold">Key Skills</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() => appendSkill({ id: generateId('skill'), name: '', level: 75 })}> <PlusCircle className="mr-2 h-4 w-4" /> Add Skill </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {skillFields.map((field, index) => (
              <div key={field.id} className="flex items-end space-x-3 p-3 border rounded-md bg-muted/30">
                <FormField control={form.control} name={`skills.${index}.name`} render={({ field: nameField }) => ( <FormItem className="flex-grow"><FormLabel>Skill Name</FormLabel><FormControl><Input placeholder="e.g., React" {...nameField} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={form.control} name={`skills.${index}.level`} render={({ field: levelField }) => ( <FormItem className="w-28"><FormLabel>Proficiency (%)</FormLabel><FormControl><Input type="number" placeholder="e.g., 90" {...levelField} /></FormControl><FormMessage /></FormItem> )}/>
                <Button type="button" variant="destructive" size="icon" onClick={() => removeSkill(index)} aria-label="Remove skill"><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <FormMessage>{form.formState.errors.skills?.message || form.formState.errors.skills?.root?.message}</FormMessage>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-semibold flex items-center"><BookOpen className="mr-2 h-5 w-5 text-primary" />Education</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() => appendEdu({ id: generateId('edu'), degree: '', institution: '', dates: '', description: '' })}><PlusCircle className="mr-2 h-4 w-4" /> Add Education</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {eduFields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-md bg-muted/30 space-y-3">
                <FormField control={form.control} name={`education.${index}.degree`} render={({ field: f }) => ( <FormItem><FormLabel>Degree</FormLabel><FormControl><Input placeholder="B.Tech in Information Technology" {...f} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={form.control} name={`education.${index}.institution`} render={({ field: f }) => ( <FormItem><FormLabel>Institution</FormLabel><FormControl><Input placeholder="Example University" {...f} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={form.control} name={`education.${index}.dates`} render={({ field: f }) => ( <FormItem><FormLabel>Dates</FormLabel><FormControl><Input placeholder="2020 - 2024" {...f} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={form.control} name={`education.${index}.description`} render={({ field: f }) => ( <FormItem><FormLabel>Description (Optional)</FormLabel><FormControl><Textarea placeholder="Relevant coursework, achievements..." {...f} /></FormControl><FormMessage /></FormItem> )}/>
                <Button type="button" variant="destructive" size="sm" onClick={() => removeEdu(index)}><Trash2 className="mr-1 h-4 w-4" /> Remove Education Entry</Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-semibold flex items-center"><Briefcase className="mr-2 h-5 w-5 text-primary" />Work Experience</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() => appendExp({ id: generateId('exp'), jobTitle: '', company: '', dates: '', responsibilities: '' })}><PlusCircle className="mr-2 h-4 w-4" /> Add Experience</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {expFields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-md bg-muted/30 space-y-3">
                <FormField control={form.control} name={`experience.${index}.jobTitle`} render={({ field: f }) => ( <FormItem><FormLabel>Job Title</FormLabel><FormControl><Input placeholder="Software Engineer" {...f} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={form.control} name={`experience.${index}.company`} render={({ field: f }) => ( <FormItem><FormLabel>Company</FormLabel><FormControl><Input placeholder="Tech Corp" {...f} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={form.control} name={`experience.${index}.dates`} render={({ field: f }) => ( <FormItem><FormLabel>Dates</FormLabel><FormControl><Input placeholder="Jan 2022 - Present" {...f} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={form.control} name={`experience.${index}.responsibilities`} render={({ field: f }) => ( <FormItem><FormLabel>Responsibilities</FormLabel><FormControl><Textarea placeholder="Developed feature X...\nManaged project Y..." {...f} rows={4} /></FormControl><FormDescription>Each new line is a bullet point.</FormDescription><FormMessage /></FormItem> )}/>
                <Button type="button" variant="destructive" size="sm" onClick={() => removeExp(index)}><Trash2 className="mr-1 h-4 w-4" /> Remove Experience Entry</Button>
              </div>
            ))}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-semibold flex items-center"><AwardIcon className="mr-2 h-5 w-5 text-primary" />Awards & Certifications</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() => appendAward({ id: generateId('award'), title: '', issuer: '', date: '', url: '' })}><PlusCircle className="mr-2 h-4 w-4" /> Add Award/Certification</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {awardFields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-md bg-muted/30 space-y-3">
                <FormField control={form.control} name={`awards.${index}.title`} render={({ field: f }) => ( <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="Certified Cloud Practitioner" {...f} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={form.control} name={`awards.${index}.issuer`} render={({ field: f }) => ( <FormItem><FormLabel>Issuer (Optional)</FormLabel><FormControl><Input placeholder="AWS" {...f} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={form.control} name={`awards.${index}.date`} render={({ field: f }) => ( <FormItem><FormLabel>Date (Optional)</FormLabel><FormControl><Input placeholder="2023" {...f} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={form.control} name={`awards.${index}.url`} render={({ field: f }) => ( <FormItem><FormLabel>Link (Optional)</FormLabel><FormControl><Input type="url" placeholder="https://example.com/certificate" {...f} /></FormControl><FormMessage /></FormItem> )}/>
                <Button type="button" variant="destructive" size="sm" onClick={() => removeAward(index)}><Trash2 className="mr-1 h-4 w-4" /> Remove Award/Cert.</Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Button
          type="submit"
          className={cn("w-full text-lg py-6","hover:scale-105 transition-transform duration-200 ease-out hover:bg-primary")}
          disabled={isSubmitting || isLoadingData}
        >
          {isSubmitting ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" />Saving Resume...</>) : (<><Save className="mr-2 h-5 w-5" />Save Resume</>)}
        </Button>
      </form>
    </Form>
  );
}
