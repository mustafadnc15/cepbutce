// @ts-expect-error - tokens.js is untyped CommonJS
import tokens from './tokens';

export const spacing = tokens.spacing as {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
};
