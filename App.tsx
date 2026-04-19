import './global.css';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import {
  NavigationContainer,
  DarkTheme as NavDarkTheme,
  DefaultTheme as NavDefaultTheme,
} from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import RNBootSplash from 'react-native-bootsplash';

import { ThemeProvider, useTheme } from './src/theme';
import { runMigrations, logCategoryCount } from './src/db/migrations';
import { useAuthStore } from './src/stores/useAuthStore';
import { RootNavigator } from './src/navigation/RootNavigator';
import { navigationRef } from './src/navigation/ref';
import { useTransactionStore } from './src/stores/useTransactionStore';
import { useSubscriptionStore } from './src/stores/useSubscriptionStore';
import { useBudgetStore } from './src/stores/useBudgetStore';
import { useSettingsStore } from './src/stores/useSettingsStore';
import { useSheetStore } from './src/stores/useSheetStore';
import {
  AddTransactionSheet,
  type AddTransactionSheetHandle,
} from './src/screens/AddTransactionSheet';
import {
  AddSubscriptionSheet,
  type AddSubscriptionSheetHandle,
} from './src/screens/AddSubscriptionSheet';
import {
  SubscriptionLimitSheet,
  type SubscriptionLimitSheetHandle,
} from './src/components/subscriptions/SubscriptionLimitSheet';
import {
  ReceiptLimitSheet,
  type ReceiptLimitSheetHandle,
} from './src/components/scanner/ReceiptLimitSheet';
import { rescheduleAll } from './src/services/notifications';
import { pruneExpiredThresholdKeys } from './src/services/budgetAlerts';
import { BiometricLockGate } from './src/components/BiometricLockGate';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import './src/i18n';

function GlobalSheets() {
  const txSheetRef = useRef<AddTransactionSheetHandle>(null);
  const subSheetRef = useRef<AddSubscriptionSheetHandle>(null);
  const subLimitSheetRef = useRef<SubscriptionLimitSheetHandle>(null);
  const receiptLimitSheetRef = useRef<ReceiptLimitSheetHandle>(null);

  const registerAddTransaction = useSheetStore((s) => s.registerAddTransaction);
  const registerAddIncome = useSheetStore((s) => s.registerAddIncome);
  const registerEditTransaction = useSheetStore((s) => s.registerEditTransaction);
  const registerAddSubscription = useSheetStore((s) => s.registerAddSubscription);
  const registerEditSubscription = useSheetStore((s) => s.registerEditSubscription);
  const registerScanReceipt = useSheetStore((s) => s.registerScanReceipt);

  useEffect(() => {
    registerAddTransaction(() => txSheetRef.current?.present({ initialType: 'expense' }));
    registerAddIncome(() => txSheetRef.current?.present({ initialType: 'income' }));
    registerEditTransaction((tx) => txSheetRef.current?.present({ transaction: tx }));

    registerAddSubscription(() => {
      if (!useSubscriptionStore.getState().canAddActive()) {
        subLimitSheetRef.current?.present();
        return;
      }
      subSheetRef.current?.present();
    });
    registerEditSubscription((sub) => subSheetRef.current?.present({ subscription: sub }));

    registerScanReceipt(() => {
      // Keep the usage counter honest on calendar rollover, then gate the nav
      // push — if the user is already over quota, show the limit sheet
      // instead of presenting the camera.
      useSettingsStore.getState().rolloverReceiptScansIfNewMonth();
      if (!useSettingsStore.getState().canScanReceipt()) {
        receiptLimitSheetRef.current?.present();
        return;
      }
      navigationRef.current?.navigate('Scanner', { screen: 'ReceiptScanner' });
    });
  }, [
    registerAddTransaction,
    registerAddIncome,
    registerEditTransaction,
    registerAddSubscription,
    registerEditSubscription,
    registerScanReceipt,
  ]);

  return (
    <>
      <AddTransactionSheet ref={txSheetRef} />
      <AddSubscriptionSheet ref={subSheetRef} />
      <SubscriptionLimitSheet ref={subLimitSheetRef} />
      <ReceiptLimitSheet ref={receiptLimitSheetRef} />
    </>
  );
}

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    try {
      runMigrations();
      logCategoryCount();
      useTransactionStore.getState().loadTransactions();
      useSubscriptionStore.getState().loadAll();
      useBudgetStore.getState().loadAll();

      // Monthly rollover must happen before any scanner interaction today so
      // users starting a new month see their fresh 3/20 scan budget.
      useSettingsStore.getState().rolloverReceiptScansIfNewMonth();

      // Drop budget-alert flags from prior periods so thresholds can re-fire
      // in the new cycle. Keyed by YYYY-MM so this is a no-op mid-month.
      pruneExpiredThresholdKeys();

      useSubscriptionStore.getState().advancePastRenewals();
      const language = useSettingsStore.getState().language;
      const subs = useSubscriptionStore.getState().subscriptions;
      rescheduleAll(subs, language).catch((e) => {
        console.warn('[notifications] reschedule on launch failed', e);
      });

      useAuthStore.getState().hydrate();

      setDbReady(true);
    } catch (e) {
      console.error('[db] migration failed', e);
      setDbReady(true);
    }
  }, []);

  useEffect(() => {
    if (dbReady) {
      RNBootSplash.hide({ fade: true }).catch(() => {
        // bootsplash asset not generated yet — safe to ignore
      });
    }
  }, [dbReady]);

  if (!dbReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <BottomSheetModalProvider>
            <ThemedStatusBar />
            <ErrorBoundary>
              <BiometricLockGate>
                <ThemedNavigation />
                <GlobalSheets />
              </BiometricLockGate>
            </ErrorBoundary>
            <Toast />
          </BottomSheetModalProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return (
    <StatusBar
      barStyle={isDark ? 'light-content' : 'dark-content'}
      backgroundColor="transparent"
      translucent
    />
  );
}

// Picks the RN Navigation theme that matches the user's theme preference so
// default screen/card backgrounds don't bleed white in dark mode (the tab
// bar's rounded corners were revealing that white default).
function ThemedNavigation() {
  const { theme, isDark } = useTheme();
  const base = isDark ? NavDarkTheme : NavDefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      background: theme.colors.bg.page,
      card: theme.colors.bg.card,
      border: theme.colors.border.card,
      text: theme.colors.text.primary,
      primary: theme.colors.brand.primary,
    },
  };
  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
