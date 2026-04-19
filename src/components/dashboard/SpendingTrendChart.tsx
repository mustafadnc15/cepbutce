import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import dayjs from 'dayjs';

import { useTheme } from '../../theme';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { LineChart, isChartsAvailable } from '../../services/charts';
import { formatCurrency } from '../../utils/currency';

type SupportedCurrency = 'TRY' | 'USD' | 'EUR' | 'GBP';

const MONTHS_BACK = 6;

interface MonthBucket {
  month: dayjs.Dayjs;
  label: string;
  expense: number;
}

function abbreviate(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${Math.round(n / 100) / 10}k`;
  return `${Math.round(n)}`;
}

export function SpendingTrendChart() {
  const { theme } = useTheme();
  const transactions = useTransactionStore((s) => s.transactions);
  const language = useSettingsStore((s) => s.language);
  const currency = useSettingsStore((s) => s.currency) as SupportedCurrency;

  const buckets = useMemo<MonthBucket[]>(() => {
    const now = dayjs();
    const list: MonthBucket[] = [];
    for (let i = MONTHS_BACK - 1; i >= 0; i--) {
      const month = now.subtract(i, 'month').startOf('month');
      list.push({
        month,
        label: month.locale(language).format('MMM'),
        expense: 0,
      });
    }

    for (const t of transactions) {
      if (t.type !== 'expense') continue;
      const d = dayjs(t.date);
      for (const b of list) {
        if (d.isSame(b.month, 'month') && d.isSame(b.month, 'year')) {
          b.expense += t.amount;
          break;
        }
      }
    }

    return list;
  }, [transactions, language]);

  if (!isChartsAvailable || !LineChart) {
    return <UnavailableFallback theme={theme} />;
  }

  const data = buckets.map((b) => ({
    value: Math.round(b.expense),
    label: b.label,
    dataPointText: b.expense > 0 ? abbreviate(b.expense) : '',
  }));

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={styles.root}>
      <LineChart
        data={data}
        thickness={3}
        color={theme.colors.brand.primary}
        startFillColor={theme.colors.brand.primary}
        endFillColor={theme.colors.brand.primary}
        startOpacity={0.18}
        endOpacity={0.02}
        areaChart
        curved
        noOfSections={4}
        spacing={50}
        initialSpacing={14}
        endSpacing={14}
        maxValue={Math.ceil(maxValue * 1.1)}
        yAxisThickness={0}
        xAxisThickness={0}
        xAxisColor={theme.colors.border.card}
        yAxisTextStyle={{
          color: theme.colors.text.secondary,
          fontSize: 10,
        }}
        xAxisLabelTextStyle={{
          color: theme.colors.text.secondary,
          fontSize: 10,
        }}
        rulesColor={theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}
        rulesType="solid"
        hideDataPoints={false}
        dataPointsColor={theme.colors.brand.primary}
        dataPointsRadius={4}
        showValuesAsDataPointsText
        dataPointsVerticalShift={-14}
        focusEnabled
        textShiftY={-6}
        textFontSize={10}
        textColor={theme.colors.text.secondary}
        formatYLabel={(v: string) => abbreviate(parseFloat(v))}
        isAnimated
        animationDuration={800}
        width={260}
      />
      <View style={styles.footer}>
        <Text
          style={{
            ...theme.typography.caption,
            color: theme.colors.text.secondary,
          }}>
          Son 6 ay · {formatCurrency(
            data.reduce((s, d) => s + d.value, 0),
            currency,
            language
          )} toplam
        </Text>
      </View>
    </View>
  );
}

function UnavailableFallback({ theme }: { theme: ReturnType<typeof useTheme>['theme'] }) {
  return (
    <View style={[styles.fallback, { borderColor: theme.colors.border.card }]}>
      <Text style={{ ...theme.typography.caption, color: theme.colors.text.secondary }}>
        Grafik kütüphanesi yüklü değil
      </Text>
      <Text
        style={{
          ...theme.typography.caption,
          color: theme.colors.text.secondary,
          marginTop: 4,
        }}>
        npm install react-native-gifted-charts
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
  },
  footer: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  fallback: {
    paddingVertical: 28,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
