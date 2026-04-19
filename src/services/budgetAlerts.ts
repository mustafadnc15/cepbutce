import { Platform } from 'react-native';
import dayjs from 'dayjs';

import { storage } from '../stores/mmkv';
import { useBudgetStore } from '../stores/useBudgetStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { DEFAULT_CATEGORIES } from '../constants/categories';
import { formatCurrency } from '../utils/currency';

type SupportedCurrency = 'TRY' | 'USD' | 'EUR' | 'GBP';

let notifee: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  notifee = require('@notifee/react-native').default;
} catch {
  // Silent — notifee is already warned about in notifications.ts.
}

const CHANNEL_ID = 'budget-alerts';
const CHANNEL_NAME = 'Bütçe Uyarıları';

const THRESHOLDS = [0.5, 0.8, 1.0] as const;
type Threshold = (typeof THRESHOLDS)[number];

// Period key rolls over on the 1st of the calendar month, which is sufficient
// for the free-tier baseline. When the configurable resetDay diverges from 1
// a fuller solution would key off the rolling budget cycle; see notes below
// in `maybeResetThresholdKeys` for that hook.
function currentPeriodKey(): string {
  const resetDay = useSettingsStore.getState().budgetResetDay ?? 1;
  // If reset day is 1, the period equals the calendar month.
  // If it's e.g. 15, a period is (15 of month N) .. (14 of month N+1). We
  // compute the "period anchor month" by looking at whether today has
  // crossed the reset day yet.
  const now = dayjs();
  if (resetDay === 1) {
    return now.format('YYYY-MM');
  }
  const anchor = now.date() >= resetDay ? now : now.subtract(1, 'month');
  return anchor.format('YYYY-MM');
}

function firedKey(budgetKey: string, threshold: Threshold): string {
  return `budget-alert-fired:${budgetKey}:${currentPeriodKey()}:${threshold}`;
}

function hasFired(budgetKey: string, threshold: Threshold): boolean {
  return storage.getBoolean(firedKey(budgetKey, threshold)) === true;
}

function markFired(budgetKey: string, threshold: Threshold): void {
  storage.set(firedKey(budgetKey, threshold), true);
}

async function ensureChannel(): Promise<void> {
  if (!notifee) return;
  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: CHANNEL_ID,
      name: CHANNEL_NAME,
      importance: 4, // HIGH
    });
  }
}

async function fireNotification(title: string, body: string): Promise<void> {
  if (!notifee) return;
  try {
    await ensureChannel();
    await notifee.displayNotification({
      title,
      body,
      android: {
        channelId: CHANNEL_ID,
        smallIcon: 'ic_launcher',
        color: '#FF3B30',
        pressAction: { id: 'default' },
      },
      ios: { sound: 'default' },
    });
  } catch (e) {
    console.warn('[budgetAlerts] fire failed', e);
  }
}

function overallTitleForThreshold(threshold: Threshold): string {
  if (threshold === 0.5) return '📊 Bütçenizin yarısını harcadınız';
  if (threshold === 0.8) return "⚠️ Bütçe uyarısı — %80'ini harcadınız!";
  return '🚨 Bütçeyi aştınız!';
}

function overallBodyForThreshold(
  threshold: Threshold,
  spent: number,
  budget: number,
  currency: SupportedCurrency,
  language: 'tr' | 'en'
): string {
  if (threshold === 1.0) {
    const over = Math.max(0, spent - budget);
    return `Bu ay ${formatCurrency(over, currency, language)} fazla harcadınız`;
  }
  const remaining = Math.max(0, budget - spent);
  return `Bu ay ${formatCurrency(spent, currency, language)} harcadınız, ${formatCurrency(
    remaining,
    currency,
    language
  )} kaldı`;
}

function categoryTitleForThreshold(categoryName: string, threshold: Threshold): string {
  if (threshold === 0.5) return `📊 ${categoryName} bütçesinin yarısındasınız`;
  if (threshold === 0.8) return `⚠️ ${categoryName} bütçesi — %80`;
  return `🚨 ${categoryName} bütçesi aşıldı`;
}

function categoryBodyForThreshold(
  threshold: Threshold,
  spent: number,
  budget: number,
  currency: SupportedCurrency,
  language: 'tr' | 'en'
): string {
  if (threshold === 1.0) {
    const over = Math.max(0, spent - budget);
    return `${formatCurrency(spent, currency, language)} harcandı, ${formatCurrency(
      over,
      currency,
      language
    )} üstüne çıktınız`;
  }
  const remaining = Math.max(0, budget - spent);
  return `${formatCurrency(spent, currency, language)} / ${formatCurrency(
    budget,
    currency,
    language
  )} · ${formatCurrency(remaining, currency, language)} kaldı`;
}

// Fire any threshold notifications the user has just crossed. Invoked from
// AddTransactionSheet's save handler so the notification lands immediately
// after the transaction that pushed spending over the line.
//
// Re-entry safety: idempotent per (budget, period, threshold) via MMKV keys.
export async function checkBudgetThresholds(): Promise<void> {
  if (!notifee) return;

  const budgetState = useBudgetStore.getState();
  const settings = useSettingsStore.getState();
  if (!settings.notificationsEnabled) return;

  const language = settings.language;
  const currency = settings.currency as SupportedCurrency;

  // Overall
  const overall = budgetState.overallBudget();
  if (overall && overall.amount > 0) {
    const spent = budgetState.spentThisMonth();
    const pct = spent / overall.amount;
    for (const t of THRESHOLDS) {
      if (pct >= t && !hasFired('overall', t)) {
        await fireNotification(
          overallTitleForThreshold(t),
          overallBodyForThreshold(t, spent, overall.amount, currency, language)
        );
        markFired('overall', t);
      }
    }
  }

  // Per-category
  const categoryBudgets = budgetState.categoryBudgets();
  for (const b of categoryBudgets) {
    if (!b.categoryId || b.amount <= 0) continue;
    const cat = DEFAULT_CATEGORIES.find((c) => c.id === b.categoryId);
    if (!cat) continue;

    const spent = budgetState.spentByCategory(b.categoryId);
    const pct = spent / b.amount;
    const key = `cat-${b.categoryId}`;

    for (const t of THRESHOLDS) {
      if (pct >= t && !hasFired(key, t)) {
        await fireNotification(
          categoryTitleForThreshold(cat.name, t),
          categoryBodyForThreshold(t, spent, b.amount, currency, language)
        );
        markFired(key, t);
      }
    }
  }
}

// Clears MMKV keys for the previous period so the same budget can re-fire
// in the new period. Called from the existing launch-time rollover check
// in App.tsx. Relies on `budget-alert-fired:` prefix.
export function pruneExpiredThresholdKeys(): void {
  const currentPrefix = `budget-alert-fired:`;
  const currentPeriod = currentPeriodKey();
  const allKeys = storage.getAllKeys();
  for (const key of allKeys) {
    if (!key.startsWith(currentPrefix)) continue;
    // Key shape: budget-alert-fired:{budgetKey}:{period}:{threshold}
    const parts = key.split(':');
    if (parts.length < 4) continue;
    const period = parts[2];
    if (period !== currentPeriod) {
      storage.remove(key);
    }
  }
}
