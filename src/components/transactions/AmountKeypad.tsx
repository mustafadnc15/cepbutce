import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Icon from '@react-native-vector-icons/feather';
import HapticFeedback from 'react-native-haptic-feedback';

import { useTheme } from '../../theme';

export const MAX_INT_DIGITS = 6;
export const MAX_DEC_DIGITS = 2;

interface AmountKeypadProps {
  value: string;
  onChange: (next: string) => void;
  locale: 'tr' | 'en';
}

export function AmountKeypad({ value, onChange, locale }: AmountKeypadProps) {
  const decimalSeparator = locale === 'tr' ? ',' : '.';

  const pressDigit = (digit: string) => {
    HapticFeedback.trigger('impactLight');
    const dotIdx = value.indexOf('.');
    if (dotIdx >= 0) {
      const dec = value.slice(dotIdx + 1);
      if (dec.length >= MAX_DEC_DIGITS) return;
      onChange(value + digit);
      return;
    }
    if (value.length >= MAX_INT_DIGITS) return;
    if (value === '0') {
      if (digit === '0') return;
      onChange(digit);
      return;
    }
    onChange(value + digit);
  };

  const pressDecimal = () => {
    HapticFeedback.trigger('impactLight');
    if (value.indexOf('.') >= 0) return;
    onChange(value + '.');
  };

  const pressBackspace = () => {
    HapticFeedback.trigger('impactLight');
    if (value.length <= 1) {
      if (value !== '0') onChange('0');
      return;
    }
    onChange(value.slice(0, -1));
  };

  const longPressBackspace = () => {
    HapticFeedback.trigger('impactMedium');
    onChange('0');
  };

  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        <Key onPress={() => pressDigit('1')}>
          <KeyLabel>1</KeyLabel>
        </Key>
        <Key onPress={() => pressDigit('2')}>
          <KeyLabel>2</KeyLabel>
        </Key>
        <Key onPress={() => pressDigit('3')}>
          <KeyLabel>3</KeyLabel>
        </Key>
      </View>
      <View style={styles.row}>
        <Key onPress={() => pressDigit('4')}>
          <KeyLabel>4</KeyLabel>
        </Key>
        <Key onPress={() => pressDigit('5')}>
          <KeyLabel>5</KeyLabel>
        </Key>
        <Key onPress={() => pressDigit('6')}>
          <KeyLabel>6</KeyLabel>
        </Key>
      </View>
      <View style={styles.row}>
        <Key onPress={() => pressDigit('7')}>
          <KeyLabel>7</KeyLabel>
        </Key>
        <Key onPress={() => pressDigit('8')}>
          <KeyLabel>8</KeyLabel>
        </Key>
        <Key onPress={() => pressDigit('9')}>
          <KeyLabel>9</KeyLabel>
        </Key>
      </View>
      <View style={styles.row}>
        <Key onPress={pressDecimal}>
          <KeyLabel>{decimalSeparator}</KeyLabel>
        </Key>
        <Key onPress={() => pressDigit('0')}>
          <KeyLabel>0</KeyLabel>
        </Key>
        <Key onPress={pressBackspace} onLongPress={longPressBackspace}>
          <BackspaceIcon />
        </Key>
      </View>
    </View>
  );
}

interface KeyProps {
  children: ReactNode;
  onPress: () => void;
  onLongPress?: () => void;
}

function Key({ children, onPress, onLongPress }: KeyProps) {
  const { theme } = useTheme();
  const progress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [theme.colors.bg.card, theme.colors.bg.page]
    ),
  }));

  return (
    <Pressable
      onPressIn={() => {
        progress.value = withTiming(1, { duration: 70 });
      }}
      onPressOut={() => {
        progress.value = withTiming(0, { duration: 140 });
      }}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={450}
      style={styles.keyPressable}>
      <Animated.View
        style={[
          styles.key,
          { borderColor: theme.colors.border.card },
          animatedStyle,
        ]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

function KeyLabel({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  return (
    <Text style={[styles.keyLabel, { color: theme.colors.text.primary }]}>
      {children}
    </Text>
  );
}

function BackspaceIcon() {
  const { theme } = useTheme();
  return <Icon name="delete" size={22} color={theme.colors.text.primary} />;
}

const styles = StyleSheet.create({
  grid: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  keyPressable: {
    flex: 1,
  },
  key: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  keyLabel: {
    fontSize: 22,
    fontWeight: '500',
  },
});
