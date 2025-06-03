
'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Send, Loader2, ChevronLeft, RefreshCw, AlertTriangle, Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { askMrMAboutProject, ProjectQnaInput, ProjectZod } from '@/ai/flows/project-qna-flow';
import { useToast } from '@/hooks/use-toast';
import type { Project } from '@/data/projects';
import { getProjects } from '@/services/projectsService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useName } from '@/contexts/NameContext'; // Import useName

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'mrm';
  timestamp: Date;
}

const ALL_CATEGORIES_FILTER_VALUE = "_ALL_CATEGORIES_"; // Special value for "All Categories"

export default function MrMChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { userName } = useName(); // Get userName from context

  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [projectFetchError, setProjectFetchError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(''); // Empty string means all
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  const fetchProjectsList = useCallback(async () => {
    setIsLoadingProjects(true);
    setProjectFetchError(null);
    try {
      const fetched = await getProjects();
      let processedProjects = fetched;
      if (fetched.length > 1) {
        processedProjects = fetched.filter(p => p.id !== 'default-project-1');
      } else if (fetched.length === 1 && fetched[0].id === 'default-project-1' && fetched[0].title.includes('Sample Project')) {
        processedProjects = fetched;
      }
      setProjectsList(processedProjects.sort((a,b) => a.title.localeCompare(b.title)));

      const categories = Array.from(
        new Set(processedProjects.flatMap(p => p.categories || []).filter(Boolean))
      ).sort();
      setAvailableCategories(categories);

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

  const filteredProjects = useMemo(() => {
    if (!projectsList) return [];
    return projectsList.filter(project => {
      const titleMatch = project.title.toLowerCase().includes(searchTerm.toLowerCase());
      const categoryMatch = selectedCategoryFilter
        ? project.categories && project.categories.some(cat => cat.toLowerCase() === selectedCategoryFilter.toLowerCase())
        : true;
      return titleMatch && categoryMatch;
    });
  }, [projectsList, searchTerm, selectedCategoryFilter]);

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
    const greetingName = userName ? `${userName}, ` : '';
    setMessages([
      {
        id: `mrm-greeting-${Date.now()}`,
        text: `Hello ${greetingName}I'm Mr.M. We're now discussing "${project.title}". How can I help you with this project?`,
        sender: 'mrm',
        timestamp: new Date(),
      }
    ]);
    setInputValue('');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleChangeProject = () => {
    setSelectedProject(null);
    setMessages([]);
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
      // Filter out the initial contextual greeting if it contains the project selection part
      .filter(msg => msg.sender !== 'mrm' || !msg.text.includes(`We're now discussing "${selectedProject.title}"`))
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
    }));
    
    // Add the current user's question to history if it's not already there through setMessages
    if (!chatHistoryForAI.some(m => m.parts[0].text === question && m.role === 'user')) {
        chatHistoryForAI.push({ role: 'user', parts: [{ text: question }]});
    }


    const projectContextForAI: ProjectZod = {
        id: selectedProject.id,
        title: selectedProject.title,
        description: selectedProject.description,
        longDescription: selectedProject.longDescription || undefined,
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
        <CardHeader className="text-center pb-2 pt-2">
          <CardTitle className="text-xl">Select a Project</CardTitle>
          <CardDescription>Choose a project to discuss. Use search or filter by category.</CardDescription>
        </CardHeader>
        <div className="p-3 border-b border-border space-y-3 sm:space-y-0 sm:flex sm:space-x-3">
            <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search projects by title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-full"
                />
            </div>
            <div className="flex-shrink-0 sm:w-56">
                <Select
                  value={selectedCategoryFilter === '' ? ALL_CATEGORIES_FILTER_VALUE : selectedCategoryFilter}
                  onValueChange={(value) => setSelectedCategoryFilter(value === ALL_CATEGORIES_FILTER_VALUE ? '' : value)}
                >
                    <SelectTrigger className="w-full">
                        <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_CATEGORIES_FILTER_VALUE}>All Categories</SelectItem>
                        {availableCategories.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
        <ScrollArea className="flex-grow p-3 rounded-lg">
          {projectsList.length === 0 && !isLoadingProjects && (
            <p className="text-muted-foreground text-center py-10">No projects available to discuss.</p>
          )}
           {filteredProjects.length === 0 && (searchTerm || selectedCategoryFilter) && projectsList.length > 0 && (
             <p className="text-muted-foreground text-center py-10">No projects found matching your criteria.</p>
           )}
          <div className="grid grid-cols-1 gap-2.5">
            {filteredProjects.map(project => (
              <Button
                key={project.id}
                variant="outline"
                className="w-full h-auto py-2.5 px-3 text-left justify-between items-center hover:bg-accent/60 transition-all duration-150 ease-in-out flex"
                onClick={() => handleSelectProject(project)}
              >
                <span className="font-medium text-sm text-foreground flex-grow truncate mr-2">{project.title}</span>
                {project.categories && project.categories.length > 0 && (
                    <Badge variant="secondary" className="text-xs ml-auto shrink-0 whitespace-nowrap">
                        {project.categories[0]}
                    </Badge>
                )}
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
        <div className="flex items-center min-w-0"> {/* Ensure parent can shrink */}
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

