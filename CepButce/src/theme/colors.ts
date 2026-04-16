// @ts-expect-error - tokens.js is untyped CommonJS
import tokens from './tokens';

export const colorsLight = tokens.colors.light;
export const colorsDark = tokens.colors.dark;

export type ColorTokens = typeof tokens.colors.light;
