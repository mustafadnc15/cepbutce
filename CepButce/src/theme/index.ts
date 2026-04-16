import { colorsLight, colorsDark, ColorTokens } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { radius } from './radius';
import { shadows } from './shadows';

export { colorsLight, colorsDark, typography, spacing, radius, shadows };
export type { ColorTokens };

export interface Theme {
  colors: ColorTokens;
  typography: typeof typography;
  spacing: typeof spacing;
  radius: typeof radius;
  shadows: typeof shadows;
  isDark: boolean;
}

export function buildTheme(isDark: boolean): Theme {
  return {
    colors: isDark ? colorsDark : colorsLight,
    typography,
    spacing,
    radius,
    shadows,
    isDark,
  };
}

// ThemeProvider + useTheme + ThemePreference are re-exported from
// ThemeProvider.tsx after it's created in Task 16.
