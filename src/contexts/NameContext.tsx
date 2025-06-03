
'use client';

import React, { createContext, useState, useEffect, useContext, type ReactNode } from 'react';

interface NameContextType {
  userName: string | null;
  setUserName: (name: string | null) => void;
  isLoadingName: boolean;
}

const NameContext = createContext<NameContextType | undefined>(undefined);

const USER_NAME_STORAGE_KEY = 'portfolioUserName';

export const NameProvider = ({ children }: { children: ReactNode }) => {
  const [userName, setUserNameState] = useState<string | null>(null);
  const [isLoadingName, setIsLoadingName] = useState(true);

  useEffect(() => {
    try {
      const storedName = localStorage.getItem(USER_NAME_STORAGE_KEY);
      if (storedName) {
        setUserNameState(storedName);
      }
    } catch (error) {
      console.warn('Failed to load name from localStorage:', error);
    } finally {
      setIsLoadingName(false);
    }
  }, []);

  const setUserName = (name: string | null) => {
    try {
      if (name) {
        localStorage.setItem(USER_NAME_STORAGE_KEY, name);
      } else {
        localStorage.removeItem(USER_NAME_STORAGE_KEY);
      }
      setUserNameState(name);
    } catch (error) {
      console.warn('Failed to save name to localStorage:', error);
    }
  };

  return (
    <NameContext.Provider value={{ userName, setUserName, isLoadingName }}>
      {children}
    </NameContext.Provider>
  );
};

export const useName = (): NameContextType => {
  const context = useContext(NameContext);
  if (context === undefined) {
    throw new Error('useName must be used within a NameProvider');
  }
  return context;
};
