'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export default function ResumeDownloader() {
  const handleDownload = () => {
    // In a real scenario, this would point to your actual resume PDF file
    // For this placeholder, we'll simulate by trying to open a non-existent file,
    // or you could host a sample PDF somewhere.
    const resumeUrl = '/placeholder-resume.pdf'; 
    
    // Create a link element
    const link = document.createElement('a');
    link.href = resumeUrl;
    link.setAttribute('download', 'My_Resume.pdf'); // or any other filename
    
    // Append to the DOM, click it, and then remove it
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // alert('Resume download started (placeholder). In a real app, this would download your resume PDF.');
  };

  return (
    <Button onClick={handleDownload} className="w-full shadow-md hover:shadow-lg" size="lg">
      <Download className="mr-2 h-5 w-5" />
      Download Resume
    </Button>
  );
}
