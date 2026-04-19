import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
  SharedValue,
} from 'react-native-reanimated';
import ReanimatedSwipeable, {
  SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import 'dayjs/locale/en';
import HapticFeedback from 'react-native-haptic-feedback';
import Toast from 'react-native-toast-message';
import Icon from '@react-native-vector-icons/feather';

import { useTheme } from '../theme';
import {
  EmptyState,
  GroupedCard,
  HeroSlab,
  SegmentedTrack,
} from '../components/ui';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useSheetStore } from '../stores/useSheetStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { DEFAULT_CATEGORIES } from '../constants/categories';
import { formatCurrency } from '../utils/currency';
import {
  computeRange,
  type DateRange,
  type DateRangePreset,
} from '../components/transactions/DateRangeSelector';
import type { Category, Transaction } from '../types';

type TypeFilter = 'all' | 'expense' | 'income';
type ScrubberKey = 'thisWeek' | 'thisMonth' | 'last3Months' | 'thisYear';
type SupportedCurrency = 'TRY' | 'USD' | 'EUR' | 'GBP';

interface DayGroup {
  id: string;
  label: string;
  dayTotal: number;
  txs: Transaction[];
}

const PAGE_SIZE = 50;

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

function hexWithAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function TransactionsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const language = useSettingsStore((s) => s.language);
  const currency = useSettingsStore((s) => s.currency) as SupportedCurrency;

  const transactions = useTransactionStore((s) => s.transactions);
  const deleteTransaction = useTransactionStore((s) => s.deleteTransaction);
  const dailySpendSelector = useTransactionStore((s) => s.dailySpendForMonth);
  const openEdit = useSheetStore((s) => s.openEditTransaction);
  const openAdd = useSheetStore((s) => s.openAddTransaction);

  const [searchInput] = useState('');
  const searchQuery = useDebouncedValue(searchInput, 300);

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [scrubber, setScrubber] = useState<ScrubberKey>('thisMonth');
  const [range, setRange] = useState<DateRange>(() => computeRange('thisMonth'));

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);

  const tr = language === 'tr';

  const categoryMap = useMemo(() => {
    const m = new Map<string, Category>();
    for (const c of DEFAULT_CATEGORIES) m.set(c.id, c);
    return m;
  }, []);

  // Hero metrics are fixed to the current calendar month (matches prototype).
  // The scrubber below filters the list, not the hero summary.
  const heroMetrics = useMemo(() => {
    const now = dayjs();
    const daysInMonth = now.daysInMonth();
    const todayIdx = Math.min(now.date() - 1, daysInMonth - 1);
    const startOfMonth = now.startOf('month').toISOString();
    const endOfMonth = now.endOf('month').toISOString();

    let expense = 0;
    let income = 0;
    for (const t of transactions) {
      if (t.date < startOfMonth || t.date > endOfMonth) continue;
      if (t.type === 'expense') expense += t.amount;
      else income += t.amount;
    }

    const daysElapsed = todayIdx + 1;
    const dailyAvg = daysElapsed > 0 ? expense / daysElapsed : 0;
    const dailySpend = dailySpendSelector(now.toDate());

    return {
      daysInMonth,
      todayIdx,
      daysElapsed,
      expense,
      income,
      net: income - expense,
      dailyAvg,
      dailySpend,
    };
  }, [transactions, dailySpendSelector]);

  const rangeFiltered = useMemo(() => {
    if (!range.start || !range.end) return transactions;
    const s = range.start.getTime();
    const e = range.end.getTime();
    return transactions.filter((t) => {
      const ts = new Date(t.date).getTime();
      return ts >= s && ts <= e;
    });
  }, [transactions, range]);

  const typeFiltered = useMemo(() => {
    if (typeFilter === 'all') return rangeFiltered;
    return rangeFiltered.filter((t) => t.type === typeFilter);
  }, [rangeFiltered, typeFilter]);

  const categoryFiltered = useMemo(() => {
    if (!categoryFilter) return typeFiltered;
    return typeFiltered.filter((t) => t.categoryId === categoryFilter);
  }, [typeFiltered, categoryFilter]);

  const searchFiltered = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return categoryFiltered;
    const needle = q.toLocaleLowerCase(tr ? 'tr-TR' : 'en-US');
    return categoryFiltered.filter((t) => {
      const note = (t.note ?? '').toLocaleLowerCase(tr ? 'tr-TR' : 'en-US');
      const catName = (categoryMap.get(t.categoryId)?.name ?? '').toLocaleLowerCase(
        tr ? 'tr-TR' : 'en-US'
      );
      return note.includes(needle) || catName.includes(needle);
    });
  }, [categoryFiltered, searchQuery, categoryMap, tr]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, typeFilter, categoryFilter, range]);

  const availableCategories = useMemo(() => {
    const ids = new Set<string>();
    for (const t of rangeFiltered) ids.add(t.categoryId);
    return DEFAULT_CATEGORIES.filter((c) => ids.has(c.id));
  }, [rangeFiltered]);

  const groups = useMemo<DayGroup[]>(() => {
    const visible = searchFiltered.slice(0, visibleCount);
    const byDay = new Map<string, DayGroup>();
    for (const t of visible) {
      const dayKey = dayjs(t.date).format('YYYY-MM-DD');
      let g = byDay.get(dayKey);
      if (!g) {
        const d = dayjs(t.date).locale(language);
        const label = formatDayHeader(d, language);
        g = { id: dayKey, label, dayTotal: 0, txs: [] };
        byDay.set(dayKey, g);
      }
      g.txs.push(t);
      if (t.type === 'expense') g.dayTotal += t.amount;
      else g.dayTotal -= t.amount;
    }
    return Array.from(byDay.values());
  }, [searchFiltered, visibleCount, language]);

  const hasMore = visibleCount < searchFiltered.length;

  const handleEndReached = useCallback(() => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((c) => c + PAGE_SIZE);
      setLoadingMore(false);
    }, 120);
  }, [hasMore, loadingMore]);

  const handleRowPress = useCallback(
    (tx: Transaction) => {
      openEdit(tx);
    },
    [openEdit]
  );

  const handleRowDelete = useCallback(
    (tx: Transaction) => {
      deleteTransaction(tx.id);
      HapticFeedback.trigger('notificationSuccess');
      Toast.show({
        type: 'success',
        text1: tr ? 'İşlem silindi' : 'Transaction deleted',
      });
    },
    [deleteTransaction, tr]
  );

  const handleScrubberChange = (key: ScrubberKey) => {
    HapticFeedback.trigger('selection');
    setScrubber(key);
    setRange(computeRange(key as DateRangePreset));
  };

  const handleTypeFilterChange = (key: TypeFilter) => {
    HapticFeedback.trigger('impactLight');
    setTypeFilter(key);
  };

  const handleCategoryPillPress = (id: string) => {
    HapticFeedback.trigger('impactLight');
    setCategoryFilter((prev) => (prev === id ? null : id));
  };

  const handleCategoryDropdownPress = () => {
    HapticFeedback.trigger('impactLight');
    setCategoryOpen((o) => !o);
    if (categoryFilter && !categoryOpen) {
      // Opening back up — leave the existing selection active.
    }
  };

  const handleOpenAdd = () => {
    HapticFeedback.trigger('impactLight');
    openAdd();
  };

  const heroAccent = theme.colors.brand.primary;
  const hero = theme.colors.hero;

  const monthLabel = dayjs().locale(language).format('MMMM YYYY');
  const pageHeaderEyebrow = monthLabel.toLocaleUpperCase();

  const heroEyebrow = tr
    ? `Bu ay · ${heroMetrics.daysElapsed}/${heroMetrics.daysInMonth} gün`
    : `This month · ${heroMetrics.daysElapsed}/${heroMetrics.daysInMonth} days`;

  const activeCategory = categoryFilter ? categoryMap.get(categoryFilter) : undefined;

  const isEmpty = transactions.length === 0;
  const showEmptyFilterResults = !isEmpty && searchFiltered.length === 0;

  const renderGroup = useCallback(
    ({ item }: { item: DayGroup }) => {
      const totalLabel =
        item.dayTotal > 0
          ? `−${formatCurrency(item.dayTotal, currency, language)}`
          : item.dayTotal < 0
          ? `+${formatCurrency(-item.dayTotal, currency, language)}`
          : '—';
      return (
        <View style={styles.groupWrap}>
          <GroupedCard header={{ label: item.label, rightText: totalLabel }}>
            {item.txs.map((tx) => (
              <FocusTransactionRow
                key={tx.id}
                tx={tx}
                category={categoryMap.get(tx.categoryId)}
                onPress={handleRowPress}
                onDelete={handleRowDelete}
                language={language}
                currency={currency}
              />
            ))}
          </GroupedCard>
        </View>
      );
    },
    [categoryMap, handleRowPress, handleRowDelete, language, currency]
  );

  const keyExtractor = useCallback((item: DayGroup) => item.id, []);

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: theme.colors.bg.page, paddingTop: insets.top + 8 },
      ]}>
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
            {tr ? 'İşlemler' : 'Transactions'}
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
            onPress={handleOpenAdd}
            accessibilityLabel={tr ? 'İşlem ekle' : 'Add transaction'}
          />
        </View>
      </View>

      {/* Hero */}
      <View style={{ marginTop: 16, paddingHorizontal: 20 }}>
        <HeroSlab eyebrow={heroEyebrow} accent={heroAccent}>
          <View style={styles.heroBigRow}>
            <Text
              style={[styles.heroBigNumber, { color: hero.fg }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              accessibilityRole="header"
              accessibilityLabel={
                tr
                  ? `Bu ay ${formatCurrency(heroMetrics.expense, currency, language)} harcandı, günlük ortalama ${formatCurrency(heroMetrics.dailyAvg, currency, language)}`
                  : `Spent ${formatCurrency(heroMetrics.expense, currency, language)} this month, average ${formatCurrency(heroMetrics.dailyAvg, currency, language)} per day`
              }>
              {formatCurrency(heroMetrics.expense, currency, language)}
            </Text>
            <Text
              style={[styles.heroBigSecondary, { color: hero.fgMuted }]}
              numberOfLines={2}>
              {tr
                ? `harcama · ${formatCurrency(heroMetrics.dailyAvg, currency, language)}/gün`
                : `spent · ${formatCurrency(heroMetrics.dailyAvg, currency, language)}/day`}
            </Text>
          </View>

          <View style={{ marginTop: 18 }}>
            <SegmentedTrack
              segments={heroMetrics.daysInMonth}
              values={heroMetrics.dailySpend}
              today={heroMetrics.todayIdx}
              accent={heroAccent}
              mode="rhythm"
              height={48}
            />
          </View>

          <View style={styles.legendRow}>
            <HeroLegend
              label={tr ? 'Gelir' : 'Income'}
              value={`+${formatCurrency(heroMetrics.income, currency, language)}`}
              valueColor={heroAccent}
            />
            <HeroLegend
              label={tr ? 'Gider' : 'Expense'}
              value={`−${formatCurrency(heroMetrics.expense, currency, language)}`}
              valueColor="#FF6B6B"
            />
            <HeroLegend
              label="Net"
              value={`${heroMetrics.net >= 0 ? '+' : '−'}${formatCurrency(Math.abs(heroMetrics.net), currency, language)}`}
              valueColor={hero.fg}
            />
          </View>
        </HeroSlab>
      </View>

      {/* Range scrubber */}
      <View style={styles.scrubberWrap}>
        <RangeScrubber value={scrubber} onChange={handleScrubberChange} language={language} />
      </View>

      {/* Type filter + Kategori dropdown trigger */}
      <View style={styles.filterRow}>
        <Pill
          label={tr ? 'Tümü' : 'All'}
          active={typeFilter === 'all'}
          onPress={() => handleTypeFilterChange('all')}
        />
        <Pill
          label={tr ? 'Harcama' : 'Expense'}
          active={typeFilter === 'expense'}
          onPress={() => handleTypeFilterChange('expense')}
        />
        <Pill
          label={tr ? 'Gelir' : 'Income'}
          active={typeFilter === 'income'}
          onPress={() => handleTypeFilterChange('income')}
        />
        <View style={{ flex: 1 }} />
        <CategoryDropdownTrigger
          activeCategory={activeCategory}
          open={categoryOpen || !!activeCategory}
          onPress={handleCategoryDropdownPress}
          onClear={() => {
            HapticFeedback.trigger('impactLight');
            setCategoryFilter(null);
            setCategoryOpen(false);
          }}
          language={language}
        />
      </View>

      {/* Inline category chip row (expands when dropdown open) */}
      {(categoryOpen || !!activeCategory) && availableCategories.length > 0 && (
        <View style={styles.categoryPickerRow}>
          {availableCategories.map((c) => (
            <Pill
              key={c.id}
              label={c.name}
              active={categoryFilter === c.id}
              onPress={() => handleCategoryPillPress(c.id)}
              accentColor={c.color}
            />
          ))}
        </View>
      )}

      {/* List */}
      {isEmpty ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="credit-card"
            title={tr ? 'Harcamalarınızı takip etmeye başlayın!' : 'Start tracking your spending!'}
            actionLabel={tr ? 'İlk İşlemi Ekle' : 'Add First Transaction'}
            onAction={handleOpenAdd}
          />
        </View>
      ) : showEmptyFilterResults ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="search"
            title={tr ? 'İşlem bulunamadı' : 'No transactions found'}
            subtitle={tr ? 'Filtrelerinizi değiştirmeyi deneyin' : 'Try adjusting your filters'}
          />
        </View>
      ) : (
        <FlashList
          data={groups}
          renderItem={renderGroup}
          keyExtractor={keyExtractor}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 40,
          }}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footer}>
                <ActivityIndicator color={theme.colors.brand.primary} />
              </View>
            ) : hasMore ? null : (
              <View style={{ height: 20 }} />
            )
          }
        />
      )}
    </View>
  );
}

/* -------------------- day header helper -------------------- */

function formatDayHeader(d: dayjs.Dayjs, lang: 'tr' | 'en'): string {
  const today = dayjs().startOf('day');
  const yday = today.subtract(1, 'day');
  if (d.isSame(today, 'day')) {
    return lang === 'tr' ? `Bugün · ${d.locale('tr').format('dddd D MMM')}` : `Today · ${d.locale('en').format('ddd D MMM')}`;
  }
  if (d.isSame(yday, 'day')) {
    return lang === 'tr' ? `Dün · ${d.locale('tr').format('dddd D MMM')}` : `Yesterday · ${d.locale('en').format('ddd D MMM')}`;
  }
  return d.locale(lang).format(lang === 'tr' ? 'ddd D MMM' : 'ddd D MMM');
}

/* -------------------- Header chrome button -------------------- */

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

/* -------------------- Range scrubber (4-segment pill) -------------------- */

interface RangeScrubberProps {
  value: ScrubberKey;
  onChange: (key: ScrubberKey) => void;
  language: 'tr' | 'en';
}

function RangeScrubber({ value, onChange, language }: RangeScrubberProps) {
  const { theme } = useTheme();
  const options: { k: ScrubberKey; l: string }[] = [
    { k: 'thisWeek', l: language === 'tr' ? 'Hafta' : 'Week' },
    { k: 'thisMonth', l: language === 'tr' ? 'Ay' : 'Month' },
    { k: 'last3Months', l: language === 'tr' ? '3 Ay' : '3M' },
    { k: 'thisYear', l: language === 'tr' ? 'Yıl' : 'Year' },
  ];

  return (
    <View
      style={[
        styles.scrubber,
        {
          backgroundColor: theme.isDark ? theme.colors.bg.page : theme.colors.border.card,
          borderColor: theme.colors.border.card,
        },
      ]}>
      {options.map((opt) => {
        const on = value === opt.k;
        return (
          <Pressable
            key={opt.k}
            onPress={() => onChange(opt.k)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[
              styles.scrubberSegment,
              on && {
                backgroundColor: theme.colors.bg.card,
                ...theme.shadows.card,
              },
            ]}>
            <Text
              style={[
                styles.scrubberLabel,
                { color: on ? theme.colors.text.primary : theme.colors.text.secondary },
              ]}>
              {opt.l}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* -------------------- Pill (type filter / category) -------------------- */

interface PillProps {
  label: string;
  active: boolean;
  onPress: () => void;
  accentColor?: string;
}

function Pill({ label, active, onPress, accentColor }: PillProps) {
  const { theme } = useTheme();
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, { duration: 160 });
  }, [active, progress]);

  const activeBg = accentColor ?? theme.colors.text.primary;
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

/* -------------------- Category dropdown trigger -------------------- */

interface CategoryDropdownTriggerProps {
  activeCategory?: Category;
  open: boolean;
  onPress: () => void;
  onClear: () => void;
  language: 'tr' | 'en';
}

function CategoryDropdownTrigger({
  activeCategory,
  open,
  onPress,
  onClear,
  language,
}: CategoryDropdownTriggerProps) {
  const { theme } = useTheme();
  const label = activeCategory
    ? activeCategory.name
    : language === 'tr'
    ? 'Kategori'
    : 'Category';
  const hasActive = !!activeCategory;
  return (
    <Pressable
      onPress={hasActive ? onClear : onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.categoryTrigger,
        {
          backgroundColor: hasActive
            ? hexWithAlpha(activeCategory!.color, 0.14)
            : 'transparent',
          borderColor: hasActive
            ? activeCategory!.color
            : theme.colors.border.card,
          opacity: pressed ? 0.7 : 1,
        },
      ]}>
      <Icon
        name={hasActive ? 'x' : open ? 'chevron-up' : 'chevron-down'}
        size={12}
        color={hasActive ? activeCategory!.color : theme.colors.text.secondary}
      />
      <Text
        style={[
          styles.categoryTriggerLabel,
          { color: hasActive ? activeCategory!.color : theme.colors.text.secondary },
        ]}
        numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

/* -------------------- Hero mini legend -------------------- */

interface HeroLegendProps {
  label: string;
  value: string;
  valueColor: string;
}

function HeroLegend({ label, value, valueColor }: HeroLegendProps) {
  const { theme } = useTheme();
  return (
    <View style={styles.legendCell}>
      <Text
        style={[styles.legendLabel, { color: theme.colors.hero.fgDim }]}
        numberOfLines={1}>
        {label.toLocaleUpperCase()}
      </Text>
      <Text
        style={[styles.legendValue, { color: valueColor }]}
        numberOfLines={1}
        adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

/* -------------------- Focus transaction row (swipeable) -------------------- */

interface FocusTransactionRowProps {
  tx: Transaction;
  category: Category | undefined;
  onPress: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
  language: 'tr' | 'en';
  currency: SupportedCurrency;
}

const FocusTransactionRow = memo(function FocusTransactionRow({
  tx,
  category,
  onPress,
  onDelete,
  language,
  currency,
}: FocusTransactionRowProps) {
  const { theme } = useTheme();
  const swipeRef = useRef<SwipeableMethods>(null);

  const isExpense = tx.type === 'expense';
  const amountStr = formatCurrency(tx.amount, currency, language);
  const amountColor = isExpense ? theme.colors.text.primary : theme.colors.brand.primary;
  const sign = isExpense ? '−' : '+';

  const catName = category?.name ?? (language === 'tr' ? 'Kategori' : 'Category');
  const icon = category?.icon ?? 'help-circle';
  const color = category?.color ?? theme.colors.text.secondary;
  const hasNote = !!tx.note && tx.note.trim().length > 0;
  const title = hasNote ? tx.note! : catName;
  const time = dayjs(tx.date).format('HH:mm');
  const subtitle = hasNote ? `${catName} · ${time}` : time;

  const confirmDelete = useCallback(() => {
    HapticFeedback.trigger('impactMedium');
    const tr = language === 'tr';
    Alert.alert(
      tr ? 'İşlemi Sil' : 'Delete Transaction',
      tr ? 'Bu işlemi silmek istediğinize emin misiniz?' : 'Are you sure you want to delete this transaction?',
      [
        {
          text: tr ? 'Vazgeç' : 'Cancel',
          style: 'cancel',
          onPress: () => swipeRef.current?.close(),
        },
        {
          text: tr ? 'Sil' : 'Delete',
          style: 'destructive',
          onPress: () => {
            swipeRef.current?.close();
            onDelete(tx);
          },
        },
      ]
    );
  }, [language, onDelete, tx]);

  const renderRightActions = useCallback(
    (progress: SharedValue<number>) => (
      <DeleteAction
        progress={progress}
        onPress={confirmDelete}
        color={theme.colors.semantic.error}
      />
    ),
    [confirmDelete, theme.colors.semantic.error]
  );

  const handlePress = useCallback(() => {
    HapticFeedback.trigger('impactLight');
    onPress(tx);
  }, [onPress, tx]);

  return (
    <ReanimatedSwipeable
      ref={swipeRef}
      friction={2}
      rightThreshold={50}
      renderRightActions={renderRightActions}
      onSwipeableWillOpen={confirmDelete}
      overshootRight={false}
      containerStyle={{ backgroundColor: theme.colors.bg.card }}>
      <Pressable onPress={handlePress} style={styles.rowPressable}>
        {({ pressed }) => (
          <View
            style={[
              styles.row,
              {
                backgroundColor: theme.colors.bg.card,
                opacity: pressed ? 0.65 : 1,
              },
            ]}>
            <View
              style={[
                styles.rowIcon,
                { backgroundColor: hexWithAlpha(color, 0.14) },
              ]}>
              <Icon name={icon as any} size={15} color={color} />
            </View>
            <View style={styles.rowMiddle}>
              <Text
                style={[styles.rowTitle, { color: theme.colors.text.primary }]}
                numberOfLines={1}>
                {title}
              </Text>
              <Text
                style={[styles.rowSubtitle, { color: theme.colors.text.secondary }]}
                numberOfLines={1}>
                {subtitle}
              </Text>
            </View>
            <Text style={[styles.rowAmount, { color: amountColor }]} numberOfLines={1}>
              {sign}
              {amountStr}
            </Text>
          </View>
        )}
      </Pressable>
    </ReanimatedSwipeable>
  );
});

interface DeleteActionProps {
  progress: SharedValue<number>;
  color: string;
  onPress: () => void;
}

function DeleteAction({ progress, color, onPress }: DeleteActionProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: Math.min(1, progress.value) }],
    opacity: Math.min(1, progress.value),
  }));
  return (
    <View style={[styles.actionWrap, { backgroundColor: color }]}>
      <Pressable onPress={onPress} style={styles.actionPress}>
        <Animated.View style={animatedStyle}>
          <Icon name="trash-2" size={20} color="#FFFFFF" />
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
    gap: 10,
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
    flexShrink: 1,
    fontVariant: ['tabular-nums'],
  },
  legendRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 14,
  },
  legendCell: {
    gap: 2,
    flex: 1,
    minWidth: 0,
  },
  legendLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  legendValue: {
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  scrubberWrap: {
    paddingHorizontal: 20,
    marginTop: 14,
  },
  scrubber: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 3,
  },
  scrubberSegment: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrubberLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  categoryPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  categoryTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 140,
  },
  categoryTriggerLabel: {
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
  },
  groupWrap: {
    marginBottom: 14,
  },
  rowPressable: {
    alignSelf: 'stretch',
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 56,
    width: '100%',
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowMiddle: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  rowSubtitle: {
    fontSize: 11,
  },
  rowAmount: {
    fontSize: 14,
    fontWeight: '600',
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
  emptyWrap: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
