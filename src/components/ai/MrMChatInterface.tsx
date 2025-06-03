
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Send, Loader2, ListCollapse,ChevronLeft, RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { askMrMAboutProject, ProjectQnaInput, ProjectZodSchema, ProjectZod } from '@/ai/flows/project-qna-flow'; // Updated import
import { useToast } from '@/hooks/use-toast';
import type { Project } from '@/data/projects';
import { getProjects } from '@/services/projectsService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'mrm';
  timestamp: Date;
}

export default function MrMChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [projectFetchError, setProjectFetchError] = useState<string | null>(null);

  const fetchProjectsList = useCallback(async () => {
    setIsLoadingProjects(true);
    setProjectFetchError(null);
    try {
      const fetched = await getProjects();
       // Filter out the default project if other projects exist
      if (fetched.length > 1) {
        setProjectsList(fetched.filter(p => p.id !== 'default-project-1'));
      } else if (fetched.length === 1 && fetched[0].id === 'default-project-1' && fetched[0].title.includes('Sample Project')) {
        // If only the default project is there, show a message or keep it
        // For now, let's show it if it's the only one.
        setProjectsList(fetched);
      }
      else {
        setProjectsList(fetched);
      }
    } catch (error) {
      console.error("Failed to fetch projects for Mr.M:", error);
      setProjectFetchError("Could not load projects. Please try again.");
      toast({ title: "Error", description: "Failed to load project list.", variant: "destructive" });
    } finally {
      setIsLoadingProjects(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProjectsList();
  }, [fetchProjectsList]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setMessages([
      {
        id: `mrm-greeting-${Date.now()}`,
        text: `Okay, we're now discussing "${project.title}". How can I help you with this project?`,
        sender: 'mrm',
        timestamp: new Date(),
      }
    ]);
    setInputValue('');
    // Focus input after project selection might be good UX
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleChangeProject = () => {
    setSelectedProject(null);
    setMessages([]); // Clear chat history for the new project session
    setInputValue('');
  };

  const handleSendMessage = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    const question = inputValue.trim();
    if (!question || isLoadingAnswer || !selectedProject) return;

    const newUserMessage: Message = {
      id: `user-${Date.now()}`,
      text: question,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    setIsLoadingAnswer(true);

    const chatHistoryForAI = messages
      .filter(msg => msg.sender !== 'mrm' || !msg.text.startsWith("Okay, we're now discussing")) // Exclude initial project selection greeting
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
    }));

    // Map selectedProject to ProjectZod type, ensuring all fields are correctly passed
    const projectContextForAI: ProjectZod = {
        id: selectedProject.id,
        title: selectedProject.title,
        description: selectedProject.description,
        longDescription: selectedProject.longDescription || undefined, // Ensure optional fields are handled
        categories: selectedProject.categories,
        technologies: selectedProject.technologies,
        liveLink: selectedProject.liveLink || '',
        sourceLink: selectedProject.sourceLink || '',
        documentationLink: selectedProject.documentationLink || '',
    };

    try {
      const aiInput: ProjectQnaInput = {
        question: question,
        projectContext: projectContextForAI,
        chatHistory: chatHistoryForAI
      };
      const result = await askMrMAboutProject(aiInput);
      const aiResponse: Message = {
        id: `mrm-${Date.now()}`,
        text: result.answer,
        sender: 'mrm',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error calling Mr.M AI flow:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: "Sorry, I'm having trouble connecting right now. Please try again later.",
        sender: 'mrm',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      toast({
        title: 'Chat Error',
        description: 'Could not get a response from Mr.M. ' + (error instanceof Error ? error.message : ''),
        variant: 'destructive',
      });
    } finally {
      setIsLoadingAnswer(false);
      inputRef.current?.focus();
    }
  };


  if (isLoadingProjects) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] max-h-[700px]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading projects for Mr.M...</p>
      </div>
    );
  }

  if (projectFetchError) {
    return (
      <Card className="h-[60vh] max-h-[700px] flex flex-col items-center justify-center text-center">
        <CardHeader>
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-2" />
          <CardTitle className="text-destructive">Error Loading Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{projectFetchError}</p>
          <Button onClick={fetchProjectsList} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" /> Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!selectedProject) {
    return (
      <div className="h-[60vh] max-h-[700px] flex flex-col">
        <CardHeader className="text-center pb-4 pt-2">
          <CardTitle className="text-xl">Select a Project</CardTitle>
          <CardDescription>Choose a project to discuss with Mr.M.</CardDescription>
        </CardHeader>
        <ScrollArea className="flex-grow p-4 rounded-lg">
          {projectsList.length === 0 && !isLoadingProjects && (
            <p className="text-muted-foreground text-center py-10">No projects available to discuss.</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {projectsList.map(project => (
              <Button
                key={project.id}
                variant="outline"
                className="w-full h-auto py-3 px-4 text-left justify-start hover:bg-accent/50 transition-all duration-150 ease-in-out"
                onClick={() => handleSelectProject(project)}
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-sm text-foreground">{project.title}</span>
                  <span className="text-xs text-muted-foreground truncate block max-w-xs">
                    {project.description.length > 70 ? project.description.substring(0, 70) + "..." : project.description}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[60vh] max-h-[700px] bg-background rounded-lg">
      <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between rounded-t-lg">
        <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={handleChangeProject} className="mr-2 text-muted-foreground hover:text-foreground">
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <h3 className="text-sm font-semibold text-foreground truncate">
                Chatting about: <span className="text-primary">{selectedProject.title}</span>
            </h3>
        </div>
      </div>
      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex items-end space-x-2 animate-fadeInUpScale',
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              )}
              style={{animationDelay: '50ms'}}
            >
              {message.sender === 'mrm' && (
                <Bot className="h-7 w-7 text-primary flex-shrink-0 mb-1" />
              )}
              <div
                className={cn(
                  'p-3 rounded-xl max-w-[75%] shadow-md',
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-muted text-foreground rounded-bl-none border border-border'
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                 <p className="text-xs opacity-70 mt-1 text-right">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {message.sender === 'user' && (
                <User className="h-7 w-7 text-muted-foreground flex-shrink-0 mb-1" />
              )}
            </div>
          ))}
          {isLoadingAnswer && (
             <div className="flex items-end space-x-2 justify-start">
                <Bot className="h-7 w-7 text-primary flex-shrink-0 mb-1" />
                <div className="p-3 rounded-xl max-w-[75%] shadow-md bg-muted text-foreground rounded-bl-none border border-border">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t border-border flex items-center space-x-2 bg-muted/50 rounded-b-lg"
      >
        <Input
          ref={inputRef}
          type="text"
          placeholder={`Ask about ${selectedProject.title}...`}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex-grow bg-background focus-visible:ring-primary/80"
          disabled={isLoadingAnswer}
          autoFocus
        />
        <Button type="submit" size="icon" disabled={isLoadingAnswer || !inputValue.trim()} className="bg-primary hover:bg-primary/90">
          <Send className="h-5 w-5" />
          <span className="sr-only">Send message</span>
        </Button>
      </form>
    </div>
  );
}
