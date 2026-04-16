import { create } from 'zustand';
import dayjs from 'dayjs';
import { Budget } from '../types';
import { getDB } from '../db/connection';
import { generateId } from '../utils/id';
import { useTransactionStore } from './useTransactionStore';

interface BudgetState {
  budgets: Budget[];
  loading: boolean;

  loadAll: () => void;
  setBudget: (budget: Omit<Budget, 'id'>) => Budget;
  removeBudget: (id: string) => void;

  overallBudget: () => Budget | undefined;
  spentThisMonth: () => number;
  remainingThisMonth: () => number;
  spentByCategory: (categoryId: string) => number;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  budgets: [],
  loading: false,

  loadAll: () => {
    set({ loading: true });
    try {
      const db = getDB();
      const result = db.executeSync(`SELECT * FROM budgets;`);
      const rows = (result.rows ?? []) as unknown as Budget[];
      set({ budgets: rows, loading: false });
    } catch (e) {
      set({ loading: false });
    }
  },

  setBudget: (input) => {
    const budget: Budget = { ...input, id: generateId() };
    const db = getDB();
    db.executeSync(
      `INSERT INTO budgets (id, categoryId, amount, period, currency) VALUES (?, ?, ?, ?, ?);`,
      [budget.id, budget.categoryId, budget.amount, budget.period, budget.currency]
    );
    set((state) => ({ budgets: [...state.budgets, budget] }));
    return budget;
  },

  removeBudget: (id) => {
    const db = getDB();
    db.executeSync(`DELETE FROM budgets WHERE id = ?;`, [id]);
    set((state) => ({ budgets: state.budgets.filter((b) => b.id !== id) }));
  },

  overallBudget: () => get().budgets.find((b) => b.categoryId === null),

  spentThisMonth: () => {
    const start = dayjs().startOf('month').toISOString();
    const end = dayjs().endOf('month').toISOString();
    return useTransactionStore
      .getState()
      .getByDateRange(start, end)
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  },

  remainingThisMonth: () => {
    const overall = get().overallBudget();
    if (!overall) return 0;
    return overall.amount - get().spentThisMonth();
  },

  spentByCategory: (categoryId) => {
    const start = dayjs().startOf('month').toISOString();
    const end = dayjs().endOf('month').toISOString();
    return useTransactionStore
      .getState()
      .getByDateRange(start, end)
      .filter((t) => t.categoryId === categoryId && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  },
}));
