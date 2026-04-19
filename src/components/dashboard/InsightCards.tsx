import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from '@react-native-vector-icons/feather';
import dayjs from 'dayjs';

import { useTheme } from '../../theme';
import { Card, IconBox } from '../ui';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { DEFAULT_CATEGORIES } from '../../constants/categories';
import { formatCurrency } from '../../utils/currency';

type SupportedCurrency = 'TRY' | 'USD' | 'EUR' | 'GBP';

interface InsightCardsProps {
  onPress?: () => void;
}

function hexWithAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function InsightCards({ onPress }: InsightCardsProps) {
  const { theme } = useTheme();
  const transactions = useTransactionStore((s) => s.transactions);
  const language = useSettingsStore((s) => s.language);
  const currency = useSettingsStore((s) => s.currency) as SupportedCurrency;

  const insights = useMemo(() => {
    const startThis = dayjs().startOf('month');
    const endThis = dayjs().endOf('month');
    const startPrev = startThis.subtract(1, 'month');
    const endPrev = startThis.subtract(1, 'ms'); // end of previous month

    let thisMonthSpent = 0;
    let prevMonthSpent = 0;
    const byCat = new Map<string, number>();

    for (const t of transactions) {
      if (t.type !== 'expense') continue;
      const d = dayjs(t.date);
      if (d.isAfter(startThis.subtract(1, 'ms')) && d.isBefore(endThis.add(1, 'ms'))) {
        thisMonthSpent += t.amount;
        byCat.set(t.categoryId, (byCat.get(t.categoryId) ?? 0) + t.amount);
      } else if (
        d.isAfter(startPrev.subtract(1, 'ms')) &&
        d.isBefore(endPrev.add(1, 'ms'))
      ) {
        prevMonthSpent += t.amount;
      }
    }

    // Top category
    let topCategoryId: string | null = null;
    let topAmount = 0;
    for (const [catId, amount] of byCat.entries()) {
      if (amount > topAmount) {
        topAmount = amount;
        topCategoryId = catId;
      }
    }

    // MoM delta
    let momDelta: number | null = null; // positive = spending more
    if (prevMonthSpent > 0) {
      momDelta = ((thisMonthSpent - prevMonthSpent) / prevMonthSpent) * 100;
    }

    // Daily average (days elapsed this month, cap at today)
    const today = dayjs();
    const daysElapsed = Math.max(1, today.diff(startThis, 'day') + 1);
    const dailyAvg = thisMonthSpent / daysElapsed;

    return {
      topCategoryId,
      topAmount,
      momDelta,
      dailyAvg,
      hasEnoughData: transactions.filter((t) => t.type === 'expense').length >= 5,
    };
  }, [transactions]);

  if (!insights.hasEnoughData) return null;

  const topCategory = insights.topCategoryId
    ? DEFAULT_CATEGORIES.find((c) => c.id === insights.topCategoryId)
    : null;

  const momPositive = insights.momDelta !== null && insights.momDelta > 0;
  const momIconName = momPositive ? 'arrow-up-right' : 'arrow-down-right';
  const momColor = momPositive
    ? theme.colors.semantic.expense
    : theme.colors.semantic.income;
  const momBg = momPositive ? '#FFEAE9' : '#E6F9EE';

  const momText =
    insights.momDelta === null
      ? null
      : momPositive
      ? `Geçen aya göre %${Math.round(insights.momDelta)} daha fazla`
      : `Geçen aya göre %${Math.round(Math.abs(insights.momDelta))} daha az`;

  return (
    <View style={{ gap: 10 }}>
      {topCategory && (
        <Card onPress={onPress}>
          <View style={styles.row}>
            <IconBox
              iconName={topCategory.icon}
              iconColor={topCategory.color}
              bgColor={hexWithAlpha(topCategory.color, 0.14)}
              size={36}
              iconSize={18}
            />
            <View style={styles.textCol}>
              <Text
                style={{
                  ...theme.typography.caption,
                  color: theme.colors.text.secondary,
                }}>
                Bu ay en çok harcama
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: theme.colors.text.primary,
                  marginTop: 2,
                }}
                numberOfLines={1}>
                {topCategory.name} ·{' '}
                <Text style={{ color: topCategory.color }}>
                  {formatCurrency(insights.topAmount, currency, language)}
                </Text>
              </Text>
            </View>
          </View>
        </Card>
      )}

      {momText && (
        <Card onPress={onPress}>
          <View style={styles.row}>
            <IconBox
              iconName={momIconName}
              iconColor={momColor}
              bgColor={momBg}
              size={36}
              iconSize={18}
            />
            <View style={styles.textCol}>
              <Text
                style={{
                  ...theme.typography.caption,
                  color: theme.colors.text.secondary,
                }}>
                Geçen aya göre
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: theme.colors.text.primary,
                  marginTop: 2,
                }}
                numberOfLines={1}>
                {momText}
              </Text>
            </View>
          </View>
        </Card>
      )}

      <Card onPress={onPress}>
        <View style={styles.row}>
          <IconBox
            iconName="calendar"
            iconColor="#007AFF"
            bgColor="#E8F0FE"
            size={36}
            iconSize={18}
          />
          <View style={styles.textCol}>
            <Text
              style={{
                ...theme.typography.caption,
                color: theme.colors.text.secondary,
              }}>
              Günlük ortalama
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: theme.colors.text.primary,
                marginTop: 2,
              }}>
              {formatCurrency(insights.dailyAvg, currency, language)}
            </Text>
          </View>
          <Icon name="chevron-right" size={18} color={theme.colors.text.secondary} />
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textCol: {
    flex: 1,
  },
});
