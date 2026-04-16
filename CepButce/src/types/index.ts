export type TransactionType = 'income' | 'expense';
export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type BudgetPeriod = 'weekly' | 'monthly' | 'yearly';

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  type: TransactionType;
  categoryId: string;
  note: string | null;
  date: string; // ISO
  receiptUri: string | null;
  receiptOcrData: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  isDefault: boolean;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  categoryId: string;
  startDate: string;
  nextRenewalDate: string;
  icon: string;
  color: string;
  note: string | null;
  isActive: boolean;
  remindBefore: number; // days
  createdAt: string;
}

export interface Budget {
  id: string;
  categoryId: string | null; // null = overall budget
  amount: number;
  period: BudgetPeriod;
  currency: string;
}
