import { create } from 'zustand';
import dayjs from 'dayjs';
import { Subscription, BillingCycle } from '../types';
import { getDB } from '../db/connection';
import { generateId } from '../utils/id';

interface SubscriptionState {
  subscriptions: Subscription[];
  loading: boolean;
  error: string | null;

  loadAll: () => void;
  add: (sub: Omit<Subscription, 'id' | 'createdAt'>) => Subscription;
  update: (id: string, patch: Partial<Subscription>) => void;
  delete: (id: string) => void;
  toggleActive: (id: string) => void;

  totalMonthly: () => number;
  totalYearly: () => number;
  upcomingRenewals: (days: number) => Subscription[];
}

function cycleToMonthly(amount: number, cycle: BillingCycle): number {
  switch (cycle) {
    case 'weekly': return (amount * 52) / 12;
    case 'monthly': return amount;
    case 'quarterly': return amount / 3;
    case 'yearly': return amount / 12;
  }
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscriptions: [],
  loading: false,
  error: null,

  loadAll: () => {
    set({ loading: true, error: null });
    try {
      const db = getDB();
      const result = db.executeSync(`SELECT * FROM subscriptions ORDER BY nextRenewalDate ASC;`);
      const rows = (result.rows ?? []).map((r) => ({
        ...r,
        isActive: Boolean(r.isActive),
      })) as Subscription[];
      set({ subscriptions: rows, loading: false });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : String(e) });
    }
  },

  add: (input) => {
    const sub: Subscription = {
      ...input,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    const db = getDB();
    db.executeSync(
      `INSERT INTO subscriptions (id, name, amount, currency, billingCycle, categoryId, startDate, nextRenewalDate, icon, color, note, isActive, remindBefore, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [sub.id, sub.name, sub.amount, sub.currency, sub.billingCycle, sub.categoryId, sub.startDate, sub.nextRenewalDate, sub.icon, sub.color, sub.note, sub.isActive ? 1 : 0, sub.remindBefore, sub.createdAt]
    );
    set((state) => ({ subscriptions: [...state.subscriptions, sub] }));
    return sub;
  },

  update: (id, patch) => {
    const existing = get().subscriptions.find((s) => s.id === id);
    if (!existing) return;
    const updated = { ...existing, ...patch };
    const db = getDB();
    db.executeSync(
      `UPDATE subscriptions SET name=?, amount=?, currency=?, billingCycle=?, categoryId=?, startDate=?, nextRenewalDate=?, icon=?, color=?, note=?, isActive=?, remindBefore=? WHERE id=?;`,
      [updated.name, updated.amount, updated.currency, updated.billingCycle, updated.categoryId, updated.startDate, updated.nextRenewalDate, updated.icon, updated.color, updated.note, updated.isActive ? 1 : 0, updated.remindBefore, id]
    );
    set((state) => ({
      subscriptions: state.subscriptions.map((s) => (s.id === id ? updated : s)),
    }));
  },

  delete: (id) => {
    const db = getDB();
    db.executeSync(`DELETE FROM subscriptions WHERE id = ?;`, [id]);
    set((state) => ({
      subscriptions: state.subscriptions.filter((s) => s.id !== id),
    }));
  },

  toggleActive: (id) => {
    const existing = get().subscriptions.find((s) => s.id === id);
    if (!existing) return;
    get().update(id, { isActive: !existing.isActive });
  },

  totalMonthly: () =>
    get()
      .subscriptions.filter((s) => s.isActive)
      .reduce((sum, s) => sum + cycleToMonthly(s.amount, s.billingCycle), 0),

  totalYearly: () => get().totalMonthly() * 12,

  upcomingRenewals: (days) => {
    const cutoff = dayjs().add(days, 'day').toISOString();
    return get()
      .subscriptions.filter((s) => s.isActive && s.nextRenewalDate <= cutoff)
      .sort((a, b) => a.nextRenewalDate.localeCompare(b.nextRenewalDate));
  },
}));
