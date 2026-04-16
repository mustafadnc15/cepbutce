// @ts-expect-error - tokens.js is untyped CommonJS
import tokens from './tokens';

export const radius = tokens.radius as {
  sm: number;
  md: number;
  input: number;
  card: number;
  lg: number;
  header: number;
  full: number;
};
