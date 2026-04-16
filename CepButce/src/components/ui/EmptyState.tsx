import React from 'react';
import { Text, View, ViewStyle } from 'react-native';
import Icon from '@react-native-vector-icons/feather';
import { useTheme } from '../../theme';
import { Button } from './Button';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.spacing.xxl,
          gap: theme.spacing.md,
        },
        style,
      ]}>
      <Icon name={icon as any} size={64} color={theme.colors.text.placeholder} />
      <Text
        style={{
          ...theme.typography.cardTitle,
          color: theme.colors.text.primary,
          textAlign: 'center',
        }}>
        {title}
      </Text>
      {subtitle && (
        <Text
          style={{
            ...theme.typography.greeting,
            color: theme.colors.text.secondary,
            textAlign: 'center',
          }}>
          {subtitle}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} style={{ marginTop: theme.spacing.md }} />
      )}
    </View>
  );
}
