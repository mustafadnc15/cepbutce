const { colors, spacing, radius } = require('./src/theme/tokens');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.tsx',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: colors.light.brand,
        text: colors.light.text,
        bg: colors.light.bg,
        semantic: colors.light.semantic,
        hero: colors.light.hero,
      },
      spacing,
      borderRadius: radius,
    },
  },
  plugins: [],
};
