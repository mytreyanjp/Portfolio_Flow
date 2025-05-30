
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.').max(50, 'Name must be less than 50 characters.'),
  email: z.string().email('Invalid email address.'),
  message: z.string().min(10, 'Message must be at least 10 characters.').max(500, 'Message must be less than 500 characters.'),
});

type ContactFormValues = z.infer<typeof formSchema>;

async function submitContactForm(data: ContactFormValues): Promise<{ success: boolean; message: string; emailContent?: string, submissionId?: string }> {
  // Generate a simple unique ID for the submission
  const submissionId = 'CONTACT-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);

  // Structure the email content
  const emailBody =
    'New Contact Form Submission\n' +
    '-----------------------------\n' +
    'ID: ' + submissionId + '\n' +
    'Full Name: ' + data.name + '\n' +
    'Email Address: ' + data.email + '\n' +
    'Message: ' + data.message + '\n' +
    '-----------------------------';

  // Simulate sending the email by logging it to the console
  console.log('--- SIMULATED EMAIL ---');
  console.log('To: mytreyan197@gmail.com');
  console.log('Subject: New Contact Form Submission - ID: ' + submissionId);
  console.log('Body:\n' + emailBody);
  console.log('--- END SIMULATED EMAIL ---');

  // Simulate a delay and success
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    success: true,
    message: 'Your message has been logged to the console (simulation). In a real app, this would be emailed!',
    emailContent: emailBody,
    submissionId: submissionId,
  };
}


export default function ContactForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
    },
  });

  async function onSubmit(data: ContactFormValues) {
    setIsSubmitting(true);
    try {
      const result = await submitContactForm(data);
      if (result.success) {
        toast({
          title: 'Message Submitted (Simulation)!',
          description: result.message,
        });
        form.reset();
      } else {
        toast({
          title: 'Error Simulating Submission',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred during submission simulation. Please try again.',
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Your Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea placeholder="Your message here..." className="min-h-[120px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className={cn(
            "w-full hover:scale-105 transition-transform duration-200 ease-out hover:bg-primary"
          )}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            'Send Message'
          )}
        </Button>
      </form>
    </Form>
  );
}
