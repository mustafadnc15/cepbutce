import React, { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../theme';
import { Card } from './Card';
import { IconBox } from './IconBox';

interface ListCardProps {
  icon: string;
  iconColor?: string;
  iconBg?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: () => void;
}

export function ListCard({
  icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  right,
  onPress,
}: ListCardProps) {
  const { theme } = useTheme();

  return (
    <Card onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <IconBox iconName={icon} iconColor={iconColor} bgColor={iconBg} />
        <View style={{ flex: 1 }}>
          <Text
            style={{
              ...theme.typography.listTitle,
              color: theme.colors.text.primary,
            }}>
            {title}
          </Text>
          {subtitle && (
            <Text
              style={{
                ...theme.typography.subtitle,
                color: theme.colors.text.secondary,
                marginTop: 2,
              }}>
              {subtitle}
            </Text>
          )}
        </View>
        {right}
      </View>
    </Card>
  );
}
