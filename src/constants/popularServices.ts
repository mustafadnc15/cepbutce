import type { BillingCycle } from '../types';

export interface PopularService {
  id: string;
  name: string;
  color: string;
  // Defaults are TRY hints so the new-sub form fills reasonably; the user can
  // still edit everything before saving.
  defaultAmount: number;
  defaultCycle: BillingCycle;
  // Feather icon that fits the service visual.
  icon: string;
  // Which default category the service most naturally belongs to.
  categoryId: string;
}

export const POPULAR_SERVICES: PopularService[] = [
  {
    id: 'netflix',
    name: 'Netflix',
    color: '#E50914',
    defaultAmount: 229.99,
    defaultCycle: 'monthly',
    icon: 'film',
    categoryId: 'cat_entertainment',
  },
  {
    id: 'spotify',
    name: 'Spotify',
    color: '#1DB954',
    defaultAmount: 71.99,
    defaultCycle: 'monthly',
    icon: 'music',
    categoryId: 'cat_entertainment',
  },
  {
    id: 'youtube-premium',
    name: 'YouTube Premium',
    color: '#FF0000',
    defaultAmount: 57.99,
    defaultCycle: 'monthly',
    icon: 'youtube',
    categoryId: 'cat_entertainment',
  },
  {
    id: 'icloud',
    name: 'iCloud+',
    color: '#007AFF',
    defaultAmount: 14.99,
    defaultCycle: 'monthly',
    icon: 'cloud',
    categoryId: 'cat_bills',
  },
  {
    id: 'chatgpt-plus',
    name: 'ChatGPT Plus',
    color: '#10A37F',
    defaultAmount: 20,
    defaultCycle: 'monthly',
    icon: 'message-circle',
    categoryId: 'cat_education',
  },
  {
    id: 'apple-music',
    name: 'Apple Music',
    color: '#FA2D48',
    defaultAmount: 29.99,
    defaultCycle: 'monthly',
    icon: 'headphones',
    categoryId: 'cat_entertainment',
  },
  {
    id: 'disney-plus',
    name: 'Disney+',
    color: '#113CCF',
    defaultAmount: 139.99,
    defaultCycle: 'monthly',
    icon: 'film',
    categoryId: 'cat_entertainment',
  },
  {
    id: 'amazon-prime',
    name: 'Amazon Prime',
    color: '#FF9900',
    defaultAmount: 39,
    defaultCycle: 'monthly',
    icon: 'shopping-bag',
    categoryId: 'cat_shopping',
  },
];
