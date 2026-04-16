import React from 'react';
import { View, ViewStyle } from 'react-native';
import Icon from '@react-native-vector-icons/feather';
import { useTheme } from '../../theme';

interface IconBoxProps {
  iconName: string;
  iconColor?: string;
  bgColor?: string;
  size?: number;
  iconSize?: number;
  style?: ViewStyle;
}

export function IconBox({
  iconName,
  iconColor,
  bgColor,
  size = 44,
  iconSize = 20,
  style,
}: IconBoxProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: theme.radius.md,
          backgroundColor: bgColor ?? theme.colors.brand.primaryTint,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}>
      <Icon
        name={iconName as any}
        size={iconSize}
        color={iconColor ?? theme.colors.brand.primary}
      />
    </View>
  );
}
