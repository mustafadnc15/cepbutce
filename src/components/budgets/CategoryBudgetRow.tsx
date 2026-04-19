import React, { memo, useCallback, useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Icon from '@react-native-vector-icons/feather';
import HapticFeedback from 'react-native-haptic-feedback';

import { useTheme } from '../../theme';
import { IconBox } from '../ui';
import type { Category } from '../../types';

const ROW_HEIGHT = 62;
const ACTION_WIDTH = 88;

interface CategoryBudgetRowProps {
  category: Category;
  value: string;
  prefix: string;
  onChangeText: (text: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function CategoryBudgetRowImpl({
  category,
  value,
  prefix,
  onChangeText,
  onRemove,
  canRemove,
}: CategoryBudgetRowProps) {
  const { theme } = useTheme();
  const swipeRef = useRef<SwipeableMethods>(null);
  const inputRef = useRef<TextInput>(null);

  const handleRemove = useCallback(() => {
    HapticFeedback.trigger('impactMedium');
    swipeRef.current?.close();
    onRemove();
  }, [onRemove]);

  const renderRightActions = useCallback(
    (progress: SharedValue<number>) =>
      canRemove ? (
        <RemoveAction
          progress={progress}
          onPress={handleRemove}
          color={theme.colors.semantic.error}
        />
      ) : null,
    [canRemove, handleRemove, theme.colors.semantic.error]
  );

  const handleRowPress = () => {
    HapticFeedback.trigger('impactLight');
    inputRef.current?.focus();
  };

  return (
    <ReanimatedSwipeable
      ref={swipeRef}
      friction={2}
      rightThreshold={ACTION_WIDTH * 0.6}
      renderRightActions={renderRightActions}
      overshootRight={false}
      enabled={canRemove}
      containerStyle={{ backgroundColor: 'transparent' }}>
      <Pressable
        onPress={handleRowPress}
        style={[
          styles.row,
          {
            backgroundColor: theme.colors.bg.card,
            borderColor: theme.colors.border.card,
          },
        ]}>
        <IconBox
          iconName={category.icon}
          iconColor={category.color}
          bgColor={hexWithAlpha(category.color, 0.14)}
          size={36}
          iconSize={18}
        />
        <Text
          numberOfLines={1}
          style={[styles.name, { color: theme.colors.text.primary }]}>
          {category.name}
        </Text>
        <View style={styles.inputWrap}>
          <Text
            style={{
              fontSize: 14,
              color: theme.colors.text.secondary,
              fontWeight: '500',
            }}>
            {prefix}
          </Text>
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            placeholder="—"
            placeholderTextColor={theme.colors.text.placeholder}
            keyboardType="numeric"
            style={[
              styles.input,
              {
                color: theme.colors.text.primary,
              },
            ]}
          />
        </View>
      </Pressable>
    </ReanimatedSwipeable>
  );
}

interface RemoveActionProps {
  progress: SharedValue<number>;
  color: string;
  onPress: () => void;
}

function RemoveAction({ progress, color, onPress }: RemoveActionProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: Math.min(1, progress.value) }],
    opacity: Math.min(1, progress.value),
  }));

  return (
    <View style={[styles.actionWrap, { backgroundColor: color }]}>
      <Pressable onPress={onPress} style={styles.actionPress}>
        <Animated.View style={[styles.actionInner, animatedStyle]}>
          <Icon name="trash-2" size={18} color="#FFFFFF" />
          <Text style={styles.actionLabel}>Kaldır</Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

function hexWithAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const CategoryBudgetRow = memo(CategoryBudgetRowImpl);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: ROW_HEIGHT,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 96,
    justifyContent: 'flex-end',
  },
  input: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
    minWidth: 60,
    padding: 0,
  },
  actionWrap: {
    width: ACTION_WIDTH,
    borderRadius: 14,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPress: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionInner: {
    alignItems: 'center',
    gap: 4,
  },
  actionLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
});
