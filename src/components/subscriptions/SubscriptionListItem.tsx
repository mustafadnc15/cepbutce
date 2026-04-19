import React, { memo, useCallback, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, SharedValue } from 'react-native-reanimated';
import ReanimatedSwipeable, {
  SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Icon from '@react-native-vector-icons/feather';
import HapticFeedback from 'react-native-haptic-feedback';
import dayjs from 'dayjs';

import { useTheme } from '../../theme';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { formatCurrency } from '../../utils/currency';
import type { BillingCycle, Subscription } from '../../types';

const ROW_HEIGHT = 72;
const ACTION_WIDTH = 80;

type SupportedCurrency = 'TRY' | 'USD' | 'EUR' | 'GBP';

const CYCLE_LABELS: Record<'tr' | 'en', Record<BillingCycle, string>> = {
  tr: { weekly: 'Haftalık', monthly: 'Aylık', quarterly: '3 Aylık', yearly: 'Yıllık' },
  en: { weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly' },
};

interface SubscriptionListItemProps {
  subscription: Subscription;
  onPress: (sub: Subscription) => void;
  onOptions: (sub: Subscription) => void;
}

function SubscriptionListItemImpl({
  subscription,
  onPress,
  onOptions,
}: SubscriptionListItemProps) {
  const { theme } = useTheme();
  const language = useSettingsStore((s) => s.language);
  const currency = useSettingsStore((s) => s.currency) as SupportedCurrency;
  const swipeRef = useRef<SwipeableMethods>(null);

  const initial = (subscription.name.trim()[0] ?? '?').toLocaleUpperCase('tr-TR');
  const amountStr = formatCurrency(subscription.amount, currency, language);
  const cycleLabel = CYCLE_LABELS[language][subscription.billingCycle];
  const subtitle = `${cycleLabel} · ${amountStr}`;
  const renewal = dayjs(subscription.nextRenewalDate).locale(language).format('D MMM');

  const openOptions = useCallback(() => {
    HapticFeedback.trigger('impactMedium');
    swipeRef.current?.close();
    onOptions(subscription);
  }, [onOptions, subscription]);

  const renderRightActions = useCallback(
    (progress: SharedValue<number>) => (
      <OptionsAction
        progress={progress}
        onPress={openOptions}
        color={theme.colors.brand.primary}
      />
    ),
    [openOptions, theme.colors.brand.primary]
  );

  const handleSwipeableWillOpen = useCallback(() => {
    openOptions();
  }, [openOptions]);

  const handlePress = useCallback(() => {
    HapticFeedback.trigger('impactLight');
    onPress(subscription);
  }, [onPress, subscription]);

  return (
    <ReanimatedSwipeable
      ref={swipeRef}
      friction={2}
      rightThreshold={ACTION_WIDTH * 0.6}
      renderRightActions={renderRightActions}
      onSwipeableWillOpen={handleSwipeableWillOpen}
      overshootRight={false}
      containerStyle={{ backgroundColor: theme.colors.bg.page }}>
      <Pressable
        onPress={handlePress}
        style={[
          styles.row,
          {
            backgroundColor: theme.colors.bg.card,
            borderColor: theme.colors.border.card,
            opacity: subscription.isActive ? 1 : 0.55,
          },
        ]}>
        <View style={[styles.circle, { backgroundColor: subscription.color }]}>
          <Text style={styles.initial}>{initial}</Text>
        </View>
        <View style={styles.middle}>
          <Text
            style={[styles.title, { color: theme.colors.text.primary }]}
            numberOfLines={1}>
            {subscription.name}
          </Text>
          <Text
            style={[styles.subtitle, { color: theme.colors.text.secondary }]}
            numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        <Text style={[styles.renewal, { color: theme.colors.text.secondary }]} numberOfLines={1}>
          {renewal}
        </Text>
      </Pressable>
    </ReanimatedSwipeable>
  );
}

interface OptionsActionProps {
  progress: SharedValue<number>;
  color: string;
  onPress: () => void;
}

function OptionsAction({ progress, color, onPress }: OptionsActionProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: Math.min(1, progress.value) }],
    opacity: Math.min(1, progress.value),
  }));

  return (
    <View style={[styles.actionWrap, { backgroundColor: color }]}>
      <Pressable onPress={onPress} style={styles.actionPress}>
        <Animated.View style={animatedStyle}>
          <Icon name="more-horizontal" size={22} color="#FFFFFF" />
        </Animated.View>
      </Pressable>
    </View>
  );
}

export const SubscriptionListItem = memo(SubscriptionListItemImpl);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: ROW_HEIGHT,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  middle: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '400',
  },
  renewal: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionWrap: {
    width: ACTION_WIDTH,
    borderRadius: 14,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPress: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
