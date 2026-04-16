import React, { createContext, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { buildTheme, Theme } from './index';
import { useSettingsStore, type ThemePreference } from '../stores/useSettingsStore';

export type { ThemePreference };

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const preference = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const effectiveDark =
    preference === 'system' ? systemScheme === 'dark' : preference === 'dark';

  const theme = buildTheme(effectiveDark);

  const value: ThemeContextValue = {
    theme,
    isDark: effectiveDark,
    themePreference: preference,
    setThemePreference: setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
