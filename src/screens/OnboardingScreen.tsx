import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/feather';
import HapticFeedback from 'react-native-haptic-feedback';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../theme';
import { Button } from '../components/ui';
import { useSettingsStore } from '../stores/useSettingsStore';
import { CURRENCIES } from '../constants/currencies';

const { width: WINDOW_WIDTH } = Dimensions.get('window');

type PageKind = 'feature' | 'currency';

interface FeaturePage {
  kind: 'feature';
  key: string;
  titleKey: string;
  bodyKey: string;
  icon: string;
  accentColors: [string, string];
}

interface CurrencyPage {
  kind: 'currency';
  key: string;
  titleKey: string;
  bodyKey: string;
}

type Page = FeaturePage | CurrencyPage;

export function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);
  const currency = useSettingsStore((s) => s.currency);
  const setCurrency = useSettingsStore((s) => s.setCurrency);

  const listRef = useRef<FlatList<Page>>(null);
  const [index, setIndex] = useState(0);

  const pages: Page[] = useMemo(
    () => [
      {
        kind: 'feature',
        key: 'page1',
        titleKey: 'onboarding.page1.title',
        bodyKey: 'onboarding.page1.body',
        icon: 'trending-up',
        accentColors: ['#00C864', '#00A857'],
      },
      {
        kind: 'feature',
        key: 'page2',
        titleKey: 'onboarding.page2.title',
        bodyKey: 'onboarding.page2.body',
        icon: 'repeat',
        accentColors: ['#5856D6', '#3A38B8'],
      },
      {
        kind: 'feature',
        key: 'page3',
        titleKey: 'onboarding.page3.title',
        bodyKey: 'onboarding.page3.body',
        icon: 'camera',
        accentColors: ['#FF9500', '#D97706'],
      },
      {
        kind: 'currency',
        key: 'currency',
        titleKey: 'onboarding.currency.title',
        bodyKey: 'onboarding.currency.body',
      },
    ],
    []
  );

  const lastIndex = pages.length - 1;
  const isLastPage = index === lastIndex;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0];
      if (first?.index != null) {
        setIndex(first.index);
      }
    }
  ).current;

  const finish = useCallback(() => {
    HapticFeedback.trigger('notificationSuccess');
    completeOnboarding();
    onDone();
  }, [completeOnboarding, onDone]);

  const handleNext = useCallback(() => {
    HapticFeedback.trigger('impactLight');
    if (isLastPage) {
      finish();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  }, [isLastPage, finish, index]);

  const handleSkip = useCallback(() => {
    HapticFeedback.trigger('impactLight');
    finish();
  }, [finish]);

  const renderItem = useCallback(
    ({ item }: { item: Page }) => {
      if (item.kind === 'feature') {
        return (
          <FeaturePageView
            page={item}
            title={t(item.titleKey)}
            body={t(item.bodyKey)}
          />
        );
      }
      return (
        <CurrencyPageView
          title={t(item.titleKey)}
          body={t(item.bodyKey)}
          selected={currency}
          onSelect={(code) => {
            HapticFeedback.trigger('impactLight');
            setCurrency(code);
          }}
        />
      );
    },
    [t, currency, setCurrency]
  );

  const keyExtractor = useCallback((item: Page) => item.key, []);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg.page }]}>
      {/* Skip button in the corner for pages 0–2 */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <View style={{ flex: 1 }} />
        {!isLastPage ? (
          <Pressable
            onPress={handleSkip}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.skip')}>
            <Text
              style={[styles.skipText, { color: theme.colors.text.secondary }]}>
              {t('onboarding.skip')}
            </Text>
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <FlatList
        ref={listRef}
        data={pages}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        getItemLayout={(_, i) => ({
          length: WINDOW_WIDTH,
          offset: WINDOW_WIDTH * i,
          index: i,
        })}
      />

      {/* Page dots */}
      <View style={styles.dotsRow}>
        {pages.map((p, i) => (
          <Dot key={p.key} active={i === index} />
        ))}
      </View>

      <View style={[styles.ctaRow, { paddingBottom: insets.bottom + 20 }]}>
        <Button
          title={isLastPage ? t('onboarding.start') : t('onboarding.next')}
          onPress={handleNext}
          icon={isLastPage ? 'check' : 'arrow-right'}
        />
      </View>
    </View>
  );
}

function FeaturePageView({
  page,
  title,
  body,
}: {
  page: FeaturePage;
  title: string;
  body: string;
}) {
  const { theme } = useTheme();
  return (
    <View style={[styles.page, { width: WINDOW_WIDTH }]}>
      <LinearGradient
        colors={page.accentColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.illustration}>
        <Icon name={page.icon as any} size={96} color="#FFFFFF" />
      </LinearGradient>
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          {title}
        </Text>
        <Text
          style={[styles.body, { color: theme.colors.text.secondary }]}>
          {body}
        </Text>
      </View>
    </View>
  );
}

function CurrencyPageView({
  title,
  body,
  selected,
  onSelect,
}: {
  title: string;
  body: string;
  selected: string;
  onSelect: (code: string) => void;
}) {
  const { theme } = useTheme();
  // Limit to top 6 currencies so the grid stays one screen on small devices.
  const grid = CURRENCIES.slice(0, 6);
  return (
    <View style={[styles.page, { width: WINDOW_WIDTH }]}>
      <View style={[styles.textWrap, { paddingTop: 24 }]}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          {title}
        </Text>
        <Text
          style={[styles.body, { color: theme.colors.text.secondary }]}>
          {body}
        </Text>
      </View>
      <View style={styles.currencyGrid}>
        {grid.map((c) => (
          <CurrencyTile
            key={c.code}
            code={c.code}
            symbol={c.symbol}
            name={c.name}
            selected={c.code === selected}
            onPress={() => onSelect(c.code)}
          />
        ))}
      </View>
    </View>
  );
}

function CurrencyTile({
  code,
  symbol,
  name,
  selected,
  onPress,
}: {
  code: string;
  symbol: string;
  name: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.97, { duration: 80 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 120 });
      }}
      style={styles.tileWrap}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${name} ${code}`}>
      <Animated.View
        style={[
          styles.tile,
          animatedStyle,
          {
            backgroundColor: selected
              ? theme.colors.brand.primaryTint
              : theme.colors.bg.card,
            borderColor: selected
              ? theme.colors.brand.primary
              : theme.colors.border.card,
            borderWidth: selected ? 2 : StyleSheet.hairlineWidth,
          },
        ]}>
        <Text
          style={[
            styles.tileSymbol,
            { color: theme.colors.text.primary },
          ]}>
          {symbol}
        </Text>
        <Text
          style={[
            styles.tileName,
            { color: theme.colors.text.secondary },
          ]}
          numberOfLines={1}>
          {name}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

function Dot({ active }: { active: boolean }) {
  const { theme } = useTheme();
  const width = useSharedValue(active ? 24 : 8);
  React.useEffect(() => {
    width.value = withTiming(active ? 24 : 8, { duration: 200 });
  }, [active, width]);
  const animatedStyle = useAnimatedStyle(() => ({
    width: width.value,
  }));
  return (
    <Animated.View
      style={[
        styles.dot,
        animatedStyle,
        {
          backgroundColor: active
            ? theme.colors.brand.primary
            : theme.colors.border.card,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  page: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  illustration: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  textWrap: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  ctaRow: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 24,
    justifyContent: 'center',
  },
  tileWrap: {
    width: '30%',
    aspectRatio: 1,
  },
  tile: {
    flex: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    gap: 4,
  },
  tileSymbol: {
    fontSize: 28,
    fontWeight: '700',
  },
  tileName: {
    fontSize: 11,
    textAlign: 'center',
  },
});
