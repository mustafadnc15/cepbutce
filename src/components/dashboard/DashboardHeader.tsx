import React, { useCallback, useEffect, useMemo } from 'react';
import { Pressable, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Icon from '@react-native-vector-icons/feather';
import HapticFeedback from 'react-native-haptic-feedback';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme } from '../../theme';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { formatCurrency, formatCurrencyWorklet } from '../../utils/currency';

// Reanimated's `text` prop animation is supported on TextInput (not Text).
// We render it as a read-only, non-interactive TextInput styled like the headline.
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

function getGreeting(date: Date = new Date()): string {
  const h = date.getHours();
  if (h >= 6 && h < 12) return 'İyi Sabahlar';
  if (h >= 12 && h < 18) return 'İyi Günler';
  if (h >= 18 && h < 22) return 'İyi Akşamlar';
  return 'İyi Geceler';
}

interface DashboardHeaderProps {
  balance: number;
  userName?: string;
  onNotificationsPress?: () => void;
}

export function DashboardHeader({
  balance,
  userName = 'Mustafa',
  onNotificationsPress,
}: DashboardHeaderProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const language = useSettingsStore((s) => s.language);
  const currency = useSettingsStore((s) => s.currency);

  const greeting = useMemo(() => getGreeting(), []);

  // Count-up animation for balance
  const displayed = useSharedValue(0);

  useEffect(() => {
    displayed.value = withTiming(balance, {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    });
  }, [balance, displayed]);

  const animatedProps = useAnimatedProps(() => {
    const value = displayed.value;
    return {
      text: formatCurrencyWorklet(value, currency as any, language),
    } as any;
  });

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content', true);
      return () => {
        StatusBar.setBarStyle(theme.isDark ? 'light-content' : 'dark-content', true);
      };
    }, [theme.isDark])
  );

  const handleBellPress = () => {
    HapticFeedback.trigger('impactLight');
    onNotificationsPress?.();
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.brand.primary,
          paddingTop: insets.top + 12,
        },
      ]}>
      <View style={styles.row}>
        <View style={styles.content}>
          <Text style={styles.greeting} numberOfLines={1}>
            {greeting}, {userName} 👋
          </Text>
          <AnimatedTextInput
            editable={false}
            pointerEvents="none"
            underlineColorAndroid="transparent"
            defaultValue={formatCurrency(0, currency as any, language)}
            style={styles.balance}
            animatedProps={animatedProps}
          />
          <Text style={styles.subtitle}>Toplam Bakiye</Text>
        </View>

        <Pressable
          onPress={handleBellPress}
          style={styles.bell}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Bildirimler">
          <Icon name="bell" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  content: {
    flex: 1,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.8)',
  },
  balance: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 6,
    padding: 0,
    margin: 0,
    // TextInput renders slightly taller than Text on both platforms; trim so
    // the greeting/subtitle spacing matches the spec.
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
