import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import HapticFeedback from 'react-native-haptic-feedback';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import 'dayjs/locale/en';
import Toast from 'react-native-toast-message';
import Icon from '@react-native-vector-icons/feather';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CompositeNavigationProp } from '@react-navigation/native';

import { useTheme } from '../theme';
import { EmptyState, HeroSlab, SegmentedTrack } from '../components/ui';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';
import { useBudgetStore } from '../stores/useBudgetStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useSheetStore } from '../stores/useSheetStore';
import { DEFAULT_CATEGORIES } from '../constants/categories';
import { formatCurrency } from '../utils/currency';
import { seedDemoData, clearDemoData, hasDemoData } from '../utils/seed';
import type {
  DashboardStackParamList,
  MainTabParamList,
  RootStackParamList,
} from '../navigation/types';
import type { Subscription, Transaction } from '../types';

type DashboardNav = CompositeNavigationProp<
  NativeStackNavigationProp<DashboardStackParamList, 'DashboardHome'>,
  CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList>,
    NativeStackNavigationProp<RootStackParamList>
  >
>;

type SupportedCurrency = 'TRY' | 'USD' | 'EUR' | 'GBP';

const CATEGORY_MAP = DEFAULT_CATEGORIES.reduce<
  Record<string, typeof DEFAULT_CATEGORIES[number]>
>((acc, c) => {
  acc[c.id] = c;
  return acc;
}, {});

function daysUntil(iso: string): number {
  return Math.max(0, dayjs(iso).startOf('day').diff(dayjs().startOf('day'), 'day'));
}

function getGreeting(lang: 'tr' | 'en', date: Date = new Date()): string {
  const h = date.getHours();
  if (lang === 'tr') {
    if (h >= 6 && h < 12) return 'İyi Sabahlar';
    if (h >= 12 && h < 18) return 'İyi Günler';
    if (h >= 18 && h < 22) return 'İyi Akşamlar';
    return 'İyi Geceler';
  }
  if (h >= 6 && h < 12) return 'Good morning';
  if (h >= 12 && h < 18) return 'Good afternoon';
  if (h >= 18 && h < 22) return 'Good evening';
  return 'Good night';
}

export function DashboardScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<DashboardNav>();

  const transactions = useTransactionStore((s) => s.transactions);
  const loadTransactions = useTransactionStore((s) => s.loadTransactions);
  const dailySpendSelector = useTransactionStore((s) => s.dailySpendForMonth);
  const subscriptions = useSubscriptionStore((s) => s.subscriptions);
  const loadSubscriptions = useSubscriptionStore((s) => s.loadAll);
  const loadBudgets = useBudgetStore((s) => s.loadAll);

  const language = useSettingsStore((s) => s.language);
  const currency = useSettingsStore((s) => s.currency) as SupportedCurrency;

  const openAddTransaction = useSheetStore((s) => s.openAddTransaction);
  const openAddIncome = useSheetStore((s) => s.openAddIncome);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTransactions();
    loadSubscriptions();
    loadBudgets();
  }, [loadTransactions, loadSubscriptions, loadBudgets]);

  const tr = language === 'tr';

  // Rebuild aggregates any time transactions or budgets change.
  const metrics = useMemo(() => {
    const now = dayjs();
    const daysInMonth = now.daysInMonth();
    const todayIdx = Math.min(now.date() - 1, daysInMonth - 1);
    const daysLeftInclusive = Math.max(1, daysInMonth - todayIdx);

    const startOfMonth = now.startOf('month').toISOString();
    const endOfMonth = now.endOf('month').toISOString();
    const startOfWeek = now.startOf('week').toISOString();
    const endOfWeek = now.endOf('week').toISOString();

    let monthlyExpense = 0;
    let todaySpend = 0;
    let weeklyIncome = 0;
    let totalIncomeLifetime = 0;
    let totalExpenseLifetime = 0;
    const todayDay = dayjs().format('YYYY-MM-DD');

    for (const t of transactions) {
      if (t.type === 'expense') totalExpenseLifetime += t.amount;
      else totalIncomeLifetime += t.amount;

      if (t.date >= startOfWeek && t.date <= endOfWeek && t.type === 'income') {
        weeklyIncome += t.amount;
      }
      if (t.date >= startOfMonth && t.date <= endOfMonth) {
        if (t.type === 'expense') {
          monthlyExpense += t.amount;
          if (dayjs(t.date).format('YYYY-MM-DD') === todayDay) {
            todaySpend += t.amount;
          }
        }
      }
    }

    const overall = useBudgetStore.getState().overallBudget();
    const budget = overall?.amount ?? 0;
    const remainingBudget = Math.max(0, budget - monthlyExpense);
    const perDay = budget > 0 ? remainingBudget / daysLeftInclusive : 0;

    const dailySpend = dailySpendSelector(now.toDate());
    const balance = totalIncomeLifetime - totalExpenseLifetime;

    return {
      daysInMonth,
      todayIdx,
      daysLeftInclusive,
      monthlyExpense,
      todaySpend,
      budget,
      perDay,
      dailySpend,
      balance,
      weeklyIncome,
    };
  }, [transactions, dailySpendSelector]);

  const recentTransactions = useMemo<Transaction[]>(
    () =>
      transactions
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 3),
    [transactions]
  );

  const upcomingSubs = useMemo<Subscription[]>(
    () =>
      subscriptions
        .filter((s) => s.isActive)
        .slice()
        .sort((a, b) => a.nextRenewalDate.localeCompare(b.nextRenewalDate))
        .slice(0, 3),
    [subscriptions]
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    HapticFeedback.trigger('impactLight');
    loadTransactions();
    loadSubscriptions();
    loadBudgets();
    setTimeout(() => setRefreshing(false), 400);
  }, [loadTransactions, loadSubscriptions, loadBudgets]);

  const handleSeeAllTransactions = () => {
    HapticFeedback.trigger('impactLight');
    navigation.navigate('Transactions', { screen: 'TransactionsHome' });
  };

  const handleSeeAllSubscriptions = () => {
    HapticFeedback.trigger('impactLight');
    navigation.navigate('Subscriptions', { screen: 'SubscriptionsHome' });
  };

  const handleHeroPress = () => {
    HapticFeedback.trigger('impactLight');
    if (metrics.budget <= 0) {
      navigation.navigate('BudgetSettings');
    } else {
      navigation.navigate('BudgetBreakdown');
    }
  };

  const handleNotificationsPress = () => {
    HapticFeedback.trigger('impactLight');
    Toast.show({
      type: 'info',
      text1: tr ? 'Bildirimler' : 'Notifications',
      text2: tr ? 'Yakında' : 'Coming soon',
    });
  };

  const handleSettingsPress = () => {
    HapticFeedback.trigger('impactLight');
    navigation.navigate('Profile', { screen: 'ProfileHome' });
  };

  const handleScanReceipt = () => {
    HapticFeedback.trigger('impactLight');
    navigation.navigate('Scanner', { screen: 'ReceiptScanner' });
  };

  const greeting = getGreeting(language);
  const dateLine = tr
    ? dayjs().locale('tr').format('dddd · D MMMM')
    : dayjs().locale('en').format('dddd · MMM D');

  const hero = theme.colors.hero;
  const accent = theme.colors.brand.primary;

  const hasBudget = metrics.budget > 0;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg.page }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={accent}
            colors={[accent]}
          />
        }>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerTextBlock}>
            <Text
              style={[styles.headerDate, { color: theme.colors.text.secondary }]}
              numberOfLines={1}>
              {dateLine}
            </Text>
            <Text
              style={[styles.pageTitle, { color: theme.colors.text.primary }]}
              numberOfLines={1}>
              {greeting}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <ChromeButton
              iconName="bell"
              onPress={handleNotificationsPress}
              accessibilityLabel={tr ? 'Bildirimler' : 'Notifications'}
              showDot
            />
            <ChromeButton
              iconName="settings"
              onPress={handleSettingsPress}
              accessibilityLabel={tr ? 'Ayarlar' : 'Settings'}
            />
          </View>
        </View>

        {/* HERO — answer-first daily budget */}
        <View style={{ marginTop: 16 }}>
          <Pressable onPress={handleHeroPress}>
            <HeroSlab
              eyebrow={
                hasBudget
                  ? tr
                    ? `GÜNLÜK BÜTÇE · ${metrics.daysLeftInclusive} GÜN KALDI`
                    : `DAILY BUDGET · ${metrics.daysLeftInclusive} DAYS LEFT`
                  : tr
                  ? 'BU AY HARCANAN'
                  : 'SPENT THIS MONTH'
              }
              accent={accent}>
              {hasBudget ? (
                <>
                  <Text style={[styles.heroHint, { color: hero.fgMuted }]}>
                    {tr ? 'Bütçeyi korumak için günde' : 'To stay on budget, you can spend'}
                  </Text>
                  <Text
                    accessibilityRole="header"
                    style={[styles.heroBigNumber, { color: hero.fg }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit>
                    {formatCurrency(metrics.perDay, currency, language)}
                  </Text>
                  <Text style={[styles.heroHint, { color: hero.fgMuted }]}>
                    {tr ? 'harcayabilirsin' : 'per day'}
                  </Text>
                </>
              ) : (
                <>
                  <Text
                    style={[styles.heroBigNumber, { color: hero.fg, marginTop: 4 }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit>
                    {formatCurrency(metrics.monthlyExpense, currency, language)}
                  </Text>
                  <Text style={[styles.heroHint, { color: hero.fgMuted }]}>
                    {tr ? 'Bütçe ayarlamak için dokun →' : 'Tap to set a budget →'}
                  </Text>
                </>
              )}

              <View style={{ marginTop: 18 }}>
                <SegmentedTrack
                  segments={metrics.daysInMonth}
                  values={metrics.dailySpend}
                  today={metrics.todayIdx}
                  accent={accent}
                  mode="progress"
                  height={22}
                />
              </View>

              {hasBudget && (
                <View style={styles.heroFooterRow}>
                  <Text style={[styles.heroFooterLeft, { color: hero.fg }]}>
                    {formatCurrency(metrics.monthlyExpense, currency, language)}{' '}
                    <Text style={{ color: hero.fgMuted, fontWeight: '400' }}>
                      {tr ? 'harcandı' : 'spent'}
                    </Text>
                  </Text>
                  <Text style={[styles.heroFooterRight, { color: hero.fgDim }]}>
                    / {formatCurrency(metrics.budget, currency, language)}
                  </Text>
                </View>
              )}
            </HeroSlab>
          </Pressable>
        </View>

        {/* Mini stats row */}
        <View style={styles.miniRow}>
          <MiniStat
            label={tr ? 'Bakiye' : 'Balance'}
            value={formatCurrency(metrics.balance, currency, language)}
            tone="neutral"
          />
          <MiniStat
            label={tr ? 'Bu hafta gelir' : 'Income this week'}
            value={`+${formatCurrency(metrics.weeklyIncome, currency, language)}`}
            tone="pos"
            accent={accent}
          />
        </View>

        {/* Quick actions */}
        <View style={styles.quickRow}>
          <QuickAction
            iconName="minus-circle"
            label={tr ? 'Harcama' : 'Expense'}
            onPress={() => {
              HapticFeedback.trigger('impactLight');
              openAddTransaction();
            }}
          />
          <QuickAction
            iconName="trending-up"
            label={tr ? 'Gelir' : 'Income'}
            onPress={() => {
              HapticFeedback.trigger('impactLight');
              openAddIncome();
            }}
          />
          <QuickAction
            iconName="camera"
            label={tr ? 'Fiş Tara' : 'Scan Receipt'}
            onPress={handleScanReceipt}
          />
        </View>

        {/* Son işlemler */}
        <View style={{ marginTop: 22 }}>
          <SectionHead
            title={tr ? 'Son işlemler' : 'Recent'}
            action={
              transactions.length > 0 ? (tr ? 'Tümü' : 'All') : undefined
            }
            onAction={
              transactions.length > 0 ? handleSeeAllTransactions : undefined
            }
          />
          {recentTransactions.length === 0 ? (
            <View style={{ marginTop: 8 }}>
              <EmptyState
                icon="plus-circle"
                title={tr ? 'Henüz işlem yok' : 'No transactions yet'}
                actionLabel={tr ? 'Harcama Ekle' : 'Add Expense'}
                onAction={() => {
                  HapticFeedback.trigger('impactLight');
                  openAddTransaction();
                }}
              />
            </View>
          ) : (
            <View
              style={[
                styles.recentCard,
                {
                  backgroundColor: theme.colors.bg.card,
                  borderColor: theme.colors.border.card,
                },
              ]}>
              {recentTransactions.map((tx, i) => {
                const cat = CATEGORY_MAP[tx.categoryId];
                const color = cat?.color ?? theme.colors.text.secondary;
                const name = cat?.name ?? (tr ? 'Diğer' : 'Other');
                const icon = cat?.icon ?? 'circle';
                const dateLabel = dayjs(tx.date)
                  .locale(language)
                  .format(tr ? 'D MMM' : 'MMM D');
                const title =
                  (tx.note && tx.note.length > 0 ? tx.note : name) ?? name;
                return (
                  <Pressable
                    key={tx.id}
                    onPress={handleSeeAllTransactions}
                    style={({ pressed }) => [
                      styles.recentRow,
                      {
                        borderTopColor: theme.colors.border.card,
                        borderTopWidth:
                          i === 0 ? 0 : StyleSheet.hairlineWidth,
                        opacity: pressed ? 0.6 : 1,
                      },
                    ]}>
                    <View
                      style={[
                        styles.recentIcon,
                        { backgroundColor: color + '26' },
                      ]}>
                      <Icon name={icon as any} size={15} color={color} />
                    </View>
                    <View style={styles.recentMiddle}>
                      <Text
                        style={[
                          styles.recentTitle,
                          { color: theme.colors.text.primary },
                        ]}
                        numberOfLines={1}>
                        {title}
                      </Text>
                      <Text
                        style={[
                          styles.recentMeta,
                          { color: theme.colors.text.secondary },
                        ]}
                        numberOfLines={1}>
                        {name} · {dateLabel}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.recentAmount,
                        {
                          color:
                            tx.type === 'expense'
                              ? theme.colors.text.primary
                              : accent,
                        },
                      ]}
                      numberOfLines={1}>
                      {tx.type === 'expense' ? '−' : '+'}
                      {formatCurrency(tx.amount, currency, language)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Yaklaşan — compact chips */}
        {upcomingSubs.length > 0 && (
          <View style={{ marginTop: 22 }}>
            <SectionHead
              title={tr ? 'Yaklaşan' : 'Upcoming'}
              action={
                tr
                  ? `${subscriptions.filter((s) => s.isActive).length} abonelik`
                  : `${subscriptions.filter((s) => s.isActive).length} subs`
              }
              onAction={handleSeeAllSubscriptions}
            />
            <View style={styles.chipRow}>
              {upcomingSubs.map((sub) => {
                const days = daysUntil(sub.nextRenewalDate);
                const initial = sub.name
                  .trim()
                  .charAt(0)
                  .toLocaleUpperCase(tr ? 'tr-TR' : 'en-US');
                const daysLabel =
                  days === 0
                    ? tr
                      ? 'Bugün'
                      : 'Today'
                    : days === 1
                    ? tr
                      ? 'Yarın'
                      : 'Tomorrow'
                    : tr
                    ? `${days} gün`
                    : `${days}d`;
                return (
                  <Pressable
                    key={sub.id}
                    onPress={handleSeeAllSubscriptions}
                    style={({ pressed }) => [
                      styles.chip,
                      {
                        backgroundColor: theme.colors.bg.card,
                        borderColor: theme.colors.border.card,
                        opacity: pressed ? 0.6 : 1,
                      },
                    ]}>
                    <View style={styles.chipHead}>
                      <View
                        style={[
                          styles.chipMark,
                          { backgroundColor: sub.color },
                        ]}>
                        <Text style={styles.chipMarkText}>{initial}</Text>
                      </View>
                      <Text
                        style={[
                          styles.chipName,
                          { color: theme.colors.text.primary },
                        ]}
                        numberOfLines={1}>
                        {sub.name}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.chipMeta,
                        { color: theme.colors.text.secondary },
                      ]}
                      numberOfLines={1}>
                      {daysLabel} ·{' '}
                      {formatCurrency(
                        sub.amount,
                        sub.currency as SupportedCurrency,
                        language
                      )}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {__DEV__ && (
          <View style={{ marginTop: 28, gap: 8 }}>
            <Pressable
              onPress={() => {
                HapticFeedback.trigger('impactLight');
                seedDemoData();
                loadTransactions();
                loadSubscriptions();
                loadBudgets();
                Toast.show({ type: 'success', text1: 'Demo verisi yüklendi' });
              }}
              style={[
                styles.devButton,
                {
                  borderColor: theme.colors.border.card,
                  backgroundColor: theme.colors.bg.card,
                },
              ]}>
              <Text
                style={{
                  ...theme.typography.caption,
                  color: theme.colors.text.secondary,
                }}>
                DEV: {hasDemoData() ? 'Demo verisi yüklendi' : 'Demo veri yükle'}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                HapticFeedback.trigger('impactMedium');
                clearDemoData();
                loadTransactions();
                loadSubscriptions();
                loadBudgets();
                Toast.show({ type: 'info', text1: 'Tüm veriler temizlendi' });
              }}
              style={[
                styles.devButton,
                {
                  borderColor: theme.colors.border.card,
                  backgroundColor: theme.colors.bg.card,
                },
              ]}>
              <Text
                style={{
                  ...theme.typography.caption,
                  color: theme.colors.text.secondary,
                }}>
                DEV: Verileri temizle
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/* -------------------- Building blocks -------------------- */

interface ChromeButtonProps {
  iconName: string;
  onPress: () => void;
  accessibilityLabel: string;
  showDot?: boolean;
}

function ChromeButton({
  iconName,
  onPress,
  accessibilityLabel,
  showDot,
}: ChromeButtonProps) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      style={({ pressed }) => [
        styles.chromeButton,
        {
          backgroundColor: theme.colors.bg.card,
          borderColor: theme.colors.border.card,
          opacity: pressed ? 0.7 : 1,
        },
      ]}>
      <Icon
        name={iconName as any}
        size={18}
        color={theme.colors.text.secondary}
      />
      {showDot && (
        <View
          style={[
            styles.chromeDot,
            {
              backgroundColor: theme.colors.semantic.error,
              borderColor: theme.colors.bg.page,
            },
          ]}
        />
      )}
    </Pressable>
  );
}

interface MiniStatProps {
  label: string;
  value: string;
  tone: 'neutral' | 'pos';
  accent?: string;
}

function MiniStat({ label, value, tone, accent }: MiniStatProps) {
  const { theme } = useTheme();
  const color =
    tone === 'pos' && accent ? accent : theme.colors.text.primary;
  return (
    <View
      style={[
        styles.miniStat,
        {
          backgroundColor: theme.colors.bg.card,
          borderColor: theme.colors.border.card,
        },
      ]}>
      <Text
        style={[styles.miniStatLabel, { color: theme.colors.text.secondary }]}
        numberOfLines={1}>
        {label}
      </Text>
      <Text
        style={[styles.miniStatValue, { color }]}
        numberOfLines={1}
        adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

interface QuickActionProps {
  iconName: string;
  label: string;
  onPress: () => void;
}

function QuickAction({ iconName, label, onPress }: QuickActionProps) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.quickAction,
        {
          backgroundColor: theme.colors.bg.card,
          borderColor: theme.colors.border.card,
          opacity: pressed ? 0.6 : 1,
        },
      ]}>
      <Icon
        name={iconName as any}
        size={16}
        color={theme.colors.text.primary}
      />
      <Text
        style={[styles.quickActionLabel, { color: theme.colors.text.primary }]}
        numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

interface SectionHeadProps {
  title: string;
  action?: string;
  onAction?: () => void;
}

function SectionHead({ title, action, onAction }: SectionHeadProps) {
  const { theme } = useTheme();
  return (
    <View style={styles.sectionHead}>
      <Text
        style={[styles.sectionTitle, { color: theme.colors.text.primary }]}
        numberOfLines={1}>
        {title}
      </Text>
      {action ? (
        onAction ? (
          <Pressable onPress={onAction} hitSlop={6}>
            <Text
              style={[
                styles.sectionAction,
                { color: theme.colors.text.secondary },
              ]}>
              {action} →
            </Text>
          </Pressable>
        ) : (
          <Text
            style={[
              styles.sectionAction,
              { color: theme.colors.text.secondary },
            ]}>
            {action}
          </Text>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTextBlock: { flex: 1 },
  headerDate: {
    fontSize: 13,
    fontWeight: '500',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginTop: 2,
  },
  headerActions: { flexDirection: 'row', gap: 8 },
  chromeButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chromeDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  heroHint: {
    fontSize: 13,
  },
  heroBigNumber: {
    fontSize: 44,
    fontWeight: '700',
    letterSpacing: -1.2,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  heroFooterRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  heroFooterLeft: {
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  heroFooterRight: {
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  miniRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  miniStat: {
    flex: 1,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  miniStatLabel: {
    fontSize: 11,
  },
  miniStatValue: {
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    marginTop: 2,
    letterSpacing: -0.3,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  sectionAction: {
    fontSize: 12,
    fontWeight: '500',
  },
  recentCard: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  recentIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentMiddle: { flex: 1, gap: 2 },
  recentTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  recentMeta: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  recentAmount: {
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  chipHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chipMark: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipMarkText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  chipName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  chipMeta: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    marginTop: 6,
  },
  devButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
});
