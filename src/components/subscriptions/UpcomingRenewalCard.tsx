import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import dayjs from 'dayjs';

import { useTheme } from '../../theme';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { formatCurrency } from '../../utils/currency';
import type { Subscription } from '../../types';

type SupportedCurrency = 'TRY' | 'USD' | 'EUR' | 'GBP';

interface UpcomingRenewalCardProps {
  subscription: Subscription;
  onPress: (sub: Subscription) => void;
}

export function UpcomingRenewalCard({ subscription, onPress }: UpcomingRenewalCardProps) {
  const { theme } = useTheme();
  const language = useSettingsStore((s) => s.language);
  const currency = useSettingsStore((s) => s.currency) as SupportedCurrency;

  const days = dayjs(subscription.nextRenewalDate)
    .startOf('day')
    .diff(dayjs().startOf('day'), 'day');

  const label =
    language === 'tr'
      ? days <= 0
        ? days === 0
          ? 'Bugün'
          : `${Math.abs(days)} gün gecikmiş`
        : `${days} gün sonra`
      : days <= 0
      ? days === 0
        ? 'Today'
        : `${Math.abs(days)} days overdue`
      : `in ${days} days`;

  const dayColor =
    days <= 0
      ? theme.colors.semantic.error
      : days <= 3
      ? theme.colors.semantic.warning
      : theme.colors.text.secondary;

  const initial = (subscription.name.trim()[0] ?? '?').toLocaleUpperCase('tr-TR');
  const amountStr = formatCurrency(subscription.amount, currency, language);

  return (
    <Pressable onPress={() => onPress(subscription)}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.bg.card,
            borderColor: theme.colors.border.card,
            ...theme.shadows.card,
          },
        ]}>
        <View style={[styles.circle, { backgroundColor: subscription.color }]}>
          <Text style={styles.initial}>{initial}</Text>
        </View>
        <Text
          style={[styles.name, { color: theme.colors.text.primary }]}
          numberOfLines={1}>
          {subscription.name}
        </Text>
        <Text style={[styles.amount, { color: theme.colors.semantic.expense }]} numberOfLines={1}>
          {amountStr}
        </Text>
        <Text style={[styles.days, { color: dayColor }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 150,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 8,
  },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
  },
  days: {
    fontSize: 11,
    fontWeight: '500',
  },
});
