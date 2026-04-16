import { Category } from '../types';

// Default Turkish categories seeded on first DB migration.
// IDs are stable so migrations and fixtures can reference them.

export const DEFAULT_CATEGORIES: Category[] = [
  // Expenses
  { id: 'cat_food', name: 'Yemek & İçecek', icon: 'coffee', color: '#FF9500', type: 'expense', isDefault: true },
  { id: 'cat_transport', name: 'Ulaşım', icon: 'navigation', color: '#007AFF', type: 'expense', isDefault: true },
  { id: 'cat_shopping', name: 'Alışveriş', icon: 'shopping-bag', color: '#FF2D55', type: 'expense', isDefault: true },
  { id: 'cat_bills', name: 'Faturalar', icon: 'file-text', color: '#5856D6', type: 'expense', isDefault: true },
  { id: 'cat_health', name: 'Sağlık', icon: 'heart', color: '#FF3B30', type: 'expense', isDefault: true },
  { id: 'cat_entertainment', name: 'Eğlence', icon: 'film', color: '#AF52DE', type: 'expense', isDefault: true },
  { id: 'cat_education', name: 'Eğitim', icon: 'book-open', color: '#00C864', type: 'expense', isDefault: true },
  { id: 'cat_housing', name: 'Konut & Kira', icon: 'home', color: '#8E8E93', type: 'expense', isDefault: true },
  { id: 'cat_other_expense', name: 'Diğer', icon: 'more-horizontal', color: '#C7C7CC', type: 'expense', isDefault: true },
  // Income
  { id: 'cat_salary', name: 'Maaş', icon: 'briefcase', color: '#00C864', type: 'income', isDefault: true },
  { id: 'cat_freelance', name: 'Freelance', icon: 'monitor', color: '#30D158', type: 'income', isDefault: true },
  { id: 'cat_other_income', name: 'Diğer Gelir', icon: 'plus-circle', color: '#34C759', type: 'income', isDefault: true },
];
