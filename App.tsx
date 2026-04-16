import './global.css';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { NavigationContainer } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import RNBootSplash from 'react-native-bootsplash';

import { ThemeProvider, useTheme } from './src/theme';
import { runMigrations, logCategoryCount } from './src/db/migrations';
import './src/i18n';

function Shell() {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.shell,
        { backgroundColor: theme.colors.bg.page },
      ]}>
      <Text
        style={{
          ...theme.typography.pageTitle,
          color: theme.colors.text.primary,
        }}>
        CepBütçe
      </Text>
      <Text
        style={{
          ...theme.typography.greeting,
          color: theme.colors.text.secondary,
          marginTop: theme.spacing.sm,
        }}>
        {theme.isDark ? 'Dark mode' : 'Light mode'}
      </Text>
    </View>
  );
}

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    try {
      runMigrations();
      logCategoryCount();
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
            <NavigationContainer>
              <Shell />
            </NavigationContainer>
            <Toast />
          </BottomSheetModalProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  shell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
