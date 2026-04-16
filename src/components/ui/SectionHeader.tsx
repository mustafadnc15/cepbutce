import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../../theme';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  const { theme } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.sm,
      }}>
      <Text
        style={{
          ...theme.typography.greeting,
          fontWeight: '500',
          letterSpacing: 0.5,
          color: theme.colors.text.secondary,
          textTransform: 'uppercase',
        }}>
        {title}
      </Text>
      {actionLabel && onAction && (
        <Pressable onPress={onAction}>
          <Text
            style={{
              ...theme.typography.greeting,
              fontWeight: '500',
              color: theme.colors.brand.primary,
            }}>
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
