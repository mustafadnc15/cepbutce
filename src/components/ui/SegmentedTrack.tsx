import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

type SegmentedMode = 'progress' | 'rhythm' | 'renewal';

interface Annotation {
  index: number;
  count?: number;
}

interface SegmentedTrackProps {
  segments?: number;
  values: number[];
  today?: number;
  accent?: string;
  mode?: SegmentedMode;
  annotations?: Annotation[];
  height?: number;
  /** Used for a11y — a single summary label replaces per-bar voice-over. */
  a11yLabel?: string;
  style?: ViewStyle;
}

const DEFAULT_HEIGHT = 48;
const RENEWAL_GHOST_HEIGHT = 6;
const MIN_RHYTHM_HEIGHT = 3;

export function SegmentedTrack({
  segments = 30,
  values,
  today,
  accent,
  mode = 'rhythm',
  annotations,
  height = DEFAULT_HEIGHT,
  a11yLabel,
  style,
}: SegmentedTrackProps) {
  const { theme } = useTheme();
  const accentColor = accent ?? theme.colors.brand.primary;
  const hero = theme.colors.hero;

  const annotationMap = useMemo(() => {
    const m = new Map<number, number>();
    if (annotations) {
      for (const a of annotations) m.set(a.index, a.count ?? 1);
    }
    return m;
  }, [annotations]);

  const max = useMemo(() => {
    let m = 1;
    for (const v of values) if (v > m) m = v;
    return m;
  }, [values]);

  return (
    <View
      accessible={Boolean(a11yLabel)}
      accessibilityLabel={a11yLabel}
      accessibilityRole={a11yLabel ? 'image' : undefined}
      style={[
        styles.track,
        { height, alignItems: mode === 'progress' ? 'stretch' : 'flex-end' },
        style,
      ]}>
      {Array.from({ length: segments }).map((_, i) => {
        const v = values[i] ?? 0;
        const future = today !== undefined && i > today;
        const isToday = today !== undefined && i === today;

        let barHeight = height;
        let bg: string;

        if (mode === 'progress') {
          barHeight = height;
          if (future) bg = hero.fgFaint;
          else if (v > 0) bg = accentColor;
          else bg = hero.fgDim;
        } else if (mode === 'renewal') {
          const count = annotationMap.get(i) ?? 0;
          if (count > 0) {
            barHeight = height;
            bg = accentColor;
          } else if (isToday) {
            // Today marker: ghost height, brighter dim so the user can still
            // locate "now" on the axis even on a renewal-free day.
            barHeight = RENEWAL_GHOST_HEIGHT;
            bg = hero.fgDim;
          } else {
            barHeight = RENEWAL_GHOST_HEIGHT;
            bg = hero.fgFaint;
          }
        } else {
          // rhythm
          if (future) {
            barHeight = RENEWAL_GHOST_HEIGHT;
            bg = hero.fgFaint;
          } else if (v <= 0) {
            barHeight = RENEWAL_GHOST_HEIGHT;
            bg = 'rgba(255,255,255,0.22)';
          } else {
            barHeight = Math.max(MIN_RHYTHM_HEIGHT, (v / max) * height);
            bg = accentColor;
          }
        }

        const count = mode === 'renewal' ? annotationMap.get(i) ?? 0 : 0;

        return (
          <View key={i} style={styles.barSlot}>
            {count > 1 && (
              <Text style={styles.annotation}>{count}</Text>
            )}
            <View
              style={{
                height: barHeight,
                borderRadius: 2,
                backgroundColor: bg,
                width: '100%',
              }}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    gap: 2,
    width: '100%',
  },
  barSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  annotation: {
    position: 'absolute',
    top: -12,
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
