import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import dayjs from 'dayjs';

import { useTheme } from '../../theme';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { BarChart, isChartsAvailable } from '../../services/charts';

const MONTHS_BACK = 6;

interface MonthBucket {
  month: dayjs.Dayjs;
  label: string;
  income: number;
  expense: number;
}

function abbreviate(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${Math.round(n / 100) / 10}k`;
  return `${Math.round(n)}`;
}

export function IncomeExpenseChart() {
  const { theme } = useTheme();
  const transactions = useTransactionStore((s) => s.transactions);
  const language = useSettingsStore((s) => s.language);

  const buckets = useMemo<MonthBucket[]>(() => {
    const now = dayjs();
    const list: MonthBucket[] = [];
    for (let i = MONTHS_BACK - 1; i >= 0; i--) {
      const month = now.subtract(i, 'month').startOf('month');
      list.push({
        month,
        label: month.locale(language).format('MMM'),
        income: 0,
        expense: 0,
      });
    }

    for (const t of transactions) {
      const d = dayjs(t.date);
      for (const b of list) {
        if (d.isSame(b.month, 'month') && d.isSame(b.month, 'year')) {
          if (t.type === 'income') b.income += t.amount;
          else b.expense += t.amount;
          break;
        }
      }
    }

    return list;
  }, [transactions, language]);

  if (!isChartsAvailable || !BarChart) {
    return (
      <View style={[styles.fallback, { borderColor: theme.colors.border.card }]}>
        <Text
          style={{
            ...theme.typography.caption,
            color: theme.colors.text.secondary,
          }}>
          Grafik kütüphanesi yüklü değil
        </Text>
      </View>
    );
  }

  // gifted-charts renders grouped bars by interleaving items with
  // spacing-only spacers after each pair.
  const barData = buckets.flatMap((b, idx) => {
    const isFirstOfPair = true;
    const pair = [
      {
        value: Math.round(b.income),
        frontColor: theme.colors.semantic.income,
        gradientColor: theme.colors.semantic.income,
        label: b.label,
        topLabelComponent: () =>
          b.income > 0 ? (
            <Text style={[styles.topLabel, { color: theme.colors.text.secondary }]}>
              {abbreviate(b.income)}
            </Text>
          ) : null,
        spacing: 2,
        labelWidth: 50,
        labelTextStyle: {
          color: theme.colors.text.secondary,
          fontSize: 10,
        },
      },
      {
        value: Math.round(b.expense),
        frontColor: theme.colors.semantic.expense,
        gradientColor: theme.colors.semantic.expense,
        topLabelComponent: () =>
          b.expense > 0 ? (
            <Text style={[styles.topLabel, { color: theme.colors.text.secondary }]}>
              {abbreviate(b.expense)}
            </Text>
          ) : null,
        spacing: idx === buckets.length - 1 ? 2 : 18,
      },
    ];
    void isFirstOfPair;
    return pair;
  });

  const maxValue = Math.max(
    ...buckets.map((b) => Math.max(b.income, b.expense)),
    1
  );

  return (
    <View>
      <BarChart
        data={barData}
        barWidth={14}
        barBorderTopLeftRadius={4}
        barBorderTopRightRadius={4}
        noOfSections={4}
        maxValue={Math.ceil(maxValue * 1.15)}
        initialSpacing={14}
        spacing={4}
        yAxisThickness={0}
        xAxisThickness={0}
        xAxisColor={theme.colors.border.card}
        rulesColor={theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}
        rulesType="solid"
        yAxisTextStyle={{
          color: theme.colors.text.secondary,
          fontSize: 10,
        }}
        formatYLabel={(v: string) => abbreviate(parseFloat(v))}
        isAnimated
        animationDuration={600}
        width={280}
      />

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: theme.colors.semantic.income },
            ]}
          />
          <Text
            style={[styles.legendLabel, { color: theme.colors.text.secondary }]}>
            Gelir
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: theme.colors.semantic.expense },
            ]}
          />
          <Text
            style={[styles.legendLabel, { color: theme.colors.text.secondary }]}>
            Gider
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topLabel: {
    fontSize: 9,
    fontWeight: '500',
    marginBottom: 2,
  },
  fallback: {
    paddingVertical: 28,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
    paddingLeft: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});
