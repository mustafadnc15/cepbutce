import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Icon from '@react-native-vector-icons/feather';
import HapticFeedback from 'react-native-haptic-feedback';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '../../theme';
import { useSheetStore } from '../../stores/useSheetStore';

type TabMeta = { icon: string; label: string };

const TAB_META: Record<string, TabMeta> = {
  Dashboard: { icon: 'home', label: 'Ana Sayfa' },
  Transactions: { icon: 'file-text', label: 'İşlemler' },
  Subscriptions: { icon: 'repeat', label: 'Abonelikler' },
  Profile: { icon: 'user', label: 'Profil' },
};

const BAR_HEIGHT = 60;
const FAB_SIZE = 52;

interface TabItemProps {
  meta: TabMeta;
  focused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  activeColor: string;
  inactiveColor: string;
}

function TabItem({
  meta,
  focused,
  onPress,
  onLongPress,
  activeColor,
  inactiveColor,
}: TabItemProps) {
  const progress = useSharedValue(focused ? 1 : 0);

  React.useEffect(() => {
    progress.value = withTiming(focused ? 1 : 0, { duration: 160 });
  }, [focused, progress]);

  const animatedTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [inactiveColor, activeColor]),
  }));

  const animatedIconWrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + progress.value * 0.05 }],
  }));

  return (
    <Pressable
      onPress={() => {
        HapticFeedback.trigger('impactLight');
        onPress();
      }}
      onLongPress={onLongPress}
      style={styles.tabItem}
      hitSlop={8}>
      <Animated.View style={animatedIconWrapStyle}>
        <Icon
          name={meta.icon as any}
          size={20}
          color={focused ? activeColor : inactiveColor}
        />
      </Animated.View>
      <Animated.Text style={[styles.tabLabel, animatedTextStyle]}>
        {meta.label}
      </Animated.Text>
    </Pressable>
  );
}

interface FabButtonProps {
  color: string;
  shadow: any;
  activeRouteName: string;
}

function FabButton({ color, shadow, activeRouteName }: FabButtonProps) {
  const scale = useSharedValue(1);
  const openAddTransaction = useSheetStore((s) => s.openAddTransaction);
  const openAddSubscription = useSheetStore((s) => s.openAddSubscription);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressFab = () => {
    HapticFeedback.trigger('impactMedium');
    // FAB target depends on active tab — subscriptions tab creates a new
    // subscription, every other tab defaults to the add-transaction flow.
    if (activeRouteName === 'Subscriptions') {
      openAddSubscription();
    } else {
      openAddTransaction();
    }
  };

  const label =
    activeRouteName === 'Subscriptions' ? 'Yeni abonelik ekle' : 'Yeni işlem ekle';

  return (
    <View style={styles.fabSlot} pointerEvents="box-none">
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.92, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 12, stiffness: 220 });
        }}
        onPress={onPressFab}
        accessibilityRole="button"
        accessibilityLabel={label}>
        <Animated.View
          style={[
            styles.fab,
            { backgroundColor: color },
            shadow,
            animatedStyle,
          ]}>
          <Icon name="plus" size={24} color="#FFFFFF" />
        </Animated.View>
      </Pressable>
    </View>
  );
}

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const routes = state.routes;

  // Slot ordering: tab0 | tab1 | FAB | tab2 | tab3
  const leftTabs = routes.slice(0, 2);
  const rightTabs = routes.slice(2, 4);

  const renderTab = (route: typeof routes[number], absoluteIndex: number) => {
    const focused = state.index === absoluteIndex;
    const meta = TAB_META[route.name];
    if (!meta) return null;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name as any, route.params as any);
      }
    };

    const onLongPress = () => {
      navigation.emit({ type: 'tabLongPress', target: route.key });
    };

    return (
      <TabItem
        key={route.key}
        meta={meta}
        focused={focused}
        onPress={onPress}
        onLongPress={onLongPress}
        activeColor={theme.colors.brand.primary}
        inactiveColor={theme.colors.text.secondary}
      />
    );
  };

  return (
    // Outer backdrop paints the page color underneath the rounded corners of
    // the bar — otherwise React Navigation's default white container bleeds
    // through the corner cutouts in dark mode.
    <View style={{ backgroundColor: theme.colors.bg.page }}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.bg.card,
            borderTopColor: theme.colors.border.card,
            paddingBottom: insets.bottom,
            height: BAR_HEIGHT + insets.bottom,
          },
        ]}>
        <View style={styles.row}>
          {leftTabs.map((r, i) => renderTab(r, i))}
          <FabButton
            color={theme.colors.brand.primary}
            shadow={theme.shadows.fab}
            activeRouteName={routes[state.index]?.name ?? ''}
          />
          {rightTabs.map((r, i) => renderTab(r, i + 2))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    overflow: 'visible',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: BAR_HEIGHT,
  },
  tabItem: {
    flex: 1,
    height: BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  fabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: BAR_HEIGHT,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
  },
});
