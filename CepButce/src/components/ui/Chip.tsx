import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../theme';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

export function Chip({ label, active, onPress }: ChipProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: active ? theme.colors.brand.primary : theme.colors.bg.card,
        borderColor: active ? 'transparent' : theme.colors.border.card,
        borderWidth: active ? 0 : StyleSheet.hairlineWidth,
        borderRadius: theme.radius.full,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
      }}>
      <Text
        style={{
          ...theme.typography.subtitle,
          color: active ? theme.colors.text.white : theme.colors.text.secondary,
          fontWeight: '500',
        }}>
        {label}
      </Text>
    </Pressable>
  );
}
