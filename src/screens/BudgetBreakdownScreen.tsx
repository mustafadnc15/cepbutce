import React, { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/feather';
import HapticFeedback from 'react-native-haptic-feedback';
import dayjs from 'dayjs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../theme';
import { Button, Card, EmptyState, SectionHeader } from '../components/ui';
import { BudgetRing } from '../components/budgets/BudgetRing';
import { CategoryProgressRow } from '../components/budgets/CategoryProgressRow';
import { useBudgetStore } from '../stores/useBudgetStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import { DEFAULT_CATEGORIES } from '../constants/categories';
import { formatCurrency } from '../utils/currency';
import type { DashboardStackParamList } from '../navigation/types';

type SupportedCurrency = 'TRY' | 'USD' | 'EUR' | 'GBP';
type Nav = NativeStackNavigationProp<DashboardStackParamList, 'BudgetBreakdown'>;

const EXPENSE_CATEGORIES = DEFAULT_CATEGORIES.filter((c) => c.type === 'expense');

interface CategoryEntry {
  categoryId: string;
  spent: number;
  budget: number | null;
  percent: number; // Infinity if spent > 0 and no budget, for sort purposes
}

export function BudgetBreakdownScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();

  const language = useSettingsStore((s) => s.language);
  const currency = useSettingsStore((s) => s.currency) as SupportedCurrency;

  const transactions = useTransactionStore((s) => s.transactions);
  const budgets = useBudgetStore((s) => s.budgets);

  const { overall, categoryRows, monthLabel } = useMemo(() => {
    const start = dayjs().startOf('month').toISOString();
    const end = dayjs().endOf('month').toISOString();

    const monthExpenses = transactions.filter(
      (t) => t.type === 'expense' && t.date >= start && t.date <= end
    );

    const spentByCat = new Map<string, number>();
    let totalSpent = 0;
    for (const t of monthExpenses) {
      totalSpent += t.amount;
      spentByCat.set(t.categoryId, (spentByCat.get(t.categoryId) ?? 0) + t.amount);
    }

    const overallBudget = budgets.find((b) => b.categoryId === null);
    const rows: CategoryEntry[] = EXPENSE_CATEGORIES.map((cat) => {
      const spent = spentByCat.get(cat.id) ?? 0;
      const b = budgets.find((x) => x.categoryId === cat.id);
      const budget = b?.amount ?? null;
      const percent = budget && budget > 0 ? spent / budget : spent > 0 ? Infinity : 0;
      return { categoryId: cat.id, spent, budget, percent };
    }).filter((r) => r.spent > 0 || r.budget !== null);

    rows.sort((a, b) => b.percent - a.percent);

    return {
      overall: {
        amount: overallBudget?.amount ?? 0,
        spent: totalSpent,
      },
      categoryRows: rows,
      monthLabel: dayjs().locale(language).format('MMMM YYYY'),
    };
  }, [transactions, budgets, language]);

  const hasOverall = overall.amount > 0;
  const percent = hasOverall ? overall.spent / overall.amount : 0;
  const remaining = Math.max(0, overall.amount - overall.spent);
  const over = Math.max(0, overall.spent - overall.amount);

  const primaryText = !hasOverall
    ? formatCurrency(overall.spent, currency, language)
    : over > 0
    ? `-${formatCurrency(over, currency, language)}`
    : formatCurrency(remaining, currency, language);

  const secondaryText = hasOverall
    ? `${formatCurrency(overall.spent, currency, language)} / ${formatCurrency(
        overall.amount,
        currency,
        language
      )}`
    : 'Bütçe tanımlı değil';

  const handleBack = () => {
    HapticFeedback.trigger('impactLight');
    navigation.goBack();
  };

  const handleEdit = () => {
    navigation.navigate('BudgetSettings');
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg.page }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            borderBottomColor: theme.colors.border.card,
            backgroundColor: theme.colors.bg.page,
          },
        ]}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.iconBtn}>
          <Icon name="chevron-left" size={24} color={theme.colors.text.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
          Bütçe Dökümü
        </Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}>
        <Card>
          <View style={styles.ringWrap}>
            <BudgetRing
              size={180}
              thickness={14}
              percent={percent}
              primaryText={primaryText}
              secondaryText={secondaryText}
              primaryTone={!hasOverall ? 'muted' : 'default'}
            />
            <Text
              style={{
                ...theme.typography.caption,
                color: theme.colors.text.secondary,
                marginTop: 12,
              }}>
              {monthLabel.toLocaleUpperCase('tr-TR')}
            </Text>
          </View>
        </Card>

        <View style={{ marginTop: 20, gap: 8 }}>
          <SectionHeader title="Kategoriler" />
          {categoryRows.length === 0 ? (
            <EmptyState
              icon="pie-chart"
              title="Henüz harcama yok"
              subtitle="Bu ay harcama kaydı bulunmuyor."
            />
          ) : (
            <View style={{ gap: 10 }}>
              {categoryRows.map((row) => {
                const category = EXPENSE_CATEGORIES.find((c) => c.id === row.categoryId);
                if (!category) return null;
                return (
                  <CategoryProgressRow
                    key={row.categoryId}
                    category={category}
                    spent={row.spent}
                    budget={row.budget}
                    currency={currency}
                    language={language}
                  />
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + 12,
            backgroundColor: theme.colors.bg.page,
            borderTopColor: theme.colors.border.card,
          },
        ]}>
        <Button title="Bütçeyi Düzenle" onPress={handleEdit} icon="edit-2" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  ringWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
