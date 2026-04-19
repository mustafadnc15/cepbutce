import { create } from 'zustand';
import dayjs from 'dayjs';
import { Subscription, BillingCycle } from '../types';
import { getDB } from '../db/connection';
import { generateId } from '../utils/id';
import { useSettingsStore } from './useSettingsStore';
import { useTransactionStore } from './useTransactionStore';

export const FREE_ACTIVE_SUBSCRIPTION_LIMIT = 5;

interface SubscriptionState {
  subscriptions: Subscription[];
  loading: boolean;
  error: string | null;

  loadAll: () => void;
  add: (
    sub: Omit<Subscription, 'id' | 'createdAt' | 'nextRenewalDate'>
  ) => Subscription | null;
  update: (id: string, patch: Partial<Subscription>) => void;
  delete: (id: string) => void;
  toggleActive: (id: string) => boolean;

  activeCount: () => number;
  canAddActive: () => boolean;
  totalMonthly: () => number;
  totalYearly: () => number;
  upcomingRenewals: (days: number) => Subscription[];
  advancePastRenewals: () => Subscription[];
}

// Spec: weekly × 4.33, quarterly / 3, yearly / 12. 4.33 ≈ 52 / 12.
function cycleToMonthly(amount: number, cycle: BillingCycle): number {
  switch (cycle) {
    case 'weekly':
      return amount * 4.33;
    case 'monthly':
      return amount;
    case 'quarterly':
      return amount / 3;
    case 'yearly':
      return amount / 12;
  }
}

function stepOneCycle(d: dayjs.Dayjs, cycle: BillingCycle): dayjs.Dayjs {
  switch (cycle) {
    case 'weekly':
      return d.add(1, 'week');
    case 'monthly':
      return d.add(1, 'month');
    case 'quarterly':
      return d.add(3, 'month');
    case 'yearly':
      return d.add(1, 'year');
  }
}

// Walks the renewal forward one cycle at a time until it lands on today or a
// future date. "Today" is considered a valid renewal day — we only advance
// past strictly-past renewals.
export function advanceRenewalDate(isoDate: string, cycle: BillingCycle): string {
  let d = dayjs(isoDate);
  const now = dayjs();
  while (d.isBefore(now, 'day')) {
    d = stepOneCycle(d, cycle);
  }
  return d.toISOString();
}

// Cap on how many historical renewals we'll auto-materialize when a sub is
// created. Protects against a user setting startDate to 2015 and getting
// flooded with 100+ fake transactions.
export const RENEWAL_BACKFILL_CAP = 12;

interface MaterializedRenewals {
  pastDates: string[]; // dates ≤ today, in chronological order, capped
  nextRenewalDate: string; // first renewal strictly after today
}

// From a startDate, list every renewal date that has already happened (today
// counts as "happened" — if you add Netflix today and the charge fired today,
// it should show in the ledger immediately) and return the next future date.
export function materializeRenewals(
  startIso: string,
  cycle: BillingCycle,
  cap: number = RENEWAL_BACKFILL_CAP
): MaterializedRenewals {
  const through = dayjs();
  const pastDates: string[] = [];
  let d = dayjs(startIso);
  while (!d.isAfter(through, 'day') && pastDates.length < cap) {
    pastDates.push(d.toISOString());
    d = stepOneCycle(d, cycle);
  }
  // If we hit the cap mid-walk, fast-forward d to today's vicinity so the
  // stored nextRenewalDate isn't stuck in the past.
  while (d.isBefore(through, 'day')) {
    d = stepOneCycle(d, cycle);
  }
  return { pastDates, nextRenewalDate: d.toISOString() };
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
        // Column was added in migration v2; pre-existing rows get default 1
        // but handle the undefined case defensively for older test fixtures.
        autoCreateTransactions: r.autoCreateTransactions === undefined
          ? true
          : Boolean(r.autoCreateTransactions),
      })) as Subscription[];
      set({ subscriptions: rows, loading: false });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : String(e) });
    }
  },

  add: (input) => {
    if (input.isActive && !get().canAddActive()) {
      return null;
    }

    // Derive nextRenewalDate from startDate + cycle so callers (form, seed,
    // fixtures) can't get the two out of sync.
    const { pastDates, nextRenewalDate } = materializeRenewals(
      input.startDate,
      input.billingCycle
    );

    const sub: Subscription = {
      ...input,
      id: generateId(),
      createdAt: new Date().toISOString(),
      nextRenewalDate,
    };
    const db = getDB();
    db.executeSync(
      `INSERT INTO subscriptions (id, name, amount, currency, billingCycle, categoryId, startDate, nextRenewalDate, icon, color, note, isActive, remindBefore, autoCreateTransactions, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [sub.id, sub.name, sub.amount, sub.currency, sub.billingCycle, sub.categoryId, sub.startDate, sub.nextRenewalDate, sub.icon, sub.color, sub.note, sub.isActive ? 1 : 0, sub.remindBefore, sub.autoCreateTransactions ? 1 : 0, sub.createdAt]
    );
    set((state) => ({ subscriptions: [...state.subscriptions, sub] }));

    // Backfill historical renewals as transactions so the ledger reflects the
    // sub's real cashflow from day one.
    if (sub.autoCreateTransactions && sub.isActive && pastDates.length > 0) {
      const addTransaction = useTransactionStore.getState().addTransaction;
      for (const dateIso of pastDates) {
        addTransaction({
          amount: sub.amount,
          currency: sub.currency,
          type: 'expense',
          categoryId: sub.categoryId,
          note: sub.name,
          date: dateIso,
          receiptUri: null,
          receiptOcrData: null,
          subscriptionId: sub.id,
        });
      }
    }

    return sub;
  },

  update: (id, patch) => {
    const existing = get().subscriptions.find((s) => s.id === id);
    if (!existing) return;
    const updated = { ...existing, ...patch };
    const db = getDB();
    db.executeSync(
      `UPDATE subscriptions SET name=?, amount=?, currency=?, billingCycle=?, categoryId=?, startDate=?, nextRenewalDate=?, icon=?, color=?, note=?, isActive=?, remindBefore=?, autoCreateTransactions=? WHERE id=?;`,
      [updated.name, updated.amount, updated.currency, updated.billingCycle, updated.categoryId, updated.startDate, updated.nextRenewalDate, updated.icon, updated.color, updated.note, updated.isActive ? 1 : 0, updated.remindBefore, updated.autoCreateTransactions ? 1 : 0, id]
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
    if (!existing) return false;
    // Re-activating past the free limit should be blocked the same way add() is.
    if (!existing.isActive && !get().canAddActive()) return false;
    get().update(id, { isActive: !existing.isActive });
    return true;
  },

  activeCount: () => get().subscriptions.filter((s) => s.isActive).length,

  canAddActive: () => {
    const { isPremium } = useSettingsStore.getState();
    if (isPremium) return true;
    return get().activeCount() < FREE_ACTIVE_SUBSCRIPTION_LIMIT;
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

  // Walk forward every active sub whose nextRenewalDate is in the past. For
  // each date we leave behind, materialize an expense transaction (when
  // autoCreateTransactions is on) so renewals feed into monthly totals and
  // budgets. Returns the subs whose nextRenewalDate changed so callers can
  // reschedule reminders only where needed.
  advancePastRenewals: () => {
    const now = dayjs();
    const changed: Subscription[] = [];
    const addTransaction = useTransactionStore.getState().addTransaction;

    for (const s of get().subscriptions) {
      if (!s.isActive) continue;
      let d = dayjs(s.nextRenewalDate);
      if (!d.isBefore(now, 'day')) continue;

      while (d.isBefore(now, 'day')) {
        if (s.autoCreateTransactions) {
          // Idempotency guard: if a tx already exists for this sub on this
          // exact calendar day, skip. Protects against a double-advance if
          // the app opens, crashes mid-update, then reopens.
          const dayStart = d.startOf('day').toISOString();
          const dayEnd = d.endOf('day').toISOString();
          const existing = useTransactionStore
            .getState()
            .transactions.find(
              (t) =>
                t.subscriptionId === s.id && t.date >= dayStart && t.date <= dayEnd
            );
          if (!existing) {
            addTransaction({
              amount: s.amount,
              currency: s.currency,
              type: 'expense',
              categoryId: s.categoryId,
              note: s.name,
              date: d.toISOString(),
              receiptUri: null,
              receiptOcrData: null,
              subscriptionId: s.id,
            });
          }
        }
        d = stepOneCycle(d, s.billingCycle);
      }

      const nextIso = d.toISOString();
      get().update(s.id, { nextRenewalDate: nextIso });
      changed.push({ ...s, nextRenewalDate: nextIso });
    }
    return changed;
  },
}));
