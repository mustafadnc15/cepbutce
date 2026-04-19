import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

// Exposed so non-screen code (sheet store handlers, deep-link callbacks) can
// trigger navigation without being mounted inside the tree.
export const navigationRef = createNavigationContainerRef<RootStackParamList>();
