import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Icon from '@react-native-vector-icons/feather';
import HapticFeedback from 'react-native-haptic-feedback';

import { SUBSCRIPTION_COLORS } from '../../constants/subscriptionColors';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <View style={styles.row}>
      {SUBSCRIPTION_COLORS.map((color) => {
        const active = color === value;
        return (
          <Pressable
            key={color}
            onPress={() => {
              HapticFeedback.trigger('impactLight');
              onChange(color);
            }}
            hitSlop={6}
            style={[styles.swatch, { backgroundColor: color }]}>
            {active && <Icon name="check" size={16} color="#FFFFFF" />}
          </Pressable>
        );
      })}
    </View>
  );
}

const SIZE = 32;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  swatch: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
