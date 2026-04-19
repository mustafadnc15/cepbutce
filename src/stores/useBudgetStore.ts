import { create } from 'zustand';
import dayjs from 'dayjs';
import { Budget, BudgetPeriod } from '../types';
import { getDB } from '../db/connection';
import { generateId } from '../utils/id';
import { useTransactionStore } from './useTransactionStore';

interface BudgetState {
  budgets: Budget[];
  loading: boolean;

  loadAll: () => void;
  setBudget: (budget: Omit<Budget, 'id'>) => Budget;
  // Upsert-by-categoryId: if a budget already exists for the given categoryId
  // (including `null` for overall), the amount/period/currency are patched in
  // place rather than a second row created. Keeps BudgetSettings idempotent.
  upsertBudget: (input: {
    categoryId: string | null;
    amount: number;
    period: BudgetPeriod;
    currency: string;
  }) => Budget;
  updateBudget: (id: string, patch: Partial<Omit<Budget, 'id'>>) => void;
  removeBudget: (id: string) => void;
  removeBudgetByCategory: (categoryId: string | null) => void;

  overallBudget: () => Budget | undefined;
  budgetForCategory: (categoryId: string) => Budget | undefined;
  categoryBudgets: () => Budget[];

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

  upsertBudget: (input) => {
    const existing = get().budgets.find((b) => b.categoryId === input.categoryId);
    if (existing) {
      const db = getDB();
      db.executeSync(
        `UPDATE budgets SET amount = ?, period = ?, currency = ? WHERE id = ?;`,
        [input.amount, input.period, input.currency, existing.id]
      );
      const updated: Budget = { ...existing, ...input };
      set((state) => ({
        budgets: state.budgets.map((b) => (b.id === existing.id ? updated : b)),
      }));
      return updated;
    }
    return get().setBudget(input);
  },

  updateBudget: (id, patch) => {
    const existing = get().budgets.find((b) => b.id === id);
    if (!existing) return;
    const updated: Budget = { ...existing, ...patch };
    const db = getDB();
    db.executeSync(
      `UPDATE budgets SET categoryId = ?, amount = ?, period = ?, currency = ? WHERE id = ?;`,
      [updated.categoryId, updated.amount, updated.period, updated.currency, id]
    );
    set((state) => ({
      budgets: state.budgets.map((b) => (b.id === id ? updated : b)),
    }));
  },

  removeBudget: (id) => {
    const db = getDB();
    db.executeSync(`DELETE FROM budgets WHERE id = ?;`, [id]);
    set((state) => ({ budgets: state.budgets.filter((b) => b.id !== id) }));
  },

  removeBudgetByCategory: (categoryId) => {
    const match = get().budgets.find((b) => b.categoryId === categoryId);
    if (match) get().removeBudget(match.id);
  },

  overallBudget: () => get().budgets.find((b) => b.categoryId === null),
  budgetForCategory: (categoryId) =>
    get().budgets.find((b) => b.categoryId === categoryId),
  categoryBudgets: () => get().budgets.filter((b) => b.categoryId !== null),

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
