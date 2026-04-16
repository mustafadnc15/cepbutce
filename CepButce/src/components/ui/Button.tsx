import React from 'react';
import { ActivityIndicator, Pressable, Text, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Icon from '@react-native-vector-icons/feather';
import HapticFeedback from 'react-native-haptic-feedback';
import { useTheme } from '../../theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  icon,
  style,
}: ButtonProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const variantStyles: Record<
    Variant,
    { bg: string; text: string; borderColor?: string; borderWidth?: number }
  > = {
    primary: { bg: theme.colors.brand.primary, text: theme.colors.text.white },
    secondary: {
      bg: 'transparent',
      text: theme.colors.brand.primary,
      borderColor: theme.colors.brand.primary,
      borderWidth: 1,
    },
    danger: { bg: theme.colors.semantic.error, text: theme.colors.text.white },
    ghost: { bg: 'transparent', text: theme.colors.brand.primary },
  };

  const v = variantStyles[variant];

  const handlePress = () => {
    if (disabled || loading) return;
    HapticFeedback.trigger('impactLight');
    onPress();
  };

  return (
    <Pressable
      onPressIn={() => {
        if (disabled || loading) return;
        scale.value = withTiming(0.98, { duration: 100 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 100 });
      }}
      onPress={handlePress}
      disabled={disabled || loading}>
      <Animated.View
        style={[
          {
            backgroundColor: v.bg,
            borderRadius: theme.radius.input,
            height: 50,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.spacing.sm,
            paddingHorizontal: theme.spacing.lg,
            borderColor: v.borderColor,
            borderWidth: v.borderWidth,
            opacity: disabled ? 0.5 : 1,
          },
          animatedStyle,
          style,
        ]}>
        {loading ? (
          <ActivityIndicator color={v.text} />
        ) : (
          <>
            {icon && <Icon name={icon as any} size={18} color={v.text} />}
            <Text style={{ ...theme.typography.cardTitle, color: v.text }}>{title}</Text>
          </>
        )}
      </Animated.View>
    </Pressable>
  );
}
