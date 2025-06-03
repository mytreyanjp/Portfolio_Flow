
'use client';

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { auth } from '@/lib/firebase/firebase'; // Ensure auth is exported from firebase.ts
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  signInWithGoogle: () => Promise<User | null>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      setError(new Error("Firebase Auth is not initialized."));
      console.error("Firebase Auth is not initialized in AuthProvider.");
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    }, (authError) => {
      console.error("Auth state change error:", authError);
      setError(authError);
      setIsLoading(false);
      toast({
        title: "Authentication Error",
        description: "Could not verify your authentication status. Please try refreshing.",
        variant: "destructive",
      });
    });

    return () => unsubscribe();
  }, [toast]);

  const signInWithGoogle = async (): Promise<User | null> => {
    if (!auth) {
      const authError = new Error("Firebase Auth is not initialized for Google Sign-In.");
      setError(authError);
      toast({ title: "Sign-In Error", description: authError.message, variant: "destructive" });
      console.error("AuthContext: signInWithGoogle called but auth object is not available.");
      return null;
    }
    setIsLoading(true);
    setError(null);
    // Explicitly pass the auth instance
    const provider = new GoogleAuthProvider(auth); 
    try {
      const sdkAuthDomain = auth.app.options.authDomain;
      const sdkProjectId = auth.app.options.projectId;
      console.log(`AuthContext: Attempting Google Sign-In. Using authDomain from SDK: ${sdkAuthDomain}, ProjectID: ${sdkProjectId}`);

      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      toast({ title: "Signed In", description: "Successfully signed in with Google." });
      return result.user;
    } catch (e: any) {
      console.error("Google Sign-In error:", e);
      const sdkAuthDomainOnError = auth.app.options.authDomain;
      const sdkProjectIdOnError = auth.app.options.projectId;
      console.error(`AuthContext: Google Sign-In failed. authDomain from SDK at time of error: ${sdkAuthDomainOnError}, ProjectID: ${sdkProjectIdOnError}`);
      setError(e);
      toast({ title: "Sign-In Failed", description: e.message || "Could not sign in with Google. Please try again.", variant: "destructive" });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const signOutUser = async (): Promise<void> => {
    if (!auth) {
      const authError = new Error("Firebase Auth is not initialized for Sign-Out.");
      setError(authError);
      toast({ title: "Sign-Out Error", description: authError.message, variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await signOut(auth);
      setUser(null);
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
    } catch (e: any) {
      console.error("Sign-Out error:", e);
      setError(e);
      toast({ title: "Sign-Out Failed", description: e.message || "Could not sign out. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, signInWithGoogle, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
