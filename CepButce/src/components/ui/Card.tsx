import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
  variant?: 'default' | 'tinted';
}

export function Card({ children, style, onPress, variant = 'default' }: CardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const containerStyle: ViewStyle = {
    backgroundColor:
      variant === 'tinted' ? theme.colors.brand.primaryLight : theme.colors.bg.card,
    borderColor:
      variant === 'tinted' ? theme.colors.brand.primaryBorder : theme.colors.border.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    ...theme.shadows.card,
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!onPress) {
    return <View style={[containerStyle, style]}>{children}</View>;
  }

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withTiming(0.98, { duration: 100 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 100 });
      }}
      onPress={onPress}>
      <Animated.View style={[containerStyle, animatedStyle, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
