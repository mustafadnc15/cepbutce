import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import HapticFeedback from 'react-native-haptic-feedback';

import { useTheme } from '../../theme';
import type { TransactionType } from '../../types';

interface ExpenseIncomeToggleProps {
  value: TransactionType;
  onChange: (value: TransactionType) => void;
}

const SEGMENTS: Array<{ key: TransactionType; label: string }> = [
  { key: 'expense', label: 'Harcama' },
  { key: 'income', label: 'Gelir' },
];

export function ExpenseIncomeToggle({ value, onChange }: ExpenseIncomeToggleProps) {
  const { theme } = useTheme();
  const progress = useSharedValue(value === 'expense' ? 0 : 1);
  const [innerWidth, setInnerWidth] = useState(0);

  useEffect(() => {
    progress.value = withTiming(value === 'expense' ? 0 : 1, { duration: 220 });
  }, [value, progress]);

  const handleLayout = (e: LayoutChangeEvent) => {
    setInnerWidth(e.nativeEvent.layout.width);
  };

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * (innerWidth / 2) }],
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [theme.colors.semantic.expense, theme.colors.brand.primary]
    ),
  }));

  const handlePress = (next: TransactionType) => {
    if (next === value) return;
    HapticFeedback.trigger('impactLight');
    onChange(next);
  };

  return (
    <View
      onLayout={handleLayout}
      style={[styles.container, { backgroundColor: theme.colors.bg.page }]}>
      {innerWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pill,
            { width: innerWidth / 2 },
            pillStyle,
          ]}
        />
      )}
      {SEGMENTS.map((seg) => {
        const active = seg.key === value;
        return (
          <Pressable
            key={seg.key}
            style={styles.segment}
            onPress={() => handlePress(seg.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}>
            <Text
              style={[
                styles.label,
                {
                  color: active ? theme.colors.text.white : theme.colors.text.secondary,
                },
              ]}>
              {seg.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    position: 'relative',
  },
  pill: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: 10,
  },
  segment: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});
