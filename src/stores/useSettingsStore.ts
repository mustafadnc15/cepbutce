import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './mmkv';

export type Language = 'tr' | 'en';
export type ThemePreference = 'light' | 'dark' | 'system';

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
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
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
      setLanguage: (language) => set({ language }),
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
    }),
    {
      name: 'settings',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
