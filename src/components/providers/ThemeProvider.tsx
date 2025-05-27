
'use client';

import type { FC, PropsWithChildren } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';
import type { ThemeProviderProps as NextThemesProviderProps } from 'next-themes/dist/types';

type ThemeTransitionContextType = {
  triggerThemeChange: (newTheme: 'light' | 'dark') => void;
  isTransitioning: boolean;
  resolvedTheme?: string;
};

const ThemeTransitionContext = createContext<ThemeTransitionContextType | undefined>(undefined);

export const useThemeTransition = () => {
  const context = useContext(ThemeTransitionContext);
  if (!context) {
    throw new Error('useThemeTransition must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: FC<PropsWithChildren<NextThemesProviderProps>> = ({ children, ...props }) => {
  const [transitionPhase, setTransitionPhase] = useState<'idle' | 'wipingIn' | 'wipingOut'>('idle');
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayAnimationClass, setOverlayAnimationClass] = useState('');
  
  // Inner component to access useNextTheme context
  const ThemeManager: FC<PropsWithChildren> = ({ children: managerChildren }) => {
    const { setTheme: actualSetTheme, resolvedTheme } = useNextTheme();

    const triggerThemeChange = (newTheme: 'light' | 'dark') => {
      if (transitionPhase !== 'idle') return;

      setOverlayAnimationClass('animate-wipe-in-top');
      setOverlayVisible(true);
      setTransitionPhase('wipingIn');

      setTimeout(() => {
        actualSetTheme(newTheme);
        setTimeout(() => {
          setOverlayAnimationClass('animate-wipe-out-bottom');
          setTransitionPhase('wipingOut');
          setTimeout(() => {
            setTransitionPhase('idle');
            setOverlayVisible(false);
            setOverlayAnimationClass('');
          }, 500); // Wipe-out duration
        }, 100); // Theme apply delay
      }, 500); // Wipe-in duration
    };
    
    return (
      <ThemeTransitionContext.Provider value={{ triggerThemeChange, isTransitioning: transitionPhase !== 'idle', resolvedTheme }}>
        {managerChildren}
        {overlayVisible && (
          <div
            className={`fixed inset-0 bg-card/95 z-[9999] ${overlayAnimationClass}`}
            // Using card color with opacity for overlay - it will pick up current theme's card color before switching
          />
        )}
      </ThemeTransitionContext.Provider>
    );
  };

  return (
    <NextThemesProvider {...props}>
      <ThemeManager>
        {children}
      </ThemeManager>
    </NextThemesProvider>
  );
};
