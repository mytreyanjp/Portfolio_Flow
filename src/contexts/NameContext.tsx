
'use client';

import React, { createContext, useState, useEffect, useContext, type ReactNode } from 'react';

interface NameContextType {
  userName: string | null;
  setUserName: (name: string | null) => void;
  isLoadingName: boolean;
  detectedLanguage: string | null;
  setDetectedLanguage: (lang: string | null) => void;
}

const NameContext = createContext<NameContextType | undefined>(undefined);

const USER_NAME_STORAGE_KEY = 'portfolioUserName';
const DETECTED_LANG_STORAGE_KEY = 'portfolioDetectedLanguage';

export const NameProvider = ({ children }: { children: ReactNode }) => {
  const [userName, setUserNameState] = useState<string | null>(null);
  const [detectedLanguage, setDetectedLanguageState] = useState<string | null>(null);
  const [isLoadingName, setIsLoadingName] = useState(true); // Covers loading for both

  useEffect(() => {
    try {
      const storedName = localStorage.getItem(USER_NAME_STORAGE_KEY);
      if (storedName) {
        setUserNameState(storedName);
      }
      const storedLang = localStorage.getItem(DETECTED_LANG_STORAGE_KEY);
      if (storedLang) {
        setDetectedLanguageState(storedLang);
      }
    } catch (error) {
      console.warn('Failed to load name/language from localStorage:', error);
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

  const setDetectedLanguage = (lang: string | null) => {
    try {
      if (lang) {
        localStorage.setItem(DETECTED_LANG_STORAGE_KEY, lang);
      } else {
        localStorage.removeItem(DETECTED_LANG_STORAGE_KEY);
      }
      setDetectedLanguageState(lang);
    } catch (error) {
      console.warn('Failed to save language to localStorage:', error);
    }
  };

  return (
    <NameContext.Provider value={{ userName, setUserName, isLoadingName, detectedLanguage, setDetectedLanguage }}>
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

