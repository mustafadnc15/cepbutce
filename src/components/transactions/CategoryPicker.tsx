import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Icon from '@react-native-vector-icons/feather';
import HapticFeedback from 'react-native-haptic-feedback';

import { useTheme } from '../../theme';
import { IconBox } from '../ui';
import { DEFAULT_CATEGORIES } from '../../constants/categories';
import type { Category, TransactionType } from '../../types';

interface CategoryPickerProps {
  type: TransactionType;
  selectedId: string | null;
  onSelect: (categoryId: string) => void;
  onRequestCustom?: () => void;
  isPremium?: boolean;
}

function hexWithAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function CategoryPicker({
  type,
  selectedId,
  onSelect,
  onRequestCustom,
  isPremium = false,
}: CategoryPickerProps) {
  const { theme } = useTheme();

  const items = useMemo(() => DEFAULT_CATEGORIES.filter((c) => c.type === type), [type]);
  // Append the custom-category slot so layout chunking treats it like any other tile.
  const rows = useMemo(() => chunk<Category | 'custom'>([...items, 'custom'], 3), [items]);

  return (
    <View style={styles.wrap}>
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {row.map((entry) => {
            if (entry === 'custom') {
              return (
                <CustomSlot
                  key="custom"
                  locked={!isPremium}
                  onPress={() => {
                    HapticFeedback.trigger('impactLight');
                    onRequestCustom?.();
                  }}
                />
              );
            }
            return (
              <CategoryTile
                key={entry.id}
                category={entry}
                selected={entry.id === selectedId}
                onPress={() => {
                  HapticFeedback.trigger('impactLight');
                  onSelect(entry.id);
                }}
              />
            );
          })}
          {Array.from({ length: 3 - row.length }).map((_, i) => (
            <View key={`pad-${rowIdx}-${i}`} style={styles.pad} />
          ))}
        </View>
      ))}
    </View>
  );
}

interface CategoryTileProps {
  category: Category;
  selected: boolean;
  onPress: () => void;
}

function CategoryTile({ category, selected, onPress }: CategoryTileProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(selected ? 1.03 : 1, { damping: 14, stiffness: 220 });
  }, [selected, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable style={styles.tileWrap} onPress={onPress}>
      <Animated.View
        style={[
          styles.tile,
          {
            backgroundColor: selected
              ? hexWithAlpha(category.color, 0.1)
              : theme.colors.bg.card,
            borderColor: selected ? category.color : theme.colors.border.card,
            borderWidth: selected ? 2 : 1,
          },
          animatedStyle,
        ]}>
        <IconBox
          iconName={category.icon}
          iconColor={category.color}
          bgColor={hexWithAlpha(category.color, 0.18)}
          size={36}
          iconSize={18}
        />
        <Text
          style={[styles.tileLabel, { color: theme.colors.text.primary }]}
          numberOfLines={1}>
          {category.name}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

interface CustomSlotProps {
  locked: boolean;
  onPress: () => void;
}

function CustomSlot({ locked, onPress }: CustomSlotProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      style={styles.tileWrap}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 15, stiffness: 260 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 200 });
      }}
      onPress={onPress}>
      <Animated.View
        style={[
          styles.tile,
          {
            backgroundColor: theme.colors.bg.card,
            borderColor: theme.colors.border.card,
            borderStyle: 'dashed',
            borderWidth: 1,
          },
          animatedStyle,
        ]}>
        <View style={styles.customIconWrap}>
          <Icon
            name={locked ? 'lock' : 'plus'}
            size={18}
            color={theme.colors.text.secondary}
          />
        </View>
        <Text
          style={[styles.tileLabel, { color: theme.colors.text.secondary }]}
          numberOfLines={1}>
          Yeni
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  row: { flexDirection: 'row', gap: 10 },
  pad: { flex: 1 },
  tileWrap: { flex: 1 },
  tile: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 8,
  },
  tileLabel: {
    fontSize: 11,
    fontWeight: '400',
    textAlign: 'center',
  },
  customIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
