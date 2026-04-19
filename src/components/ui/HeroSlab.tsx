import React, { ReactNode } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

interface HeroSlabProps {
  eyebrow: string;
  accent?: string;
  children: ReactNode;
  footer?: ReactNode;
  style?: ViewStyle;
}

function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function HeroSlab({ eyebrow, accent, children, footer, style }: HeroSlabProps) {
  const { theme } = useTheme();
  const accentColor = accent ?? theme.colors.brand.primary;
  const hero = theme.colors.hero;

  return (
    <View
      style={[
        {
          backgroundColor: hero.bg,
          borderRadius: theme.radius.hero,
          paddingTop: 22,
          paddingBottom: 20,
          paddingHorizontal: 20,
          overflow: 'hidden',
        },
        style,
      ]}>
      {/* Radial accent glow (top-right). Native LinearGradient can't do a true
          radial fill, so we approximate one with concentric circles of
          decreasing opacity. Positioned off-edge so only the soft flank shows. */}
      <View
        pointerEvents="none"
        style={[
          styles.glowOuter,
          { backgroundColor: withAlpha(accentColor, 0.08) },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.glowMid,
          { backgroundColor: withAlpha(accentColor, 0.14) },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.glowCore,
          { backgroundColor: withAlpha(accentColor, 0.22) },
        ]}
      />

      <View style={styles.content}>
        <View style={styles.eyebrowRow}>
          <View style={[styles.dot, { backgroundColor: accentColor }]} />
          <Text style={[styles.eyebrow, { color: hero.fgMuted }]}>
            {eyebrow.toLocaleUpperCase()}
          </Text>
        </View>

        <View style={{ marginTop: 14 }}>{children}</View>

        {footer && <View style={{ marginTop: 16 }}>{footer}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  glowOuter: {
    position: 'absolute',
    top: -90,
    right: -70,
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  glowMid: {
    position: 'absolute',
    top: -60,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  glowCore: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 130,
    height: 130,
    borderRadius: 65,
  },
  content: { position: 'relative' },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
});
