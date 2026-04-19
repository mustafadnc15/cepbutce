import dayjs from 'dayjs';
import type { BillingCycle, Subscription } from '../types';

// One month is ~4.33 weeks (52 / 12). Used to normalize weekly subs into
// monthly equivalents so the Focus hero can compare them head-to-head.
const WEEKS_PER_MONTH = 4.33;

/** Normalize any billing cycle into its per-month equivalent. */
export function toMonthlyAmount(s: Subscription): number {
  return cycleToMonthlyAmount(s.amount, s.billingCycle);
}

export function cycleToMonthlyAmount(amount: number, cycle: BillingCycle): number {
  switch (cycle) {
    case 'weekly':
      return amount * WEEKS_PER_MONTH;
    case 'monthly':
      return amount;
    case 'quarterly':
      return amount / 3;
    case 'yearly':
      return amount / 12;
  }
}

/** Integer days from start-of-day-today to start-of-day-renewal (can be negative). */
export function daysUntilRenewal(iso: string, now: dayjs.Dayjs = dayjs()): number {
  return dayjs(iso).startOf('day').diff(now.startOf('day'), 'day');
}

/** Human phrase for relative renewal distance: "Bugün", "Yarın", "3 gün sonra". */
export function formatUntil(daysUntil: number, lang: 'tr' | 'en'): string {
  if (daysUntil === 0) return lang === 'tr' ? 'Bugün yenileniyor' : 'Renews today';
  if (daysUntil === 1) return lang === 'tr' ? 'Yarın' : 'Tomorrow';
  if (daysUntil < 0) {
    const abs = Math.abs(daysUntil);
    return lang === 'tr' ? `${abs} gün gecikmiş` : `${abs} days overdue`;
  }
  return lang === 'tr' ? `${daysUntil} gün sonra` : `In ${daysUntil} days`;
}

/** Short badge form used inside the hero next-up pill. */
export function formatUntilShort(daysUntil: number, lang: 'tr' | 'en'): string {
  if (daysUntil === 0) return lang === 'tr' ? 'bugün' : 'today';
  if (daysUntil === 1) return lang === 'tr' ? 'yarın' : 'tom';
  return lang === 'tr' ? `${daysUntil} gün` : `${daysUntil}d`;
}

export interface ProximityGroup {
  key: 'thisWeek' | 'thisMonth' | 'later';
  label: string;
  items: Subscription[];
}

/** Bucket a list of (presumed active) subscriptions into week / month / later. */
export function groupByProximity(
  subs: Subscription[],
  lang: 'tr' | 'en'
): ProximityGroup[] {
  const week: Subscription[] = [];
  const month: Subscription[] = [];
  const later: Subscription[] = [];
  for (const s of subs) {
    const d = daysUntilRenewal(s.nextRenewalDate);
    if (d <= 7) week.push(s);
    else if (d <= 30) month.push(s);
    else later.push(s);
  }
  return [
    {
      key: 'thisWeek',
      label: lang === 'tr' ? 'Bu Hafta' : 'This Week',
      items: week,
    },
    {
      key: 'thisMonth',
      label: lang === 'tr' ? 'Bu Ay' : 'This Month',
      items: month,
    },
    {
      key: 'later',
      label: lang === 'tr' ? 'Sonra' : 'Later',
      items: later,
    },
  ];
}

export function cycleLabel(cycle: BillingCycle, lang: 'tr' | 'en'): string {
  const tr: Record<BillingCycle, string> = {
    weekly: 'Haftalık',
    monthly: 'Aylık',
    quarterly: '3 Aylık',
    yearly: 'Yıllık',
  };
  const en: Record<BillingCycle, string> = {
    weekly: 'Weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
  };
  return (lang === 'tr' ? tr : en)[cycle];
}
