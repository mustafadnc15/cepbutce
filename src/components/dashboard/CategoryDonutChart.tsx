import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import dayjs from 'dayjs';

import { useTheme } from '../../theme';
import { Chip } from '../ui';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { PieChart, isChartsAvailable } from '../../services/charts';
import { DEFAULT_CATEGORIES } from '../../constants/categories';
import { formatCurrency } from '../../utils/currency';

type SupportedCurrency = 'TRY' | 'USD' | 'EUR' | 'GBP';
type Period = 'month' | 'quarter' | 'year';

const PERIOD_OPTIONS: Array<{ id: Period; label: string }> = [
  { id: 'month', label: 'Bu Ay' },
  { id: 'quarter', label: 'Son 3 Ay' },
  { id: 'year', label: 'Bu Yıl' },
];

interface Segment {
  categoryId: string;
  name: string;
  color: string;
  value: number;
}

function rangeFor(period: Period): { start: string; end: string } {
  const now = dayjs();
  if (period === 'month') {
    return {
      start: now.startOf('month').toISOString(),
      end: now.endOf('month').toISOString(),
    };
  }
  if (period === 'quarter') {
    return {
      start: now.subtract(2, 'month').startOf('month').toISOString(),
      end: now.endOf('month').toISOString(),
    };
  }
  return {
    start: now.startOf('year').toISOString(),
    end: now.endOf('year').toISOString(),
  };
}

export function CategoryDonutChart() {
  const { theme } = useTheme();
  const transactions = useTransactionStore((s) => s.transactions);
  const language = useSettingsStore((s) => s.language);
  const currency = useSettingsStore((s) => s.currency) as SupportedCurrency;

  const [period, setPeriod] = useState<Period>('month');

  const { segments, total } = useMemo(() => {
    const { start, end } = rangeFor(period);
    const filtered = transactions.filter(
      (t) => t.type === 'expense' && t.date >= start && t.date <= end
    );

    const byCat = new Map<string, number>();
    for (const t of filtered) {
      byCat.set(t.categoryId, (byCat.get(t.categoryId) ?? 0) + t.amount);
    }

    const list: Segment[] = [];
    let sum = 0;
    for (const [categoryId, value] of byCat.entries()) {
      const cat = DEFAULT_CATEGORIES.find((c) => c.id === categoryId);
      if (!cat) continue;
      list.push({
        categoryId,
        name: cat.name,
        color: cat.color,
        value,
      });
      sum += value;
    }
    list.sort((a, b) => b.value - a.value);

    return { segments: list, total: sum };
  }, [transactions, period]);

  const pieData = segments.map((s) => ({
    value: s.value,
    color: s.color,
    text: total > 0 ? `${Math.round((s.value / total) * 100)}%` : '',
  }));

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}>
        {PERIOD_OPTIONS.map((opt) => (
          <Chip
            key={opt.id}
            label={opt.label}
            active={opt.id === period}
            onPress={() => setPeriod(opt.id)}
          />
        ))}
      </ScrollView>

      {total === 0 || !isChartsAvailable || !PieChart ? (
        <View style={[styles.fallback, { borderColor: theme.colors.border.card }]}>
          <Text
            style={{
              ...theme.typography.caption,
              color: theme.colors.text.secondary,
            }}>
            {!isChartsAvailable
              ? 'Grafik kütüphanesi yüklü değil'
              : 'Bu dönemde harcama bulunmuyor'}
          </Text>
        </View>
      ) : (
        <View style={styles.chartWrap}>
          <PieChart
            donut
            data={pieData}
            radius={90}
            innerRadius={58}
            innerCircleColor={theme.colors.bg.card}
            centerLabelComponent={() => (
              <View style={styles.center}>
                <Text
                  style={{
                    ...theme.typography.caption,
                    color: theme.colors.text.secondary,
                  }}>
                  Toplam
                </Text>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '700',
                    color: theme.colors.text.primary,
                    marginTop: 2,
                  }}>
                  {formatCurrency(total, currency, language)}
                </Text>
              </View>
            )}
            textColor="#FFFFFF"
            textSize={10}
            focusOnPress
            strokeColor={theme.colors.bg.card}
            strokeWidth={2}
            isAnimated
            animationDuration={600}
          />
        </View>
      )}

      {segments.length > 0 && (
        <View style={styles.legend}>
          {segments.map((s) => {
            const pct = total > 0 ? (s.value / total) * 100 : 0;
            return (
              <View key={s.categoryId} style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: s.color }]} />
                <Text
                  style={[styles.legendName, { color: theme.colors.text.primary }]}
                  numberOfLines={1}>
                  {s.name}
                </Text>
                <Text
                  style={[styles.legendPct, { color: theme.colors.text.secondary }]}>
                  {pct.toFixed(1)}%
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    gap: 8,
    paddingBottom: 12,
  },
  chartWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  center: {
    alignItems: 'center',
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
    marginTop: 12,
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  legendPct: {
    fontSize: 12,
    fontWeight: '500',
  },
});
