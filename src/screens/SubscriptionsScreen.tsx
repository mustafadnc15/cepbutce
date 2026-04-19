import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import ReanimatedSwipeable, {
  SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/feather';
import HapticFeedback from 'react-native-haptic-feedback';
import Toast from 'react-native-toast-message';

import { useTheme } from '../theme';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';
import { useSheetStore } from '../stores/useSheetStore';
import { DEFAULT_CATEGORIES } from '../constants/categories';
import { formatCurrency } from '../utils/currency';
import {
  EmptyState,
  GroupedCard,
  HeroSlab,
  SegmentedTrack,
} from '../components/ui';
import {
  SubscriptionActionSheet,
  type SubscriptionActionSheetHandle,
} from '../components/subscriptions/SubscriptionActionSheet';
import {
  cycleLabel,
  daysUntilRenewal,
  formatUntil,
  formatUntilShort,
  groupByProximity,
  toMonthlyAmount,
} from '../utils/subscriptions';
import type { Category, Subscription } from '../types';

type SupportedCurrency = 'TRY' | 'USD' | 'EUR' | 'GBP';
type ListMode = 'active' | 'paused';
type SortKey = 'renewal' | 'amount' | 'name';

const CATEGORY_MAP = DEFAULT_CATEGORIES.reduce<Record<string, Category>>(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {}
);

function hexWithAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function SubscriptionsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const language = useSettingsStore((s) => s.language);
  const currency = useSettingsStore((s) => s.currency) as SupportedCurrency;

  const subscriptions = useSubscriptionStore((s) => s.subscriptions);
  const totalMonthly = useSubscriptionStore((s) => s.totalMonthly)();
  const totalYearly = useSubscriptionStore((s) => s.totalYearly)();

  const openAddSubscription = useSheetStore((s) => s.openAddSubscription);
  const openEditSubscription = useSheetStore((s) => s.openEditSubscription);

  const actionSheetRef = useRef<SubscriptionActionSheetHandle>(null);

  const [mode, setMode] = useState<ListMode>('active');
  const [sortKey, setSortKey] = useState<SortKey>('renewal');

  const tr = language === 'tr';

  const active = useMemo(() => subscriptions.filter((s) => s.isActive), [subscriptions]);
  const paused = useMemo(() => subscriptions.filter((s) => !s.isActive), [subscriptions]);

  const upcoming = useMemo(
    () => active.slice().sort((a, b) => daysUntilRenewal(a.nextRenewalDate) - daysUntilRenewal(b.nextRenewalDate)),
    [active]
  );

  const annotations = useMemo(() => {
    const marks = new Map<number, number>();
    for (const s of active) {
      const d = daysUntilRenewal(s.nextRenewalDate);
      if (d >= 0 && d < 30) marks.set(d, (marks.get(d) ?? 0) + 1);
    }
    return Array.from(marks.entries()).map(([index, count]) => ({ index, count }));
  }, [active]);

  const listSource = mode === 'active' ? active.slice() : paused.slice();
  const sortedList = useMemo(() => {
    const list = listSource.slice();
    if (sortKey === 'renewal') {
      list.sort((a, b) => a.nextRenewalDate.localeCompare(b.nextRenewalDate));
    } else if (sortKey === 'amount') {
      list.sort((a, b) => toMonthlyAmount(b) - toMonthlyAmount(a));
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name, tr ? 'tr-TR' : 'en-US'));
    }
    return list;
    // listSource identity recomputes each render, which is cheap — subs list is short.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptions, mode, sortKey]);

  const groups = useMemo(() => {
    if (mode === 'paused') {
      return [
        {
          key: 'paused' as const,
          label: tr ? 'Duraklatılmış' : 'Paused',
          items: sortedList,
        },
      ];
    }
    return groupByProximity(sortedList, language).filter((g) => g.items.length > 0);
  }, [sortedList, mode, language, tr]);

  const handleListPress = useCallback(
    (sub: Subscription) => {
      openEditSubscription(sub);
    },
    [openEditSubscription]
  );

  const handleListOptions = useCallback((sub: Subscription) => {
    actionSheetRef.current?.present(sub);
  }, []);

  const handleEditFromActionSheet = useCallback(
    (sub: Subscription) => {
      openEditSubscription(sub);
    },
    [openEditSubscription]
  );

  const handleSortPress = () => {
    HapticFeedback.trigger('impactLight');
    Alert.alert(
      tr ? 'Sırala' : 'Sort by',
      undefined,
      [
        {
          text: tr ? 'Yenileme tarihi' : 'Renewal date',
          onPress: () => setSortKey('renewal'),
        },
        {
          text: tr ? 'Aylık tutar' : 'Monthly amount',
          onPress: () => setSortKey('amount'),
        },
        { text: tr ? 'İsim' : 'Name', onPress: () => setSortKey('name') },
        { text: tr ? 'Vazgeç' : 'Cancel', style: 'cancel' },
      ]
    );
  };

  const heroAccent = theme.colors.brand.primary;
  const hero = theme.colors.hero;

  const yearlyTotal = totalYearly;
  const weeklyApprox = totalMonthly / 4.33;

  const next = upcoming[0];
  const nextDays = next ? daysUntilRenewal(next.nextRenewalDate) : 0;

  const pageHeaderEyebrow = tr
    ? `${active.length} AKTİF · ${paused.length} DURAKLATILMIŞ`
    : `${active.length} ACTIVE · ${paused.length} PAUSED`;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg.page }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 40,
        }}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerTextBlock}>
            <Text
              style={[styles.headerEyebrow, { color: theme.colors.text.secondary }]}
              numberOfLines={1}>
              {pageHeaderEyebrow}
            </Text>
            <Text
              style={[styles.pageTitle, { color: theme.colors.text.primary }]}
              numberOfLines={1}>
              {tr ? 'Abonelikler' : 'Subscriptions'}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <HeaderChrome
              iconName="search"
              onPress={() => {
                HapticFeedback.trigger('impactLight');
                Toast.show({
                  type: 'info',
                  text1: tr ? 'Arama' : 'Search',
                  text2: tr ? 'Yakında' : 'Coming soon',
                });
              }}
              accessibilityLabel={tr ? 'Ara' : 'Search'}
            />
            <HeaderChrome
              iconName="plus"
              onPress={() => {
                HapticFeedback.trigger('impactLight');
                openAddSubscription();
              }}
              accessibilityLabel={tr ? 'Abonelik ekle' : 'Add subscription'}
            />
          </View>
        </View>

        {/* Hero */}
        <View style={{ marginTop: 16, paddingHorizontal: 20 }}>
          <HeroSlab
            eyebrow={tr ? 'AYLIK YÜKÜNÜZ' : 'MONTHLY LOAD'}
            accent={heroAccent}
            footer={
              next ? (
                <NextUpRow
                  sub={next}
                  daysUntil={nextDays}
                  language={language}
                  currency={currency}
                />
              ) : undefined
            }>
            <View style={styles.heroBigRow}>
              <Text
                style={[styles.heroBigNumber, { color: hero.fg }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                accessibilityRole="header"
                accessibilityLabel={
                  tr
                    ? `Aylık abonelik yükün ${formatCurrency(totalMonthly, currency, language)}`
                    : `Monthly subscription load ${formatCurrency(totalMonthly, currency, language)}`
                }>
                {formatCurrency(totalMonthly, currency, language)}
              </Text>
              <Text
                style={[styles.heroBigSecondary, { color: hero.fgMuted }]}
                numberOfLines={1}>
                {tr ? '/ay' : '/mo'}
              </Text>
            </View>
            <Text
              style={[styles.heroSubline, { color: hero.fgMuted }]}
              numberOfLines={1}>
              {tr
                ? `Yıllık: ${formatCurrency(yearlyTotal, currency, language)} · Haftada ~${formatCurrency(weeklyApprox, currency, language)}`
                : `Yearly: ${formatCurrency(yearlyTotal, currency, language)} · ~${formatCurrency(weeklyApprox, currency, language)}/wk`}
            </Text>

            <View style={{ marginTop: 18 }}>
              <SegmentedTrack
                segments={30}
                values={new Array(30).fill(0)}
                today={0}
                accent={heroAccent}
                mode="renewal"
                annotations={annotations}
                height={36}
                a11yLabel={
                  tr
                    ? `30 günlük yenileme zaman çizelgesi, ${annotations.length} yenileme var`
                    : `30-day renewal timeline with ${annotations.length} renewals`
                }
              />
              <View style={styles.axisRow}>
                <Text style={[styles.axisLabel, { color: hero.fgDim }]}>
                  {tr ? 'BUGÜN' : 'TODAY'}
                </Text>
                <Text style={[styles.axisLabel, { color: hero.fgDim }]}>+15{tr ? 'g' : 'd'}</Text>
                <Text style={[styles.axisLabel, { color: hero.fgDim }]}>+30{tr ? 'g' : 'd'}</Text>
              </View>
            </View>
          </HeroSlab>
        </View>

        {/* Dağılım */}
        {active.length > 0 && (
          <View style={{ marginTop: 22, paddingHorizontal: 20 }}>
            <View style={styles.distributionHeader}>
              <Text
                style={[
                  styles.distributionEyebrow,
                  { color: theme.colors.text.secondary },
                ]}>
                {tr ? 'DAĞILIM' : 'BREAKDOWN'}
              </Text>
              <Text
                style={[
                  styles.distributionMeta,
                  { color: theme.colors.text.secondary },
                ]}>
                {tr ? 'aylık' : 'monthly'}
              </Text>
            </View>
            <CategoryStrip active={active} language={language} currency={currency} />
          </View>
        )}

        {/* Mode toggle + Sort trigger */}
        {subscriptions.length > 0 && (
          <View style={styles.modeRow}>
            <Pill
              label={
                tr
                  ? `Aktif · ${active.length}`
                  : `Active · ${active.length}`
              }
              active={mode === 'active'}
              onPress={() => {
                HapticFeedback.trigger('impactLight');
                setMode('active');
              }}
            />
            <Pill
              label={
                tr
                  ? `Duraklatılmış · ${paused.length}`
                  : `Paused · ${paused.length}`
              }
              active={mode === 'paused'}
              onPress={() => {
                HapticFeedback.trigger('impactLight');
                setMode('paused');
              }}
            />
            <View style={{ flex: 1 }} />
            <Pressable
              onPress={handleSortPress}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.sortTrigger,
                {
                  borderColor: theme.colors.border.card,
                  backgroundColor: theme.colors.bg.card,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}>
              <Icon name="sliders" size={13} color={theme.colors.text.secondary} />
              <Text
                style={[
                  styles.sortTriggerLabel,
                  { color: theme.colors.text.secondary },
                ]}>
                {tr ? 'Sırala' : 'Sort'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Grouped list */}
        {subscriptions.length === 0 ? (
          <View style={{ marginTop: 24, paddingHorizontal: 20 }}>
            <EmptyState
              icon="repeat"
              title={tr ? 'Henüz abonelik yok' : 'No subscriptions yet'}
              subtitle={
                tr
                  ? 'Netflix, Spotify gibi tekrarlayan ödemelerini takip et.'
                  : 'Track recurring payments like Netflix and Spotify.'
              }
              actionLabel={tr ? 'İlk Aboneliği Ekle' : 'Add First Subscription'}
              onAction={openAddSubscription}
            />
          </View>
        ) : sortedList.length === 0 ? (
          <View style={{ marginTop: 24, paddingHorizontal: 20 }}>
            <Text
              style={[styles.emptyGroup, { color: theme.colors.text.secondary }]}>
              {mode === 'active'
                ? tr
                  ? 'Aktif abonelik yok.'
                  : 'No active subscriptions.'
                : tr
                ? 'Duraklatılmış abonelik yok.'
                : 'No paused subscriptions.'}
            </Text>
          </View>
        ) : (
          <View style={{ marginTop: 12, paddingHorizontal: 20 }}>
            {groups.map((g) => {
              const monthlySubtotal = g.items.reduce((sum, s) => sum + toMonthlyAmount(s), 0);
              return (
                <View key={g.key} style={{ marginTop: 14 }}>
                  <GroupedCard
                    header={{
                      label: g.label,
                      rightText: `${formatCurrency(monthlySubtotal, currency, language)}/${tr ? 'ay' : 'mo'}`,
                    }}>
                    {g.items.map((sub) => (
                      <FocusSubscriptionRow
                        key={sub.id}
                        sub={sub}
                        onPress={handleListPress}
                        onOptions={handleListOptions}
                        language={language}
                        currency={currency}
                      />
                    ))}
                  </GroupedCard>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <SubscriptionActionSheet ref={actionSheetRef} onEdit={handleEditFromActionSheet} />
    </View>
  );
}

/* -------------------- Header chrome -------------------- */

interface HeaderChromeProps {
  iconName: string;
  onPress: () => void;
  accessibilityLabel: string;
}

function HeaderChrome({ iconName, onPress, accessibilityLabel }: HeaderChromeProps) {
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
      <Icon name={iconName as any} size={18} color={theme.colors.text.secondary} />
    </Pressable>
  );
}

/* -------------------- Next-up inset row (hero footer) -------------------- */

interface NextUpRowProps {
  sub: Subscription;
  daysUntil: number;
  language: 'tr' | 'en';
  currency: SupportedCurrency;
}

function NextUpRow({ sub, daysUntil, language, currency }: NextUpRowProps) {
  const { theme } = useTheme();
  const hero = theme.colors.hero;
  const urgent = daysUntil <= 3;
  const initial = sub.name.trim().charAt(0).toLocaleUpperCase(
    language === 'tr' ? 'tr-TR' : 'en-US'
  );
  return (
    <View
      style={[
        styles.nextRow,
        { backgroundColor: hero.surface, borderColor: hero.surfaceBorder },
      ]}>
      <View style={[styles.nextMark, { backgroundColor: sub.color }]}>
        <Text style={styles.nextMarkText}>{initial}</Text>
      </View>
      <View style={styles.nextMiddle}>
        <Text style={[styles.nextTitle, { color: hero.fg }]} numberOfLines={1}>
          {language === 'tr' ? `${sub.name} yenileniyor` : `${sub.name} renews`}
        </Text>
        <Text style={[styles.nextSubtitle, { color: hero.fgMuted }]} numberOfLines={1}>
          {formatUntil(daysUntil, language)} · {formatCurrency(sub.amount, currency, language)}
        </Text>
      </View>
      <View
        style={[
          styles.nextBadge,
          {
            backgroundColor: urgent ? '#FF6B6B' : hero.surface,
            borderColor: urgent ? '#FF6B6B' : hero.surfaceBorder,
          },
        ]}>
        <Text style={[styles.nextBadgeText, { color: hero.fg }]}>
          {formatUntilShort(daysUntil, language)}
        </Text>
      </View>
    </View>
  );
}

/* -------------------- Category distribution strip -------------------- */

interface CategoryStripProps {
  active: Subscription[];
  language: 'tr' | 'en';
  currency: SupportedCurrency;
}

function CategoryStrip({ active, language, currency }: CategoryStripProps) {
  const { theme } = useTheme();
  const { ordered, total } = useMemo(() => {
    const byCat = new Map<string, number>();
    for (const s of active) {
      const key = s.categoryId;
      byCat.set(key, (byCat.get(key) ?? 0) + toMonthlyAmount(s));
    }
    const t = Array.from(byCat.values()).reduce((a, v) => a + v, 0) || 1;
    const entries = Array.from(byCat.entries())
      .map(([id, amt]) => ({ id, amt, pct: amt / t }))
      .sort((a, b) => b.amt - a.amt);
    return { ordered: entries, total: t };
  }, [active]);

  if (total <= 0 || ordered.length === 0) return null;

  return (
    <View>
      <View
        style={[
          styles.stripBar,
          { backgroundColor: theme.colors.border.card },
        ]}>
        {ordered.map((o, i) => {
          const cat = CATEGORY_MAP[o.id];
          const color = cat?.color ?? '#888';
          return (
            <View
              key={o.id}
              style={{
                width: `${o.pct * 100}%`,
                backgroundColor: color,
                marginLeft: i === 0 ? 0 : 2,
              }}
            />
          );
        })}
      </View>
      <View style={styles.stripLegend}>
        {ordered.slice(0, 4).map((o) => {
          const cat = CATEGORY_MAP[o.id];
          const color = cat?.color ?? '#888';
          const name = cat?.name ?? (language === 'tr' ? 'Diğer' : 'Other');
          return (
            <View key={o.id} style={styles.stripLegendItem}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  backgroundColor: color,
                }}
              />
              <Text
                style={[
                  styles.stripLegendName,
                  { color: theme.colors.text.secondary },
                ]}
                numberOfLines={1}>
                {name}
              </Text>
              <Text
                style={[
                  styles.stripLegendAmount,
                  { color: theme.colors.text.placeholder },
                ]}
                numberOfLines={1}>
                {formatCurrency(o.amt, currency, language)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/* -------------------- Pill -------------------- */

interface PillProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function Pill({ label, active, onPress }: PillProps) {
  const { theme } = useTheme();
  const progress = useSharedValue(active ? 1 : 0);

  React.useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, { duration: 160 });
  }, [active, progress]);

  const activeBg = theme.colors.text.primary;
  const activeFg = theme.isDark ? theme.colors.bg.page : '#FFFFFF';

  const animatedContainer = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [theme.colors.bg.page, activeBg]
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [theme.colors.border.card, activeBg]
    ),
  }));

  const animatedText = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1],
      [theme.colors.text.secondary, activeFg]
    ),
  }));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}>
      <Animated.View style={[styles.pill, animatedContainer]}>
        <Animated.Text style={[styles.pillLabel, animatedText]}>{label}</Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

/* -------------------- Subscription row (swipeable) -------------------- */

interface FocusSubscriptionRowProps {
  sub: Subscription;
  onPress: (sub: Subscription) => void;
  onOptions: (sub: Subscription) => void;
  language: 'tr' | 'en';
  currency: SupportedCurrency;
}

const FocusSubscriptionRow = memo(function FocusSubscriptionRow({
  sub,
  onPress,
  onOptions,
  language,
  currency,
}: FocusSubscriptionRowProps) {
  const { theme } = useTheme();
  const swipeRef = useRef<SwipeableMethods>(null);

  const initial = sub.name.trim().charAt(0).toLocaleUpperCase(
    language === 'tr' ? 'tr-TR' : 'en-US'
  );
  const daysUntil = daysUntilRenewal(sub.nextRenewalDate);
  const subtitle = sub.isActive
    ? `${cycleLabel(sub.billingCycle, language)} · ${formatUntil(daysUntil, language)}`
    : cycleLabel(sub.billingCycle, language);
  const monthly = toMonthlyAmount(sub);

  const openOptions = useCallback(() => {
    HapticFeedback.trigger('impactMedium');
    swipeRef.current?.close();
    onOptions(sub);
  }, [onOptions, sub]);

  const renderRightActions = useCallback(
    (progress: SharedValue<number>) => (
      <OptionsAction
        progress={progress}
        onPress={openOptions}
        color={theme.colors.brand.primary}
      />
    ),
    [openOptions, theme.colors.brand.primary]
  );

  const handlePress = useCallback(() => {
    HapticFeedback.trigger('impactLight');
    onPress(sub);
  }, [onPress, sub]);

  return (
    <ReanimatedSwipeable
      ref={swipeRef}
      friction={2}
      rightThreshold={50}
      renderRightActions={renderRightActions}
      onSwipeableWillOpen={openOptions}
      overshootRight={false}
      containerStyle={{ backgroundColor: theme.colors.bg.card }}>
      <Pressable onPress={handlePress} style={styles.subPressable}>
        {({ pressed }) => (
          <View
            style={[
              styles.subRow,
              {
                backgroundColor: theme.colors.bg.card,
                opacity: sub.isActive ? (pressed ? 0.65 : 1) : 0.55,
              },
            ]}>
            <View style={[styles.subMark, { backgroundColor: sub.color }]}>
              <Text style={styles.subMarkText}>{initial}</Text>
            </View>
            <View style={styles.subMiddle}>
              <Text
                style={[styles.subName, { color: theme.colors.text.primary }]}
                numberOfLines={1}>
                {sub.name}
              </Text>
              <Text
                style={[styles.subSubtitle, { color: theme.colors.text.secondary }]}
                numberOfLines={1}>
                {subtitle}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text
                style={[styles.subBilled, { color: theme.colors.text.primary }]}
                numberOfLines={1}>
                {formatCurrency(sub.amount, currency, language)}
              </Text>
              {sub.billingCycle !== 'monthly' && (
                <Text
                  style={[styles.subMonthly, { color: theme.colors.text.placeholder }]}
                  numberOfLines={1}>
                  {formatCurrency(monthly, currency, language)}/{language === 'tr' ? 'ay' : 'mo'}
                </Text>
              )}
            </View>
          </View>
        )}
      </Pressable>
    </ReanimatedSwipeable>
  );
});

interface OptionsActionProps {
  progress: SharedValue<number>;
  color: string;
  onPress: () => void;
}

function OptionsAction({ progress, color, onPress }: OptionsActionProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: Math.min(1, progress.value) }],
    opacity: Math.min(1, progress.value),
  }));
  return (
    <View style={[styles.actionWrap, { backgroundColor: color }]}>
      <Pressable onPress={onPress} style={styles.actionPress}>
        <Animated.View style={animatedStyle}>
          <Icon name="more-horizontal" size={22} color="#FFFFFF" />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 12,
  },
  headerTextBlock: { flex: 1 },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
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
  heroBigRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    flexWrap: 'wrap',
  },
  heroBigNumber: {
    fontSize: 38,
    fontWeight: '700',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  heroBigSecondary: {
    fontSize: 12,
  },
  heroSubline: {
    fontSize: 12,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  axisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  axisLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  nextMark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextMarkText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  nextMiddle: {
    flex: 1,
    gap: 2,
  },
  nextTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  nextSubtitle: {
    fontSize: 11,
  },
  nextBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 9999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  nextBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  distributionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  distributionEyebrow: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  distributionMeta: {
    fontSize: 11,
  },
  stripBar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  stripLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    rowGap: 8,
    marginTop: 10,
  },
  stripLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stripLegendName: {
    fontSize: 11,
  },
  stripLegendAmount: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    marginTop: 18,
  },
  sortTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sortTriggerLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9999,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  subPressable: {
    alignSelf: 'stretch',
    width: '100%',
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 60,
    width: '100%',
  },
  subMark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subMarkText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subMiddle: {
    flex: 1,
    gap: 2,
  },
  subName: {
    fontSize: 14,
    fontWeight: '500',
  },
  subSubtitle: {
    fontSize: 11,
  },
  subBilled: {
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  subMonthly: {
    fontSize: 10,
    marginTop: 1,
    fontVariant: ['tabular-nums'],
  },
  actionWrap: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPress: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyGroup: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 28,
  },
});
