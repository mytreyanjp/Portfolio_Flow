
'use client';

import React from 'react';
import Script from 'next/script';
import { useToast } from '@/hooks/use-toast';

interface CloonedViewerProps {
  oid: string;
  features?: string;
}

const CLOONED_SCRIPT_SRC = "https://clooned.com/wp-content/uploads/cloons/scripts/clooned.js";

const CloonedViewer: React.FC<CloonedViewerProps> = ({ oid, features = "lsc;dt;fs" }) => {
  const { toast } = useToast();

  return (
    <>
      <Script
        id="clooned-script" // Unique ID for the script tag
        src={CLOONED_SCRIPT_SRC}
        strategy="afterInteractive"
        onError={(e) => {
          console.error("Failed to load Clooned script:", e);
          toast({
            title: "3D Viewer Error",
            description: "Could not load the Clooned 3D viewer script. The model may not display.",
            variant: "destructive",
          });
        }}
      />
      {/* This div ensures the clooned-object takes up the full space allocated by its parent in ProjectCard */}
      <div className="w-full h-full">
        <clooned-object
          features={features}
          oid={oid}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      </div>
    </>
  );
};

export default CloonedViewer;
