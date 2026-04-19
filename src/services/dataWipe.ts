// Full reset: nukes the SQLite content, clears MMKV, then re-runs migrations
// so the app is in a first-launch-like state. Language + theme are preserved
// so the user isn't thrown into a different locale mid-confirmation.

import { getDB } from '../db/connection';
import { runMigrations } from '../db/migrations';
import { storage as settingsStorage } from '../stores/mmkv';
import { clearAuthStorage } from './auth';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';
import { useBudgetStore } from '../stores/useBudgetStore';
import { useSettingsStore, type Language, type ThemePreference } from '../stores/useSettingsStore';
import { useAuthStore } from '../stores/useAuthStore';

function dropAllTables(): void {
  const db = getDB();
  const tables = ['transactions', 'subscriptions', 'budgets', 'categories', 'settings'];
  for (const t of tables) {
    db.executeSync(`DROP TABLE IF EXISTS ${t};`);
  }
}

export function wipeAll(): void {
  // Snapshot the UX-sensitive prefs so the post-wipe app doesn't jarringly
  // flip language or theme.
  const prevLanguage: Language = useSettingsStore.getState().language;
  const prevTheme: ThemePreference = useSettingsStore.getState().theme;

  dropAllTables();
  runMigrations();

  // Clear persisted zustand settings (MMKV 'settings' key), then restore
  // the language/theme preference on top of the defaults.
  settingsStorage.clearAll();
  clearAuthStorage();

  useSettingsStore.setState({
    currency: 'TRY',
    language: prevLanguage,
    theme: prevTheme,
    budgetResetDay: 1,
    notificationsEnabled: true,
    isPremium: false,
    premiumExpiresAt: null,
    biometricLock: false,
    onboardingComplete: false,
    receiptScansThisMonth: 0,
    receiptScansResetDate: null,
  });

  // Re-read the fresh DB.
  useTransactionStore.getState().loadTransactions();
  useSubscriptionStore.getState().loadAll();
  useBudgetStore.getState().loadAll();
  useAuthStore.getState().hydrate();
}
