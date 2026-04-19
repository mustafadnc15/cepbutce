import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../theme';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { formatCurrency } from '../../utils/currency';

interface MonthlySummaryBarProps {
  income: number;
  expense: number;
}

type SupportedCurrency = 'TRY' | 'USD' | 'EUR' | 'GBP';

export function MonthlySummaryBar({ income, expense }: MonthlySummaryBarProps) {
  const { theme } = useTheme();
  const currency = useSettingsStore((s) => s.currency) as SupportedCurrency;
  const language = useSettingsStore((s) => s.language);

  const net = income - expense;
  const netPositive = net >= 0;

  // formatCurrency prints "-₺123,45" for negatives; we render the sign + absolute
  // value separately so expense/negative-net use the same "−" visual prefix.
  const incomeStr = formatCurrency(income, currency, language);
  const expenseStr = formatCurrency(expense, currency, language);
  const netStr = formatCurrency(Math.abs(net), currency, language);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.bg.card,
          borderColor: theme.colors.border.card,
          ...theme.shadows.card,
        },
      ]}>
      <Stat
        label={language === 'tr' ? 'Gelir' : 'Income'}
        value={`+${incomeStr}`}
        color={theme.colors.semantic.income}
      />
      <View style={[styles.divider, { backgroundColor: theme.colors.border.card }]} />
      <Stat
        label={language === 'tr' ? 'Gider' : 'Expense'}
        value={`−${expenseStr}`}
        color={theme.colors.semantic.expense}
      />
      <View style={[styles.divider, { backgroundColor: theme.colors.border.card }]} />
      <Stat
        label={language === 'tr' ? 'Net' : 'Net'}
        value={netPositive ? netStr : `−${netStr}`}
        color={netPositive ? theme.colors.brand.primary : theme.colors.semantic.expense}
      />
    </View>
  );
}

interface StatProps {
  label: string;
  value: string;
  color: string;
}

function Stat({ label, value, color }: StatProps) {
  const { theme } = useTheme();
  return (
    <View style={styles.stat}>
      <Text
        style={[styles.statLabel, { color: theme.colors.text.secondary }]}
        numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.statValue, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    gap: 8,
  },
  stat: {
    flex: 1,
    gap: 2,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
});
