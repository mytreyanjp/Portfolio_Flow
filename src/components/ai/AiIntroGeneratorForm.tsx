
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { generateIntroMessage, IntroMessageInput } from '@/ai/flows/intro-message';
import React, { useState } from 'react';
import { Loader2, Wand2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  employer: z.string().min(2, 'Employer name is required.'),
  jobTitle: z.string().min(2, 'Job title is required.'),
  userSkills: z.string().min(5, 'Please list at least one skill. Separate skills with commas.'),
  userExperience: z.string().min(10, 'Please provide a brief experience summary.'),
  desiredTone: z.enum(['formal', 'casual', 'enthusiastic']),
});

type AiIntroFormValues = z.infer<typeof formSchema>;

export default function AiIntroGeneratorForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState<string | null>(null);

  const form = useForm<AiIntroFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employer: '',
      jobTitle: '',
      userSkills: '',
      userExperience: '',
      desiredTone: 'casual',
    },
  });

  async function onSubmit(data: AiIntroFormValues) {
    setIsLoading(true);
    setGeneratedMessage(null);
    try {
      const skillsArray = data.userSkills.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);
      const input: IntroMessageInput = {
        ...data,
        userSkills: skillsArray,
      };
      const result = await generateIntroMessage(input);
      setGeneratedMessage(result.introMessage);
      toast({
        title: 'Intro Message Generated!',
        description: 'Your personalized intro message is ready below.',
      });
    } catch (error) {
      console.error('AI Intro Generation Error:', error);
      toast({
        title: 'Error Generating Intro',
        description: 'Something went wrong. Please try again. ' + (error instanceof Error ? error.message : ''),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="employer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employer Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Corp" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="jobTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Software Engineer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="userSkills"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Skills</FormLabel>
                <FormControl>
                  <Textarea placeholder="e.g., React, Next.js, Problem Solving, Teamwork" {...field} />
                </FormControl>
                <FormDescription>Separate skills with commas.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="userExperience"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Experience Summary</FormLabel>
                <FormControl>
                  <Textarea placeholder="Briefly describe your relevant experience..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="desiredTone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Desired Tone</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a tone" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button 
            type="submit" 
            disabled={isLoading} 
            className={cn(
              "w-full text-lg py-6",
              "hover:scale-105 transition-transform duration-200 ease-out hover:bg-primary" // Keeps primary bg on hover
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-5 w-5" /> Generate Intro
              </>
            )}
          </Button>
        </form>
      </Form>

      {generatedMessage && (
        <Card className="mt-10 bg-primary/5 border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-primary flex items-center">
              <Wand2 className="mr-2 h-5 w-5" /> Your Generated Intro Message
            </CardTitle>
            <CardDescription>Review and customize this message as needed before sending.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-background rounded-md border border-border whitespace-pre-wrap text-sm leading-relaxed">
              {generatedMessage}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className={cn(
                "mt-4",
                "hover:scale-105 transition-transform duration-200 ease-out hover:bg-background" // Keeps outline hover behavior
              )}
              onClick={() => {
                navigator.clipboard.writeText(generatedMessage);
                toast({ title: "Copied!", description: "Message copied to clipboard." });
              }}
            >
              Copy Message
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  );
}
