import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/feather';
import HapticFeedback from 'react-native-haptic-feedback';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../theme';
import { Button, Input, SectionHeader, Card } from '../components/ui';
import { CategoryBudgetRow } from '../components/budgets/CategoryBudgetRow';
import { useBudgetStore } from '../stores/useBudgetStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { usePremium } from '../hooks/usePremium';
import { DEFAULT_CATEGORIES } from '../constants/categories';
import type { Budget } from '../types';

const CURRENCY_SYMBOLS: Record<string, string> = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

// Plain "raw" numeric text — no grouping. Users type bare digits and an
// optional separator. Stored value comes back via parseAmount below.
function toRawAmount(n: number | undefined): string {
  if (n === undefined || n === null || !Number.isFinite(n) || n <= 0) return '';
  const fixed = n.toFixed(2);
  const trimmed = fixed.replace(/\.?0+$/, '');
  return trimmed.length === 0 ? '' : trimmed;
}

function parseAmount(raw: string): number {
  if (!raw) return 0;
  // Accept Turkish format (comma decimal) and standard dot decimal.
  const normalized = raw.replace(/\./g, '').replace(/,/g, '.');
  const n = parseFloat(normalized);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

const EXPENSE_CATEGORIES = DEFAULT_CATEGORIES.filter((c) => c.type === 'expense');

export function BudgetSettingsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const currency = useSettingsStore((s) => s.currency);
  const budgetResetDay = useSettingsStore((s) => s.budgetResetDay);
  const setBudgetResetDay = useSettingsStore((s) => s.setBudgetResetDay);
  const { canUsePerCategoryBudgets, showPaywall } = usePremium();

  const budgets = useBudgetStore((s) => s.budgets);
  const upsertBudget = useBudgetStore((s) => s.upsertBudget);
  const removeBudgetByCategory = useBudgetStore((s) => s.removeBudgetByCategory);

  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;

  const [overallRaw, setOverallRaw] = useState<string>('');
  const [catRaw, setCatRaw] = useState<Record<string, string>>({});
  const [resetDay, setResetDay] = useState<number>(budgetResetDay);
  const hydratedRef = useRef(false);

  // One-shot hydration from the store. Re-hydrating on every budgets change
  // would wipe unsaved text when the user swipes-to-remove a row, since that
  // removal mutates `budgets` immediately.
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const overall = budgets.find((b) => b.categoryId === null);
    setOverallRaw(toRawAmount(overall?.amount));

    const map: Record<string, string> = {};
    budgets
      .filter((b): b is Budget & { categoryId: string } => b.categoryId !== null)
      .forEach((b) => {
        map[b.categoryId] = toRawAmount(b.amount);
      });
    setCatRaw(map);
  }, [budgets]);

  const handleCategoryChange = useCallback((categoryId: string, text: string) => {
    setCatRaw((prev) => ({ ...prev, [categoryId]: text }));
  }, []);

  const handleCategoryRemove = useCallback((categoryId: string) => {
    setCatRaw((prev) => {
      const next = { ...prev };
      delete next[categoryId];
      return next;
    });
    removeBudgetByCategory(categoryId);
  }, [removeBudgetByCategory]);

  const handleIncrementDay = useCallback(() => {
    HapticFeedback.trigger('impactLight');
    setResetDay((d) => Math.min(28, d + 1));
  }, []);

  const handleDecrementDay = useCallback(() => {
    HapticFeedback.trigger('impactLight');
    setResetDay((d) => Math.max(1, d - 1));
  }, []);

  const handleSave = useCallback(() => {
    Keyboard.dismiss();
    const overallAmount = parseAmount(overallRaw);

    if (overallAmount > 0) {
      upsertBudget({
        categoryId: null,
        amount: overallAmount,
        period: 'monthly',
        currency,
      });
    } else {
      removeBudgetByCategory(null);
    }

    // Skip per-category writes for non-premium users so a downgrade
    // doesn't silently strip previously-set limits just from tapping Save.
    if (canUsePerCategoryBudgets) {
      for (const category of EXPENSE_CATEGORIES) {
        const raw = catRaw[category.id] ?? '';
        const amount = parseAmount(raw);
        if (amount > 0) {
          upsertBudget({
            categoryId: category.id,
            amount,
            period: 'monthly',
            currency,
          });
        } else {
          removeBudgetByCategory(category.id);
        }
      }
    }

    setBudgetResetDay(resetDay);

    HapticFeedback.trigger('notificationSuccess');
    Toast.show({
      type: 'success',
      text1: 'Bütçe güncellendi ✓',
    });
    navigation.goBack();
  }, [
    overallRaw,
    catRaw,
    resetDay,
    upsertBudget,
    removeBudgetByCategory,
    currency,
    setBudgetResetDay,
    navigation,
    canUsePerCategoryBudgets,
  ]);

  const handleBack = () => {
    HapticFeedback.trigger('impactLight');
    navigation.goBack();
  };

  const budgetSetCount = useMemo(
    () => Object.values(catRaw).filter((r) => parseAmount(r) > 0).length,
    [catRaw]
  );

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
          Bütçe Ayarları
        </Text>
        <View style={styles.iconBtn} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 50}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 100 },
          ]}
          keyboardShouldPersistTaps="handled">
          {/* Overall budget */}
          <View style={{ gap: 8 }}>
            <SectionHeader title="Aylık Toplam Bütçe" />
            <Card>
              <Text
                style={{
                  ...theme.typography.subtitle,
                  color: theme.colors.text.secondary,
                  marginBottom: 10,
                }}>
                Ay sonuna kadar harcamak istediğiniz toplam tutar.
              </Text>
              <Input
                value={overallRaw}
                onChangeText={setOverallRaw}
                keyboardType="numeric"
                prefix={symbol}
                placeholder="0"
              />
            </Card>
          </View>

          {/* Category budgets */}
          <View style={{ gap: 8, marginTop: 20 }}>
            <SectionHeader
              title="Kategori Bütçeleri"
              actionLabel={
                canUsePerCategoryBudgets
                  ? budgetSetCount > 0
                    ? `${budgetSetCount} aktif`
                    : undefined
                  : 'Premium'
              }
            />
            {canUsePerCategoryBudgets ? (
              <>
                <Text
                  style={{
                    ...theme.typography.caption,
                    color: theme.colors.text.secondary,
                    marginBottom: 4,
                  }}>
                  Kategori başına limit koymak için tutar girin. Kaldırmak için
                  sola kaydırın.
                </Text>
                <View style={{ gap: 8 }}>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <CategoryBudgetRow
                      key={category.id}
                      category={category}
                      value={catRaw[category.id] ?? ''}
                      prefix={symbol}
                      onChangeText={(txt) =>
                        handleCategoryChange(category.id, txt)
                      }
                      onRemove={() => handleCategoryRemove(category.id)}
                      canRemove={parseAmount(catRaw[category.id] ?? '') > 0}
                    />
                  ))}
                </View>
              </>
            ) : (
              <Pressable
                onPress={() => {
                  HapticFeedback.trigger('impactLight');
                  showPaywall();
                }}
                accessibilityRole="button"
                accessibilityLabel="Premium">
                <Card>
                  <View style={styles.lockRow}>
                    <View
                      style={[
                        styles.lockIconCircle,
                        {
                          backgroundColor: theme.colors.brand.primaryTint,
                        },
                      ]}>
                      <Icon
                        name="lock"
                        size={20}
                        color={theme.colors.brand.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          ...theme.typography.listTitle,
                          color: theme.colors.text.primary,
                        }}>
                        Kategori Bütçeleri (Premium)
                      </Text>
                      <Text
                        style={{
                          ...theme.typography.subtitle,
                          color: theme.colors.text.secondary,
                          marginTop: 2,
                        }}>
                        Her kategori için ayrı limit koymak için Premium'a geç.
                      </Text>
                    </View>
                    <Icon
                      name="chevron-right"
                      size={20}
                      color={theme.colors.text.secondary}
                    />
                  </View>
                </Card>
              </Pressable>
            )}
          </View>

          {/* Reset day */}
          <View style={{ gap: 8, marginTop: 20 }}>
            <SectionHeader title="Sıfırlama Günü" />
            <Card>
              <View style={styles.resetRow}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      ...theme.typography.body,
                      color: theme.colors.text.primary,
                      fontWeight: '500',
                    }}>
                    Her ayın {resetDay}'inde sıfırla
                  </Text>
                  <Text
                    style={{
                      ...theme.typography.caption,
                      color: theme.colors.text.secondary,
                      marginTop: 2,
                    }}>
                    Bütçe ve analiz döngüsünün başlangıç günü.
                  </Text>
                </View>
                <View style={styles.stepper}>
                  <Pressable
                    onPress={handleDecrementDay}
                    hitSlop={8}
                    style={[
                      styles.stepperBtn,
                      {
                        backgroundColor: theme.colors.brand.primaryTint,
                      },
                    ]}>
                    <Icon name="minus" size={16} color={theme.colors.brand.primary} />
                  </Pressable>
                  <Text
                    style={[
                      styles.stepperValue,
                      { color: theme.colors.text.primary },
                    ]}>
                    {resetDay}
                  </Text>
                  <Pressable
                    onPress={handleIncrementDay}
                    hitSlop={8}
                    style={[
                      styles.stepperBtn,
                      {
                        backgroundColor: theme.colors.brand.primaryTint,
                      },
                    ]}>
                    <Icon name="plus" size={16} color={theme.colors.brand.primary} />
                  </Pressable>
                </View>
              </View>
            </Card>
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
          <Button title="Kaydet" onPress={handleSave} />
        </View>
      </KeyboardAvoidingView>
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
  resetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 17,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lockIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
