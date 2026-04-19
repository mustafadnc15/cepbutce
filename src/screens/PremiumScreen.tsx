import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from '@react-native-vector-icons/feather';
import HapticFeedback from 'react-native-haptic-feedback';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../theme';
import { Button } from '../components/ui';
import { useSettingsStore } from '../stores/useSettingsStore';
import {
  loadProducts,
  initIAP,
  endIAP,
  purchasePremium,
  restorePurchases,
  validateReceipt,
  type Product,
  type ProductId,
} from '../services/iap';

type PlanKey = 'monthly' | 'yearly' | 'lifetime';

const PLAN_TO_PRODUCT: Record<PlanKey, ProductId> = {
  monthly: 'com.cepbutce.premium.monthly',
  yearly: 'com.cepbutce.premium.yearly',
  lifetime: 'com.cepbutce.premium.lifetime',
};

interface ComparisonRow {
  key: string;
  label: string;
  free: string;
  premium: string;
  premiumIsUnlimited?: boolean;
}

export function PremiumScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();

  const isPremium = useSettingsStore((s) => s.isPremium);
  const setPremium = useSettingsStore((s) => s.setPremium);

  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<PlanKey>('yearly');
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await initIAP();
        const prods = await loadProducts();
        if (mounted) setProducts(prods);
      } catch (e) {
        if (mounted) {
          Toast.show({
            type: 'error',
            text1: t('paywall.errors.initFailed'),
          });
        }
      }
    })();
    return () => {
      mounted = false;
      void endIAP();
    };
  }, [t]);

  const productByPlan = useMemo(() => {
    const map: Partial<Record<PlanKey, Product>> = {};
    for (const p of products) {
      for (const [plan, id] of Object.entries(PLAN_TO_PRODUCT) as [PlanKey, ProductId][]) {
        if (p.productId === id) map[plan] = p;
      }
    }
    return map;
  }, [products]);

  const rows: ComparisonRow[] = useMemo(
    () => [
      {
        key: 'manualTracking',
        label: t('paywall.rows.manualTracking'),
        free: t('paywall.values.unlimited'),
        premium: t('paywall.values.unlimited'),
        premiumIsUnlimited: true,
      },
      {
        key: 'subscriptions',
        label: t('paywall.rows.subscriptions'),
        free: t('paywall.values.fiveItems'),
        premium: t('paywall.values.unlimited'),
      },
      {
        key: 'receiptScan',
        label: t('paywall.rows.receiptScan'),
        free: t('paywall.values.freeScans'),
        premium: t('paywall.values.premiumScans'),
      },
      {
        key: 'categoryBudgets',
        label: t('paywall.rows.categoryBudgets'),
        free: '✗',
        premium: '✓',
      },
      {
        key: 'export',
        label: t('paywall.rows.export'),
        free: t('paywall.values.csvOnly'),
        premium: t('paywall.values.csvPdf'),
      },
      {
        key: 'charts',
        label: t('paywall.rows.charts'),
        free: t('paywall.values.basic'),
        premium: t('paywall.values.advanced'),
      },
      {
        key: 'cloudSync',
        label: t('paywall.rows.cloudSync'),
        free: '✗',
        premium: '✓',
      },
      {
        key: 'darkMode',
        label: t('paywall.rows.darkMode'),
        free: '✓',
        premium: '✓',
      },
      {
        key: 'adFree',
        label: t('paywall.rows.adFree'),
        free: '✗',
        premium: '✓',
      },
    ],
    [t]
  );

  const handleSelect = (plan: PlanKey) => {
    HapticFeedback.trigger('impactLight');
    setSelected(plan);
  };

  const handlePurchase = async () => {
    if (purchasing || isPremium) return;
    setPurchasing(true);
    HapticFeedback.trigger('impactMedium');
    try {
      const productId = PLAN_TO_PRODUCT[selected];
      const result = await purchasePremium(productId);
      if (!validateReceipt(result)) {
        Toast.show({ type: 'error', text1: t('paywall.errors.purchaseFailed') });
        return;
      }
      setPremium(true, result.expiresAt);
      Toast.show({ type: 'success', text1: t('paywall.success') });
      HapticFeedback.trigger('notificationSuccess');
      navigation.goBack();
    } catch (e) {
      Toast.show({ type: 'error', text1: t('paywall.errors.purchaseFailed') });
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    if (restoring) return;
    setRestoring(true);
    HapticFeedback.trigger('impactLight');
    try {
      const results = await restorePurchases();
      const valid = results.find((r) => validateReceipt(r));
      if (!valid) {
        Toast.show({ type: 'info', text1: t('paywall.errors.noPurchases') });
        return;
      }
      setPremium(true, valid.expiresAt);
      Toast.show({ type: 'success', text1: t('paywall.restored') });
      navigation.goBack();
    } catch (e) {
      Toast.show({ type: 'error', text1: t('paywall.errors.restoreFailed') });
    } finally {
      setRestoring(false);
    }
  };

  const handleDevToggle = () => {
    HapticFeedback.trigger('impactLight');
    if (isPremium) {
      setPremium(false, null);
      Toast.show({ type: 'info', text1: 'Dev: Premium off' });
    } else {
      setPremium(true, null);
      Toast.show({ type: 'success', text1: 'Dev: Premium on' });
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg.page }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient
          colors={[theme.colors.brand.primary, '#00A857']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 8 }]}>
          <View style={styles.heroHeader}>
            <Pressable
              onPress={() => {
                HapticFeedback.trigger('impactLight');
                navigation.goBack();
              }}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}>
              <Icon name="x" size={26} color="#FFFFFF" />
            </Pressable>
            {isPremium ? (
              <View style={styles.activeBadge}>
                <Icon name="check-circle" size={14} color="#FFFFFF" />
                <Text style={styles.activeBadgeText}>
                  {t('paywall.alreadyActive')}
                </Text>
              </View>
            ) : (
              <View style={{ width: 26 }} />
            )}
          </View>
          <View style={styles.heroIconWrap}>
            <Icon name="star" size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.heroTitle}>{t('paywall.title')}</Text>
          <Text style={styles.heroBody}>{t('paywall.subtitle')}</Text>
        </LinearGradient>

        {/* Comparison table */}
        <View style={styles.section}>
          <View
            style={[
              styles.table,
              {
                backgroundColor: theme.colors.bg.card,
                borderColor: theme.colors.border.card,
              },
            ]}>
            <View
              style={[
                styles.headerRow,
                { borderColor: theme.colors.border.card },
              ]}>
              <Text
                style={[
                  styles.headerCell,
                  styles.featureCol,
                  { color: theme.colors.text.secondary },
                ]}>
                {t('paywall.comparisonHeader.feature')}
              </Text>
              <Text
                style={[
                  styles.headerCell,
                  styles.valueCol,
                  { color: theme.colors.text.secondary },
                ]}>
                {t('paywall.comparisonHeader.free')}
              </Text>
              <Text
                style={[
                  styles.headerCell,
                  styles.valueCol,
                  styles.premiumCol,
                  { color: theme.colors.brand.primary },
                ]}>
                {t('paywall.comparisonHeader.premium')}
              </Text>
            </View>
            {rows.map((r, idx) => (
              <View
                key={r.key}
                style={[
                  styles.row,
                  idx < rows.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: theme.colors.border.card,
                  },
                ]}>
                <Text
                  style={[
                    styles.bodyCell,
                    styles.featureCol,
                    { color: theme.colors.text.primary },
                  ]}>
                  {r.label}
                </Text>
                <ValueCell
                  value={r.free}
                  color={theme.colors.text.secondary}
                />
                <ValueCell
                  value={r.premium}
                  color={theme.colors.brand.primary}
                  highlight
                />
              </View>
            ))}
          </View>
        </View>

        {/* Plans */}
        <View style={styles.section}>
          <PlanCard
            plan="yearly"
            selected={selected === 'yearly'}
            onSelect={handleSelect}
            product={productByPlan.yearly}
            title={t('paywall.plans.yearly')}
            period={t('paywall.periods.perYear')}
            badge={t('paywall.badges.popular')}
            badgeVariant="primary"
          />
          <PlanCard
            plan="monthly"
            selected={selected === 'monthly'}
            onSelect={handleSelect}
            product={productByPlan.monthly}
            title={t('paywall.plans.monthly')}
            period={t('paywall.periods.perMonth')}
            badge={t('paywall.badges.flexible')}
            badgeVariant="muted"
          />
          <PlanCard
            plan="lifetime"
            selected={selected === 'lifetime'}
            onSelect={handleSelect}
            product={productByPlan.lifetime}
            title={t('paywall.plans.lifetime')}
            period={t('paywall.periods.once')}
            badge={t('paywall.badges.oneTime')}
            badgeVariant="muted"
          />
        </View>

        {/* CTA */}
        <View style={styles.ctaSection}>
          <Button
            title={
              purchasing ? t('paywall.ctaPurchasing') : t('paywall.cta')
            }
            onPress={handlePurchase}
            loading={purchasing}
            disabled={isPremium || purchasing}
          />
          <Text style={[styles.trialText, { color: theme.colors.text.secondary }]}>
            {t('paywall.trial')}
          </Text>
          <Pressable
            onPress={handleRestore}
            disabled={restoring}
            style={styles.restoreBtn}
            accessibilityRole="button"
            accessibilityLabel={t('paywall.restore')}>
            {restoring ? (
              <ActivityIndicator color={theme.colors.brand.primary} size="small" />
            ) : (
              <Text
                style={[styles.restoreText, { color: theme.colors.brand.primary }]}>
                {t('paywall.restore')}
              </Text>
            )}
          </Pressable>
        </View>

        {/* Legal */}
        <Text
          style={[
            styles.legal,
            { color: theme.colors.text.secondary },
          ]}>
          {t('paywall.legal')}
        </Text>

        {__DEV__ ? (
          <View style={styles.devToggle}>
            <Pressable
              onPress={handleDevToggle}
              style={[
                styles.devButton,
                {
                  borderColor: theme.colors.border.card,
                  backgroundColor: theme.colors.bg.card,
                },
              ]}>
              <Text
                style={[
                  styles.devText,
                  { color: theme.colors.text.secondary },
                ]}>
                {i18n.language === 'tr'
                  ? isPremium
                    ? "Dev: Premium'u Kapat"
                    : "Dev: Premium'u Aç"
                  : isPremium
                  ? 'Dev: Disable Premium'
                  : 'Dev: Enable Premium'}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

interface ValueCellProps {
  value: string;
  color: string;
  highlight?: boolean;
}

function ValueCell({ value, color, highlight }: ValueCellProps) {
  const { theme } = useTheme();
  const isCheck = value === '✓';
  const isCross = value === '✗';
  const palette = highlight
    ? theme.colors.brand.primary
    : theme.colors.text.secondary;
  if (isCheck) {
    return (
      <View style={[styles.valueCol, styles.iconCell]}>
        <Icon name="check" size={16} color={palette} />
      </View>
    );
  }
  if (isCross) {
    return (
      <View style={[styles.valueCol, styles.iconCell]}>
        <Icon name="x" size={16} color={theme.colors.text.placeholder} />
      </View>
    );
  }
  return (
    <Text
      style={[
        styles.bodyCell,
        styles.valueCol,
        {
          color,
          fontWeight: highlight ? '600' : '400',
        },
      ]}
      numberOfLines={2}>
      {value}
    </Text>
  );
}

interface PlanCardProps {
  plan: PlanKey;
  selected: boolean;
  onSelect: (p: PlanKey) => void;
  product?: Product;
  title: string;
  period: string;
  badge: string;
  badgeVariant: 'primary' | 'muted';
}

function PlanCard({
  plan,
  selected,
  onSelect,
  product,
  title,
  period,
  badge,
  badgeVariant,
}: PlanCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const borderColor = selected
    ? theme.colors.brand.primary
    : theme.colors.border.card;

  return (
    <Pressable
      onPress={() => onSelect(plan)}
      onPressIn={() => {
        scale.value = withSpring(0.98, { damping: 18 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 18 });
      }}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title} ${product?.localizedPrice ?? ''}`}>
      <Animated.View
        style={[
          styles.planCard,
          animatedStyle,
          {
            backgroundColor: theme.colors.bg.card,
            borderColor,
            borderWidth: selected ? 2 : StyleSheet.hairlineWidth,
          },
        ]}>
        <View style={styles.planHeader}>
          <View style={styles.planTitleRow}>
            <Text
              style={[
                styles.planTitle,
                { color: theme.colors.text.primary },
              ]}>
              {title}
            </Text>
            <Badge label={badge} variant={badgeVariant} />
          </View>
          <View
            style={[
              styles.radio,
              {
                borderColor: selected
                  ? theme.colors.brand.primary
                  : theme.colors.border.input,
              },
            ]}>
            {selected ? (
              <View
                style={[
                  styles.radioInner,
                  { backgroundColor: theme.colors.brand.primary },
                ]}
              />
            ) : null}
          </View>
        </View>
        <View style={styles.planPriceRow}>
          <Text
            style={[
              styles.planPrice,
              { color: theme.colors.text.primary },
            ]}>
            {product?.localizedPrice ?? '—'}
          </Text>
          <Text
            style={[
              styles.planPeriod,
              { color: theme.colors.text.secondary },
            ]}>
            {period}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

interface BadgeProps {
  label: string;
  variant: 'primary' | 'muted';
}

function Badge({ label, variant }: BadgeProps) {
  const { theme } = useTheme();
  const bg =
    variant === 'primary'
      ? theme.colors.brand.primary
      : theme.colors.bg.page;
  const color =
    variant === 'primary'
      ? theme.colors.text.white
      : theme.colors.text.secondary;
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          borderColor:
            variant === 'primary' ? 'transparent' : theme.colors.border.card,
          borderWidth: variant === 'primary' ? 0 : StyleSheet.hairlineWidth,
        },
      ]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
    gap: 6,
  },
  heroHeader: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
  },
  heroIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  heroBody: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  activeBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
  },
  table: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  featureCol: { flex: 2 },
  valueCol: { flex: 1, textAlign: 'center' },
  premiumCol: {},
  headerCell: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  bodyCell: {
    fontSize: 13,
  },
  iconCell: {
    alignItems: 'center',
  },
  planCard: {
    borderRadius: 16,
    padding: 16,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 8,
  },
  planPrice: {
    fontSize: 22,
    fontWeight: '700',
  },
  planPeriod: {
    fontSize: 13,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  ctaSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 12,
    alignItems: 'center',
  },
  trialText: {
    fontSize: 12,
    textAlign: 'center',
  },
  restoreBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  restoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  legal: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  devToggle: {
    paddingHorizontal: 16,
    paddingTop: 20,
    alignItems: 'center',
  },
  devButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  devText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
