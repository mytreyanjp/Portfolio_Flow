
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
import React, { useEffect } from 'react'; // Added useEffect
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useName } from '@/contexts/NameContext'; // Import useName

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.').max(50, 'Name must be less than 50 characters.'),
  email: z.string().email('Invalid email address.'),
  message: z.string().min(10, 'Message must be at least 10 characters.').max(1000, 'Message must be less than 1000 characters.'),
});

type ContactFormValues = z.infer<typeof formSchema>;

async function saveContactMessageToFirestore(data: ContactFormValues): Promise<{ success: boolean; message: string; submissionId?: string }> {
  try {
    const docRef = await addDoc(collection(db, "contactMessages"), {
      name: data.name,
      email: data.email,
      message: data.message,
      createdAt: serverTimestamp(),
      isRead: false, 
    });
    return {
      success: true,
      message: 'Your message has been successfully sent and saved!',
      submissionId: docRef.id,
    };
  } catch (error) {
    console.error("Error writing document to Firestore: ", error);
    return {
      success: false,
      message: `Failed to send message. ${error instanceof Error ? error.message : 'Please try again.'}`,
    };
  }
}


export default function ContactForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { userName, isLoadingName } = useName(); // Get userName and loading state

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
    },
  });

  useEffect(() => {
    if (!isLoadingName && userName) {
      // Only set the value if the form's name field is currently empty
      // or if it matches the previous userName (if we were tracking that)
      // For simplicity, we'll update it if userName is available.
      // To prevent overwriting user input, you could add more complex logic here,
      // e.g., form.getValues('name') === ''
      form.reset({ ...form.getValues(), name: userName });
    } else if (!isLoadingName && !userName) {
      // If userName is cleared, clear the name field if it was prefilled by the context
      // This check prevents clearing manually typed names if the context name was never set
      // or was already different. A more robust way might involve checking if the current
      // form name value was indeed set by the context previously.
      // For now, if userName from context is null, we don't change the form's name field
      // unless it was clearly set by a previous userName value.
      // To simplify, we can decide to clear it or leave it.
      // Let's leave it as is if userName becomes null, user can clear it manually.
      // If you want to clear it: form.reset({ ...form.getValues(), name: '' });
    }
  }, [userName, isLoadingName, form]);

  async function onSubmit(data: ContactFormValues) {
    setIsSubmitting(true);
    try {
      const result = await saveContactMessageToFirestore(data);
      if (result.success) {
        toast({
          title: 'Message Sent!',
          description: result.message,
        });
        form.reset({ name: userName || '', email: '', message: '' }); // Reset form but keep pre-filled name if available
      } else {
        toast({
          title: 'Error Sending Message',
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
            "w-full hover:scale-105 transition-transform duration-200 ease-out hover:bg-primary"
          )}
          disabled={isSubmitting || isLoadingName} // Disable button while name is loading too
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
