import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface BudgetRingProps {
  size?: number;
  thickness?: number;
  percent: number; // 0..1, clamped internally
  color?: string;
  trackColor?: string;
  // Primary slot — e.g. "₺4.250 kaldı" or "—"
  primaryText: string;
  // Secondary slot — e.g. "₺3.750 / ₺8.000"
  secondaryText?: string;
  // Optional override of the primary text style
  primaryTone?: 'default' | 'muted';
}

export function BudgetRing({
  size = 120,
  thickness = 10,
  percent,
  color,
  trackColor,
  primaryText,
  secondaryText,
  primaryTone = 'default',
}: BudgetRingProps) {
  const { theme } = useTheme();

  const clamped = Math.max(0, Math.min(1, percent));
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(clamped, {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    });
  }, [clamped, progress]);

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  const fillColor =
    color ??
    (clamped >= 0.85
      ? theme.colors.semantic.error
      : clamped >= 0.6
      ? theme.colors.semantic.warning
      : theme.colors.brand.primary);

  const track =
    trackColor ??
    (theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)');

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const primaryColor =
    primaryTone === 'muted' ? theme.colors.text.secondary : theme.colors.text.primary;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={track}
          strokeWidth={thickness}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={fillColor}
          strokeWidth={thickness}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          // Rotate so the fill starts from the top rather than 3 o'clock.
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ alignItems: 'center', paddingHorizontal: 12 }}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            fontSize: size >= 160 ? 24 : 18,
            fontWeight: '700',
            color: primaryColor,
          }}>
          {primaryText}
        </Text>
        {secondaryText ? (
          <Text
            numberOfLines={1}
            style={{
              fontSize: size >= 160 ? 13 : 11,
              fontWeight: '500',
              color: theme.colors.text.secondary,
              marginTop: 2,
            }}>
            {secondaryText}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
