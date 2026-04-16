import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../theme';
import { Card } from './Card';
import { IconBox } from './IconBox';

interface StatCardProps {
  label: string;
  value: string;
  valueColor?: string;
  icon?: string;
}

export function StatCard({ label, value, valueColor, icon }: StatCardProps) {
  const { theme } = useTheme();

  return (
    <Card variant="tinted">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        {icon && <IconBox iconName={icon} />}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              ...theme.typography.subtitle,
              color: theme.colors.text.secondary,
            }}>
            {label}
          </Text>
          <Text
            style={{
              ...theme.typography.bigNumber,
              color: valueColor ?? theme.colors.text.primary,
              marginTop: 2,
            }}>
            {value}
          </Text>
        </View>
      </View>
    </Card>
  );
}
