// One hook that gatekeeps every premium feature. Consumers check the boolean
// they care about, then call showPaywall() on a miss instead of re-checking
// the settings store + nav ref themselves.

import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import { useSettingsStore } from '../stores/useSettingsStore';
import {
  useSubscriptionStore,
  FREE_ACTIVE_SUBSCRIPTION_LIMIT,
} from '../stores/useSubscriptionStore';
import {
  PREMIUM_RECEIPT_SCANS_PER_MONTH,
  FREE_RECEIPT_SCANS_PER_MONTH,
} from '../stores/useSettingsStore';

export interface UsePremiumReturn {
  isPremium: boolean;
  canScanReceipt: boolean;
  remainingScans: number;
  monthlyScansLimit: number;
  canAddSubscription: boolean;
  activeSubscriptionCount: number;
  maxSubscriptions: number;
  canUsePdfExport: boolean;
  canUseCustomCategories: boolean;
  canUsePerCategoryBudgets: boolean;
  canUseCloudSync: boolean;
  canUseAdvancedCharts: boolean;
  showPaywall: () => void;
}

export function usePremium(): UsePremiumReturn {
  const navigation = useNavigation<NavigationProp<any>>();

  const isPremium = useSettingsStore((s) => s.isPremium);
  const receiptScansThisMonth = useSettingsStore((s) => s.receiptScansThisMonth);

  // Subscribing to the array so the hook re-renders when subs change.
  const subscriptions = useSubscriptionStore((s) => s.subscriptions);
  const activeSubscriptionCount = subscriptions.filter((s) => s.isActive).length;

  const monthlyScansLimit = isPremium
    ? PREMIUM_RECEIPT_SCANS_PER_MONTH
    : FREE_RECEIPT_SCANS_PER_MONTH;

  const remainingScans = Math.max(
    0,
    monthlyScansLimit - receiptScansThisMonth
  );

  const maxSubscriptions = isPremium
    ? Number.POSITIVE_INFINITY
    : FREE_ACTIVE_SUBSCRIPTION_LIMIT;

  const showPaywall = useCallback(() => {
    // The paywall lives under the Profile tab's stack. We jump to the
    // Profile tab first so going back lands the user on a sensible screen
    // regardless of where they triggered the gate from.
    (navigation as any).navigate?.('Main', {
      screen: 'Profile',
      params: { screen: 'Premium' },
    });
  }, [navigation]);

  return {
    isPremium,
    canScanReceipt: remainingScans > 0,
    remainingScans,
    monthlyScansLimit,
    canAddSubscription: isPremium || activeSubscriptionCount < FREE_ACTIVE_SUBSCRIPTION_LIMIT,
    activeSubscriptionCount,
    maxSubscriptions,
    canUsePdfExport: isPremium,
    canUseCustomCategories: isPremium,
    canUsePerCategoryBudgets: isPremium,
    canUseCloudSync: isPremium,
    canUseAdvancedCharts: isPremium,
    showPaywall,
  };
}
