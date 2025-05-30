
'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ResumeDownloader() {
  const handleDownload = () => {
    const resumeUrl = '/mytreyan_resume.pdf'; 
    
    const link = document.createElement('a');
    link.href = resumeUrl;
    link.setAttribute('download', 'Mytreyan_JP_Resume.pdf'); 
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button 
      onClick={handleDownload} 
      className={cn(
        "w-full shadow-md hover:shadow-lg",
        "hover:scale-105 transition-transform duration-200 ease-out hover:bg-primary" // Keeps primary bg on hover
      )}
      size="lg"
    >
      <Download className="mr-2 h-5 w-5" />
      Download Resume
    </Button>
  );
}
