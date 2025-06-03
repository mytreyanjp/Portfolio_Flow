
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShieldCheck, Zap, Edit3, PlusCircle, Trash2, Loader2, AlertTriangle, Pencil, MessageSquareText, LogIn, LogOut, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import React, { useState, useEffect, useCallback } from 'react';
import AddProjectForm from '@/components/admin/AddProjectForm';
import EditResumeForm from '@/components/admin/EditResumeForm';
import ContactMessagesList from '@/components/admin/ContactMessagesList';
import type { Project } from '@/data/projects';
import { getProjects, getUniqueCategoriesFromProjects } from '@/services/projectsService';
import { db } from '@/lib/firebase/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth

// IMPORTANT: Replace this with your actual admin email.
// For production, this should ideally be managed via environment variables or a secure config.
const ADMIN_EMAIL = "your-admin-email@example.com"; 

export default function SecretLairPage() {
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading, error: authError, signInWithGoogle, signOutUser } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [errorLoadingProjects, setErrorLoadingProjects] = useState<string | null>(null);
  
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  
  const [isGoogleSignInLoading, setIsGoogleSignInLoading] = useState(false);

  const isUserAdmin = user && user.email === ADMIN_EMAIL;

  const fetchProjectData = useCallback(async () => {
    setIsLoadingProjects(true);
    setIsLoadingCategories(true);
    setErrorLoadingProjects(null);
    try {
      const fetchedProjects = await getProjects();
       if (fetchedProjects.length > 1) {
        setProjects(fetchedProjects.filter(p => p.id !== 'default-project-1').sort((a, b) => a.title.localeCompare(b.title)));
      } else {
         setProjects(fetchedProjects.filter(p => p.id !== 'default-project-1' || (fetchedProjects[0]?.title === 'Sample Project: Interactive Model' && fetchedProjects.length === 1)).sort((a, b) => a.title.localeCompare(b.title)));
      }
      setIsLoadingProjects(false);

      const categories = await getUniqueCategoriesFromProjects();
      setAvailableCategories(categories); 
      setIsLoadingCategories(false);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load project data.';
      setErrorLoadingProjects(errorMessage);
      toast({ title: "Error Loading Data", description: errorMessage, variant: "destructive" });
      console.error(err);
      setIsLoadingProjects(false);
      setIsLoadingCategories(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isUserAdmin) {
      fetchProjectData();
    }
  }, [isUserAdmin, fetchProjectData]);

  const handleGoogleSignIn = async () => {
    setIsGoogleSignInLoading(true);
    await signInWithGoogle();
    setIsGoogleSignInLoading(false);
  };

  const handleSignOut = async () => {
    await signOutUser();
  };

  const handleOpenDeleteDialog = (project: Project) => {
    setProjectToDelete(project);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return; 
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'projects', projectToDelete.id));
      toast({
        title: 'Project Removed',
        description: `"${projectToDelete.title}" has been successfully deleted.`,
      });
      fetchProjectData(); 
      setShowDeleteDialog(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: 'Error Removing Project',
        description: `Failed to delete project. ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleProjectAddedOrUpdated = () => {
    fetchProjectData(); 
  };

  const handleOpenEditDialog = (project: Project) => {
    setProjectToEdit(project);
    setShowEditDialog(true);
  };

  if (isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] py-12 px-2 sm:px-6 lg:px-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Verifying access...</p>
      </div>
    );
  }
  
  if (ADMIN_EMAIL === "your-admin-email@example.com") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] py-12 px-4 text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-destructive mb-2">Configuration Required</h1>
        <p className="text-muted-foreground mb-4 max-w-md">
          Please set the `ADMIN_EMAIL` constant in `src/app/secret-lair/page.tsx` to your Google account email to enable admin access.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Return to Portfolio</Link>
        </Button>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] py-12 px-4 text-center">
        <ShieldCheck className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-primary mb-2">Admin Verification Required</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          To access the Secret Lair, please sign in with the authorized Google account.
        </p>
        <Button onClick={handleGoogleSignIn} size="lg" disabled={isGoogleSignInLoading}>
          {isGoogleSignInLoading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <LogIn className="mr-2 h-5 w-5" />
          )}
          Sign in with Google
        </Button>
        {authError && <p className="mt-4 text-sm text-destructive">{authError.message}</p>}
         <Button asChild variant="link" className="mt-8">
          <Link href="/">Return to Portfolio</Link>
        </Button>
      </div>
    );
  }

  if (!isUserAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] py-12 px-4 text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-destructive mb-2">Unauthorized Access</h1>
        <p className="text-muted-foreground mb-2">
          The account <span className="font-medium text-foreground">{user.email}</span> is not authorized to access this area.
        </p>
        <Button onClick={handleSignOut} variant="destructive" size="lg">
          <LogOut className="mr-2 h-5 w-5" /> Sign Out
        </Button>
         <Button asChild variant="link" className="mt-8">
          <Link href="/">Return to Portfolio</Link>
        </Button>
      </div>
    );
  }

  // User is Admin
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] py-12 px-2 sm:px-6 lg:px-8">
      <Card className="w-full max-w-3xl shadow-2xl animate-fadeInUpScale">
        <CardHeader className="text-center">
          <Zap className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
          <CardTitle className="text-3xl font-bold text-primary">Secret Lair Control Panel</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Welcome, Agent M ({user.displayName || user.email}). Manage your portfolio content.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="projects" className="w-full">
            <TabsList className="flex w-full items-center justify-around mb-6">
              <TabsTrigger value="projects" aria-label="Manage Projects">
                <PlusCircle className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Manage Projects</span>
              </TabsTrigger>
              <TabsTrigger value="resume" aria-label="Manage Resume">
                <Edit3 className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Manage Resume</span>
              </TabsTrigger>
              <TabsTrigger value="messages" aria-label="View Messages">
                <MessageSquareText className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">View Messages</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="projects" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Add New Project</CardTitle>
                  <CardDescription>
                    Fill in the details for your new project. 
                  </CardDescription>
                </CardHeader>
                <CardContent>
                   <AddProjectForm 
                      onProjectAdded={handleProjectAddedOrUpdated} 
                      availableCategories={availableCategories}
                    />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Existing Projects</CardTitle>
                  <CardDescription>
                    Edit or remove existing projects.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingProjects && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="ml-2">Loading projects...</p>
                    </div>
                  )}
                  {errorLoadingProjects && !isLoadingProjects && (
                    <div className="text-destructive flex items-center">
                      <AlertTriangle className="mr-2 h-5 w-5" />
                      <p>{errorLoadingProjects}</p>
                    </div>
                  )}
                  {!isLoadingProjects && !errorLoadingProjects && projects.length === 0 && (
                     <p className="text-muted-foreground text-center py-4">No projects found. Add one above!</p>
                  )}
                  {!isLoadingProjects && !errorLoadingProjects && projects.length > 0 && (
                    <div className="space-y-3">
                      {projects.map((project) => (
                        <Card key={project.id} className="flex items-center justify-between p-3 bg-muted/30">
                          <span className="font-medium text-foreground truncate mr-2 flex-1">{project.title}</span>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEditDialog(project)}
                              className="hover:bg-accent/80"
                            >
                              <Pencil className="mr-1 h-4 w-4" /> Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleOpenDeleteDialog(project)}
                              disabled={isDeleting && projectToDelete?.id === project.id}
                            >
                              {isDeleting && projectToDelete?.id === project.id ? (
                                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="mr-1 h-4 w-4" />
                              )}
                              Remove
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="resume">
              <Card>
                <CardHeader>
                  <CardTitle>Edit Resume Sections</CardTitle>
                  <CardDescription>
                    Update your professional profile (Summary and Skills).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EditResumeForm />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Form Submissions</CardTitle>
                  <CardDescription>
                    Review messages sent through your contact form.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ContactMessagesList />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-8 border-t pt-6 text-center space-y-3">
            <Button onClick={handleSignOut} variant="outline" className="w-full max-w-xs mx-auto hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="mr-2 h-4 w-4" /> Sign Out Admin
            </Button>
            <Button asChild variant="outline" className="w-full max-w-xs mx-auto hover:bg-primary/10 hover:text-primary">
              <Link href="/">Return to Portfolio</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {projectToDelete && (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the project "{projectToDelete.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className={cn(isDeleting && "bg-destructive/80")}>
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {projectToEdit && (
        <Dialog open={showEditDialog} onOpenChange={(isOpen) => {
          setShowEditDialog(isOpen);
          if (!isOpen) setProjectToEdit(null); 
        }}>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>Edit Project: {projectToEdit.title}</DialogTitle>
              <DialogDescription>
                Make changes to your project details below. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 max-h-[70vh] overflow-y-auto pr-2">
              <AddProjectForm 
                  editingProject={projectToEdit} 
                  onProjectUpdated={(updatedProject) => {
                    handleProjectAddedOrUpdated();
                    setShowEditDialog(false); 
                    setProjectToEdit(null);
                  }}
                  availableCategories={availableCategories} 
                  onProjectAdded={() => { /* This won't be called in edit mode */ }}
                />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
