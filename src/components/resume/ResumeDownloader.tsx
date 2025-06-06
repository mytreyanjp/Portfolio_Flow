
'use client';

import { Button } from '@/components/ui/button';
import { Download, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import React, { useState, useEffect, useCallback } from 'react';
import { getResumeData } from '@/services/resumeService';
import { useToast } from '@/hooks/use-toast';
import { DEFAULT_RESUME_DATA } from '@/data/resumeData';

export default function ResumeDownloader() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | undefined>(DEFAULT_RESUME_DATA.resumePdfUrl);
  const { toast } = useToast();

  const fetchResumeUrl = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getResumeData();
      if (data.resumePdfUrl && data.resumePdfUrl.trim() !== '') {
        setResumeUrl(data.resumePdfUrl);
      } else {
        setResumeUrl(undefined); // No URL set or it's empty
      }
    } catch (err) {
      console.error("Failed to fetch resume URL:", err);
      setError("Could not load resume link. Please try again later.");
      setResumeUrl(DEFAULT_RESUME_DATA.resumePdfUrl); // Fallback to default if error
      toast({
        title: "Error",
        description: "Failed to load resume link.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchResumeUrl();
  }, [fetchResumeUrl]);

  const handleOpenResume = () => {
    if (isLoading || error || !resumeUrl) {
        toast({
            title: "Resume Not Available",
            description: error || "The resume link is not configured yet or there was an issue loading it.",
            variant: "destructive",
        });
      return;
    }
    window.open(resumeUrl, '_blank');
  };

  if (isLoading) {
    return (
      <Button 
        variant="outline"
        className={cn(
          "w-full shadow-md hover:shadow-lg",
          "hover:scale-105 transition-transform duration-200 ease-out hover:bg-background"
        )}
        size="lg"
        disabled
      >
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading Link...
      </Button>
    );
  }

  return (
    <Button 
      onClick={handleOpenResume} 
      variant="outline"
      className={cn(
        "w-full shadow-md hover:shadow-lg",
        "hover:scale-105 transition-transform duration-200 ease-out hover:bg-background",
        (!resumeUrl || error) && "opacity-70 cursor-not-allowed"
      )}
      size="lg"
      disabled={!resumeUrl || !!error}
      title={!resumeUrl ? "Resume link not set" : error ? "Error loading link" : "View Resume"}
    >
      {error ? <AlertTriangle className="mr-2 h-5 w-5 text-destructive" /> : <Download className="mr-2 h-5 w-5" />}
      {error ? "Link Error" : "View Resume"}
    </Button>
  );
}
