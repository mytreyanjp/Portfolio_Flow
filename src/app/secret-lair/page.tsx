
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldCheck, Zap, Edit3, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import AddProjectForm from '@/components/admin/AddProjectForm';

export default function SecretLairPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] py-12">
      <Card className="w-full max-w-3xl shadow-2xl animate-fadeInUpScale">
        <CardHeader className="text-center">
          <Zap className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
          <CardTitle className="text-3xl font-bold text-primary">Secret Lair Control Panel</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Manage your portfolio content, Agent M.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="projects" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="projects">
                <PlusCircle className="mr-2 h-4 w-4" /> Manage Projects
              </TabsTrigger>
              <TabsTrigger value="resume">
                <Edit3 className="mr-2 h-4 w-4" /> Manage Resume
              </TabsTrigger>
            </TabsList>
            <TabsContent value="projects" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Add New Project</CardTitle>
                  <CardDescription>
                    Fill in the details for your new project.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AddProjectForm />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="resume" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Edit Resume Sections</CardTitle>
                  <CardDescription>
                    Update your professional profile.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-6 text-center bg-muted/50 border border-dashed border-primary/50 rounded-lg">
                    <Edit3 className="h-12 w-12 text-primary mx-auto mb-3" />
                    <p className="text-foreground/80 font-semibold">
                      Resume Editing Functionality
                    </p>
                    <p className="text-sm text-muted-foreground">
                      This section is under construction. Soon you'll be able to edit your summary, skills, experience, and more directly here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-8 border-t pt-6 text-center">
            <Button asChild variant="outline" className="w-full max-w-xs mx-auto hover:bg-primary/10 hover:text-primary">
              <Link href="/">Return to Portfolio</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
