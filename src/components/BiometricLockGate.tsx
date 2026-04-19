import React, { useEffect, useRef, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Icon from '@react-native-vector-icons/feather';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../theme';
import { useSettingsStore } from '../stores/useSettingsStore';
import { authenticate, isSensorAvailable } from '../services/biometrics';

// Shows a blur overlay over the app when biometric lock is on and the app has
// just come back from background. Falls open (no block) if the device can't
// authenticate — we never want to strand a user out of their own data.
export function BiometricLockGate({ children }: { children: React.ReactNode }) {
  const biometricLock = useSettingsStore((s) => s.biometricLock);
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();

  const [locked, setLocked] = useState(false);
  const lastStateRef = useRef<AppStateStatus>(AppState.currentState);
  const authInFlightRef = useRef(false);

  // Arm the lock when the app goes to background. We lock *on background* so
  // the screenshot taken by the OS for app-switcher previews already shows
  // the blur overlay.
  useEffect(() => {
    if (!biometricLock) {
      setLocked(false);
      return;
    }
    const sub = AppState.addEventListener('change', (next) => {
      const prev = lastStateRef.current;
      lastStateRef.current = next;
      if (next === 'background' || next === 'inactive') {
        setLocked(true);
        return;
      }
      if (next === 'active' && (prev === 'background' || prev === 'inactive')) {
        // Prompt on foreground; the overlay stays up until success.
        void tryUnlock();
      }
    });
    return () => sub.remove();
    // We intentionally don't include tryUnlock in deps — it uses refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biometricLock]);

  // If the setting flips on while the app is already foregrounded, don't
  // suddenly lock; only future backgroundings should engage.
  useEffect(() => {
    if (!biometricLock) setLocked(false);
  }, [biometricLock]);

  const tryUnlock = async () => {
    if (authInFlightRef.current) return;
    authInFlightRef.current = true;
    try {
      const available = await isSensorAvailable();
      if (!available) {
        // No biometrics on this device — don't hold the user hostage.
        setLocked(false);
        return;
      }
      const result = await authenticate(t('biometric.prompt'));
      if (result.success) {
        setLocked(false);
      }
    } finally {
      authInFlightRef.current = false;
    }
  };

  return (
    <>
      {children}
      {locked ? (
        <View style={StyleSheet.absoluteFill}>
          {Platform.OS === 'ios' ? (
            <BlurView
              style={StyleSheet.absoluteFill}
              blurType={isDark ? 'dark' : 'light'}
              blurAmount={18}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: isDark
                    ? 'rgba(10,10,10,0.88)'
                    : 'rgba(245,245,245,0.92)',
                },
              ]}
            />
          )}
          <View style={styles.centerWrap}>
            <View
              style={[
                styles.lockIconWrap,
                { backgroundColor: theme.colors.brand.primaryTint },
              ]}>
              <Icon name="lock" size={32} color={theme.colors.brand.primary} />
            </View>
            <Text
              style={[
                styles.lockedTitle,
                { color: theme.colors.text.primary },
              ]}>
              {t('biometric.locked')}
            </Text>
            <Text
              style={[
                styles.lockedBody,
                { color: theme.colors.text.secondary },
              ]}>
              {t('biometric.prompt')}
            </Text>
            <Pressable
              onPress={tryUnlock}
              accessibilityRole="button"
              accessibilityLabel={t('biometric.unlock')}
              style={[
                styles.unlockBtn,
                { backgroundColor: theme.colors.brand.primary },
              ]}>
              <Icon name="unlock" size={18} color="#FFFFFF" />
              <Text style={styles.unlockText}>{t('biometric.unlock')}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  centerWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  lockIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  lockedTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  lockedBody: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 8,
  },
  unlockText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
