
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

// This function simulates form submission and prepares email content.
// For actual email sending, this data would be sent to a backend API.
async function submitContactForm(data: ContactFormValues): Promise<{ success: boolean; message: string; emailContent?: string }> {
  // Generate a simple unique ID for the submission
  const submissionId = 'CONTACT-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);

  // Structure the email content
  const emailBody = \`
New Contact Form Submission
-----------------------------
ID: \${submissionId}
Full Name: \${data.name}
Email Address: \${data.email}
-----------------------------
Message:
\${data.message}
-----------------------------
  \`;

  console.log('--- Contact Form Submission Data ---');
  console.log('Recipient: mytreyan197@gmail.com');
  console.log('Email Content to be sent:');
  console.log(emailBody);
  console.log('Note: This email is NOT actually sent. This is a frontend simulation. A backend service is required to send emails.');

  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // In a real application, you would send 'data' (or 'emailBody') to your backend here.
  // The backend would then use an email service to send the email.

  return { 
    success: true, 
    message: "Your message has been logged (simulation)! I'll get back to you soon.",
    emailContent: emailBody 
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
          title: 'Message "Sent" (Simulated)!',
          description: result.message,
        });
        form.reset();
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
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
            "w-full",
            "hover:scale-105 transition-transform duration-200 ease-out hover:bg-primary"
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
