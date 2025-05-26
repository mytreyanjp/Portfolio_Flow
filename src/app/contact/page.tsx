import type { Metadata } from 'next';
import ContactForm from '@/components/contact/ContactForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Me',
  description: 'Get in touch with me for collaborations, inquiries, or just to say hi.',
};

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-4xl font-bold text-center mb-12 text-primary">Let's Connect</h1>
      
      <div className="grid md:grid-cols-2 gap-12 items-start">
        <section aria-labelledby="contact-form-section">
          <h2 id="contact-form-section" className="sr-only">Contact Form</h2>
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Send a Message</CardTitle>
              <CardDescription>Fill out the form below and I'll get back to you as soon as possible.</CardDescription>
            </CardHeader>
            <CardContent>
              <ContactForm />
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="contact-info-section" className="space-y-8">
           <h2 id="contact-info-section" className="text-2xl font-semibold mb-6 text-center md:text-left">Contact Information</h2>
          <Card className="shadow-lg">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start space-x-4">
                <Mail className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold">Email</h3>
                  <a href="mailto:placeholder@example.com" className="text-accent hover:underline">
                    placeholder@example.com
                  </a>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Phone className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold">Phone</h3>
                  <p className="text-muted-foreground">(123) 456-7890 (Placeholder)</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <MapPin className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold">Location</h3>
                  <p className="text-muted-foreground">Planet Earth (Remote Friendly)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="text-center md:text-left">
            <p className="text-muted-foreground">
              I'm always open to discussing new projects, creative ideas or opportunities to be part of your visions.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
