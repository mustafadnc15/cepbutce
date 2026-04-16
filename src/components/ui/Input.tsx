import React, { useState } from 'react';
import {
  KeyboardTypeOptions,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import Icon from '@react-native-vector-icons/feather';
import { useTheme } from '../../theme';

interface InputProps {
  prefix?: string;
  prefixIcon?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: KeyboardTypeOptions;
  error?: string;
  style?: ViewStyle;
}

export function Input({
  prefix,
  prefixIcon,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  error,
  style,
}: InputProps) {
  const { theme } = useTheme();
  const [, setFocused] = useState(false);
  const progress = useSharedValue(0);

  const animatedBorder = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [
        error ? theme.colors.semantic.error : theme.colors.border.input,
        error ? theme.colors.semantic.error : theme.colors.brand.primary,
      ]
    ),
  }));

  return (
    <View style={style}>
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.bg.card,
            borderRadius: theme.radius.input,
            borderWidth: 1,
            paddingHorizontal: theme.spacing.md,
            height: 50,
            gap: theme.spacing.sm,
          },
          animatedBorder,
        ]}>
        {prefixIcon && (
          <Icon name={prefixIcon as any} size={18} color={theme.colors.text.secondary} />
        )}
        {prefix && (
          <Text
            style={{
              ...theme.typography.body,
              color: theme.colors.text.secondary,
            }}>
            {prefix}
          </Text>
        )}
        <TextInput
          style={{
            flex: 1,
            color: theme.colors.text.primary,
            ...theme.typography.body,
          }}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.text.placeholder}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          onFocus={() => {
            setFocused(true);
            progress.value = withTiming(1, { duration: 150 });
          }}
          onBlur={() => {
            setFocused(false);
            progress.value = withTiming(0, { duration: 150 });
          }}
        />
      </Animated.View>
      {error && (
        <Text
          style={{
            ...theme.typography.caption,
            color: theme.colors.semantic.error,
            marginTop: theme.spacing.xs,
            marginLeft: theme.spacing.sm,
          }}>
          {error}
        </Text>
      )}
    </View>
  );
}
