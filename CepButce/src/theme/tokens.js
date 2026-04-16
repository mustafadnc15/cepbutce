// Source of truth for design tokens. Consumed by both TypeScript (via
// src/theme/*.ts imports) and tailwind.config.js. CommonJS so Node-side
// Tailwind config can require() it without transpilation.

const colors = {
  light: {
    brand: {
      primary: '#00C864',
      primaryTint: '#E6F9EE',
      primaryLight: '#F0FBF5',
      primaryBorder: '#B8EDD1',
    },
    text: {
      primary: '#111111',
      secondary: '#888888',
      placeholder: '#999999',
      white: '#FFFFFF',
    },
    bg: {
      page: '#F5F5F5',
      card: '#FFFFFF',
    },
    border: {
      card: '#E5E5E5',
      input: '#E5E5E5',
    },
    semantic: {
      error: '#FF3B30',
      warning: '#FF9500',
      income: '#00C864',
      expense: '#FF3B30',
    },
  },
  dark: {
    brand: {
      primary: '#00C864',
      primaryTint: '#1A3D2A',
      primaryLight: '#162E20',
      primaryBorder: '#2D5C42',
    },
    text: {
      primary: '#F5F5F5',
      secondary: '#A0A0A0',
      placeholder: '#666666',
      white: '#FFFFFF',
    },
    bg: {
      page: '#0A0A0A',
      card: '#1C1C1E',
    },
    border: {
      card: '#2C2C2E',
      input: '#3A3A3C',
    },
    semantic: {
      error: '#FF3B30',
      warning: '#FF9500',
      income: '#00C864',
      expense: '#FF3B30',
    },
  },
};

const typography = {
  pageTitle: { fontSize: 28, fontWeight: '700' },
  bigNumber: { fontSize: 24, fontWeight: '700' },
  sectionHead: { fontSize: 20, fontWeight: '600' },
  cardTitle: { fontSize: 17, fontWeight: '600' },
  listTitle: { fontSize: 14, fontWeight: '600' },
  body: { fontSize: 14, fontWeight: '400' },
  greeting: { fontSize: 13, fontWeight: '400' },
  subtitle: { fontSize: 12, fontWeight: '400' },
  caption: { fontSize: 11, fontWeight: '400' },
  navLabel: { fontSize: 10, fontWeight: '500' },
};

const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 };

const radius = {
  sm: 8,
  md: 12,
  input: 14,
  card: 16,
  lg: 20,
  header: 28,
  full: 9999,
};

module.exports = { colors, typography, spacing, radius };
