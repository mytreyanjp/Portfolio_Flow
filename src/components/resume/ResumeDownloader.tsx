
'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ResumeDownloader() {
  const handleOpenResume = () => {
    // Placeholder URL for a hosted resume. Replace with your actual link.
    const resumeUrl = 'https://example.com/placeholder-resume.pdf'; 
    
    window.open(resumeUrl, '_blank');
  };

  return (
    <Button 
      onClick={handleOpenResume} 
      className={cn(
        "w-full shadow-md hover:shadow-lg",
        "hover:scale-105 transition-transform duration-200 ease-out hover:bg-primary"
      )}
      size="lg"
    >
      <Download className="mr-2 h-5 w-5" />
      View Resume
    </Button>
  );
}
