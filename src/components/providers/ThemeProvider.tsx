
'use client';

import type { FC, PropsWithChildren } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps as NextThemesProviderProps } from 'next-themes/dist/types';

export const ThemeProvider: FC<PropsWithChildren<NextThemesProviderProps>> = ({ children, ...props }) => {
  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  );
};
