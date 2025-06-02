
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Zap } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

export default function SecretLairPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] py-12">
      <Card className="w-full max-w-md shadow-2xl animate-fadeInUpScale">
        <CardHeader className="text-center">
          <Zap className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
          <CardTitle className="text-3xl font-bold text-primary">Access Granted!</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Welcome to the Secret Lair, Agent M.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-foreground/80">
            This is a hidden section of PortfolioFlow. You've proven your keen observation skills.
          </p>
          <div className="p-4 bg-muted/50 border border-dashed border-primary/50 rounded-lg">
            <ShieldCheck className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-sm text-primary font-semibold">TOP SECRET</p>
            <p className="text-xs text-muted-foreground">Further instructions await...</p>
          </div>
          <Button asChild variant="outline" className="w-full hover:bg-primary/10 hover:text-primary">
            <Link href="/">Return to Portfolio</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
