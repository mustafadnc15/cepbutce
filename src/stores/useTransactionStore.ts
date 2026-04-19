import { create } from 'zustand';
import dayjs from 'dayjs';
import { Transaction, TransactionType } from '../types';
import { getDB } from '../db/connection';
import { generateId } from '../utils/id';

interface TransactionState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;

  loadTransactions: () => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Transaction;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  getByDateRange: (start: string, end: string) => Transaction[];
  getByCategory: (categoryId: string) => Transaction[];
  getByType: (type: TransactionType) => Transaction[];
  getRecentN: (n: number) => Transaction[];
  getTotalByType: (type: TransactionType) => number;
  /** Array of daily expense totals for the month containing `date`. Index 0
   *  is day 1; length = daysInMonth. Consumed by the Focus hero rhythm bars. */
  dailySpendForMonth: (date: Date) => number[];
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  loading: false,
  error: null,

  loadTransactions: () => {
    set({ loading: true, error: null });
    try {
      const db = getDB();
      const result = db.executeSync(`SELECT * FROM transactions ORDER BY date DESC;`);
      // Raw DB rows have subscriptionId as string or null; pre-migration rows
      // may lack the column entirely, so normalize to null.
      const rows = (result.rows ?? []).map((r) => ({
        ...r,
        subscriptionId: (r.subscriptionId as string | null | undefined) ?? null,
      })) as unknown as Transaction[];
      set({ transactions: rows, loading: false });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : String(e) });
    }
  },

  addTransaction: (input) => {
    const now = new Date().toISOString();
    const tx: Transaction = {
      ...input,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    const db = getDB();
    db.executeSync(
      `INSERT INTO transactions (id, amount, currency, type, categoryId, note, date, receiptUri, receiptOcrData, subscriptionId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [tx.id, tx.amount, tx.currency, tx.type, tx.categoryId, tx.note, tx.date, tx.receiptUri, tx.receiptOcrData, tx.subscriptionId, tx.createdAt, tx.updatedAt]
    );
    set((state) => ({ transactions: [tx, ...state.transactions] }));
    return tx;
  },

  updateTransaction: (id, patch) => {
    const existing = get().transactions.find((t) => t.id === id);
    if (!existing) return;
    const updated: Transaction = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    const db = getDB();
    db.executeSync(
      `UPDATE transactions SET amount=?, currency=?, type=?, categoryId=?, note=?, date=?, receiptUri=?, receiptOcrData=?, subscriptionId=?, updatedAt=? WHERE id=?;`,
      [updated.amount, updated.currency, updated.type, updated.categoryId, updated.note, updated.date, updated.receiptUri, updated.receiptOcrData, updated.subscriptionId, updated.updatedAt, id]
    );
    set((state) => ({
      transactions: state.transactions.map((t) => (t.id === id ? updated : t)),
    }));
  },

  deleteTransaction: (id) => {
    const db = getDB();
    db.executeSync(`DELETE FROM transactions WHERE id = ?;`, [id]);
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));
  },

  getByDateRange: (start, end) =>
    get().transactions.filter((t) => t.date >= start && t.date <= end),

  getByCategory: (categoryId) =>
    get().transactions.filter((t) => t.categoryId === categoryId),

  getByType: (type) => get().transactions.filter((t) => t.type === type),

  getRecentN: (n) => get().transactions.slice(0, n),

  getTotalByType: (type) =>
    get()
      .transactions.filter((t) => t.type === type)
      .reduce((sum, t) => sum + t.amount, 0),

  dailySpendForMonth: (date) => {
    const ref = dayjs(date);
    const daysInMonth = ref.daysInMonth();
    const out = new Array<number>(daysInMonth).fill(0);
    const startIso = ref.startOf('month').toISOString();
    const endIso = ref.endOf('month').toISOString();
    for (const t of get().transactions) {
      if (t.type !== 'expense') continue;
      if (t.date < startIso || t.date > endIso) continue;
      const idx = dayjs(t.date).date() - 1;
      if (idx >= 0 && idx < daysInMonth) out[idx] += t.amount;
    }
    return out;
  },
}));
