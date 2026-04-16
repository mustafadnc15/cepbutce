import tokens from './tokens';
import type { TextStyle } from 'react-native';

export const typography = tokens.typography as Record<
  | 'pageTitle'
  | 'bigNumber'
  | 'sectionHead'
  | 'cardTitle'
  | 'listTitle'
  | 'body'
  | 'greeting'
  | 'subtitle'
  | 'caption'
  | 'navLabel',
  Pick<TextStyle, 'fontSize' | 'fontWeight'>
>;
