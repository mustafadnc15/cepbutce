import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MainTabNavigator } from './MainTabNavigator';
import { ReceiptScannerScreen } from '../screens/ReceiptScannerScreen';
import { ReceiptReviewScreen } from '../screens/ReceiptReviewScreen';
import { ReceiptResultsScreen } from '../screens/ReceiptResultsScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { useSettingsStore } from '../stores/useSettingsStore';
import type { RootStackParamList, ScannerStackParamList } from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const ScannerStack = createNativeStackNavigator<ScannerStackParamList>();

function ScannerNavigator() {
  return (
    <ScannerStack.Navigator screenOptions={{ headerShown: false }}>
      <ScannerStack.Screen name="ReceiptScanner" component={ReceiptScannerScreen} />
      <ScannerStack.Screen name="ReceiptReview" component={ReceiptReviewScreen} />
      <ScannerStack.Screen name="ReceiptResults" component={ReceiptResultsScreen} />
    </ScannerStack.Navigator>
  );
}

export function RootNavigator() {
  const onboardingComplete = useSettingsStore((s) => s.onboardingComplete);
  // Local override so "Done" on the last page transitions out immediately
  // rather than waiting for the MMKV-persisted state to roundtrip.
  const [dismissed, setDismissed] = useState(false);

  const showOnboarding = !onboardingComplete && !dismissed;

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {showOnboarding ? (
        <RootStack.Screen name="Onboarding">
          {() => <OnboardingScreen onDone={() => setDismissed(true)} />}
        </RootStack.Screen>
      ) : (
        <>
          <RootStack.Screen name="Main" component={MainTabNavigator} />
          <RootStack.Screen
            name="Scanner"
            component={ScannerNavigator}
            options={{
              presentation: 'fullScreenModal',
              animation: 'slide_from_bottom',
            }}
          />
        </>
      )}
    </RootStack.Navigator>
  );
}
