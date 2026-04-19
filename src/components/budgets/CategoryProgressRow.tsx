import React, { memo, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../../theme';
import { IconBox } from '../ui';
import { formatCurrency } from '../../utils/currency';
import type { Category } from '../../types';

type SupportedCurrency = 'TRY' | 'USD' | 'EUR' | 'GBP';

interface CategoryProgressRowProps {
  category: Category;
  spent: number;
  budget: number | null;
  currency: SupportedCurrency;
  language: 'tr' | 'en';
}

function CategoryProgressRowImpl({
  category,
  spent,
  budget,
  currency,
  language,
}: CategoryProgressRowProps) {
  const { theme } = useTheme();

  const hasBudget = budget !== null && budget > 0;
  const percent = hasBudget ? spent / (budget as number) : 0;
  const clamped = Math.max(0, Math.min(1, percent));

  const fillColor =
    clamped >= 0.85
      ? theme.colors.semantic.error
      : clamped >= 0.6
      ? theme.colors.semantic.warning
      : theme.colors.brand.primary;

  const pct = useSharedValue(0);
  useEffect(() => {
    pct.value = withTiming(clamped, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [clamped, pct]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${pct.value * 100}%`,
  }));

  const spentStr = formatCurrency(spent, currency, language);
  const budgetStr = hasBudget ? formatCurrency(budget as number, currency, language) : null;

  const trackColor = theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: theme.colors.bg.card,
          borderColor: theme.colors.border.card,
        },
      ]}>
      <View style={styles.header}>
        <IconBox
          iconName={category.icon}
          iconColor={category.color}
          bgColor={hexWithAlpha(category.color, 0.14)}
          size={36}
          iconSize={18}
        />
        <Text
          numberOfLines={1}
          style={[styles.name, { color: theme.colors.text.primary }]}>
          {category.name}
        </Text>
        <Text
          numberOfLines={1}
          style={[styles.amounts, { color: theme.colors.text.secondary }]}>
          {budgetStr ? `${spentStr} / ${budgetStr}` : spentStr}
        </Text>
      </View>
      {hasBudget ? (
        <View style={[styles.track, { backgroundColor: trackColor }]}>
          <Animated.View
            style={[styles.fill, { backgroundColor: fillColor }, animatedStyle]}
          />
        </View>
      ) : (
        <Text
          style={{
            ...theme.typography.caption,
            color: theme.colors.text.secondary,
            marginTop: 6,
            marginLeft: 48,
          }}>
          Bütçe tanımlı değil
        </Text>
      )}
    </View>
  );
}

function hexWithAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const CategoryProgressRow = memo(CategoryProgressRowImpl);

const styles = StyleSheet.create({
  row: {
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  amounts: {
    fontSize: 12,
    fontWeight: '500',
  },
  track: {
    height: 6,
    borderRadius: 9999,
    overflow: 'hidden',
    marginTop: 10,
    marginLeft: 48,
  },
  fill: {
    height: '100%',
    borderRadius: 9999,
  },
});
