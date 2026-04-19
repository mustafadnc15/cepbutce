import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import dayjs from 'dayjs';
import i18n from '../i18n';
import { mmkvStorage } from './mmkv';

export type Language = 'tr' | 'en';
export type ThemePreference = 'light' | 'dark' | 'system';

export const FREE_RECEIPT_SCANS_PER_MONTH = 3;
export const PREMIUM_RECEIPT_SCANS_PER_MONTH = 20;

interface SettingsState {
  currency: string;
  language: Language;
  theme: ThemePreference;
  budgetResetDay: number;
  notificationsEnabled: boolean;
  isPremium: boolean;
  premiumExpiresAt: string | null;
  biometricLock: boolean;
  onboardingComplete: boolean;
  receiptScansThisMonth: number;
  receiptScansResetDate: string | null;

  setCurrency: (c: string) => void;
  setLanguage: (l: Language) => void;
  setTheme: (t: ThemePreference) => void;
  setBudgetResetDay: (d: number) => void;
  setNotificationsEnabled: (b: boolean) => void;
  setPremium: (isPremium: boolean, expiresAt: string | null) => void;
  setBiometricLock: (b: boolean) => void;
  completeOnboarding: () => void;
  incrementReceiptScans: () => void;
  resetReceiptScans: () => void;

  // Returns true if the counter was reset (i.e., month rolled over).
  rolloverReceiptScansIfNewMonth: () => boolean;
  receiptScansMonthlyLimit: () => number;
  receiptScansRemaining: () => number;
  canScanReceipt: () => boolean;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      currency: 'TRY',
      language: 'tr',
      theme: 'system',
      budgetResetDay: 1,
      notificationsEnabled: true,
      isPremium: false,
      premiumExpiresAt: null,
      biometricLock: false,
      onboardingComplete: false,
      receiptScansThisMonth: 0,
      receiptScansResetDate: null,

      setCurrency: (currency) => set({ currency }),
      setLanguage: (language) => {
        set({ language });
        // Side-effect: keep i18next and MMKV in sync so new renders pick up
        // the new locale immediately.
        if (i18n.language !== language) {
          void i18n.changeLanguage(language);
        }
      },
      setTheme: (theme) => set({ theme }),
      setBudgetResetDay: (budgetResetDay) => set({ budgetResetDay }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setPremium: (isPremium, premiumExpiresAt) => set({ isPremium, premiumExpiresAt }),
      setBiometricLock: (biometricLock) => set({ biometricLock }),
      completeOnboarding: () => set({ onboardingComplete: true }),
      incrementReceiptScans: () =>
        set((state) => ({ receiptScansThisMonth: state.receiptScansThisMonth + 1 })),
      resetReceiptScans: () =>
        set({ receiptScansThisMonth: 0, receiptScansResetDate: new Date().toISOString() }),

      // Called from App.tsx on launch and before every scan. Resets the
      // counter the first time the calendar rolls into a new month.
      rolloverReceiptScansIfNewMonth: () => {
        const { receiptScansResetDate } = get();
        const now = dayjs();
        if (!receiptScansResetDate) {
          set({ receiptScansResetDate: now.toISOString() });
          return false;
        }
        const last = dayjs(receiptScansResetDate);
        const sameMonth = last.isSame(now, 'month') && last.isSame(now, 'year');
        if (sameMonth) return false;
        set({ receiptScansThisMonth: 0, receiptScansResetDate: now.toISOString() });
        return true;
      },

      receiptScansMonthlyLimit: () =>
        get().isPremium ? PREMIUM_RECEIPT_SCANS_PER_MONTH : FREE_RECEIPT_SCANS_PER_MONTH,

      receiptScansRemaining: () => {
        const used = get().receiptScansThisMonth;
        const limit = get().receiptScansMonthlyLimit();
        return Math.max(0, limit - used);
      },

      canScanReceipt: () => get().receiptScansRemaining() > 0,
    }),
    {
      name: 'settings',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
