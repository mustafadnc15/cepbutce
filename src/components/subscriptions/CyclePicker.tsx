import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import HapticFeedback from 'react-native-haptic-feedback';

import { useTheme } from '../../theme';
import { useSettingsStore } from '../../stores/useSettingsStore';
import type { BillingCycle } from '../../types';

const ORDERED_CYCLES: BillingCycle[] = ['weekly', 'monthly', 'quarterly', 'yearly'];

const CYCLE_LABELS: Record<'tr' | 'en', Record<BillingCycle, string>> = {
  tr: { weekly: 'Haftalık', monthly: 'Aylık', quarterly: '3 Aylık', yearly: 'Yıllık' },
  en: { weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly' },
};

interface CyclePickerProps {
  value: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
}

export function CyclePicker({ value, onChange }: CyclePickerProps) {
  const { theme } = useTheme();
  const language = useSettingsStore((s) => s.language);
  const labels = CYCLE_LABELS[language];

  return (
    <View
      style={[
        styles.track,
        {
          backgroundColor: theme.colors.bg.page,
          borderColor: theme.colors.border.card,
        },
      ]}>
      {ORDERED_CYCLES.map((cycle) => {
        const active = cycle === value;
        return (
          <Pressable
            key={cycle}
            onPress={() => {
              HapticFeedback.trigger('impactLight');
              onChange(cycle);
            }}
            style={[
              styles.segment,
              active && {
                backgroundColor: theme.colors.brand.primary,
              },
            ]}>
            <Text
              style={[
                styles.label,
                {
                  color: active ? theme.colors.text.white : theme.colors.text.secondary,
                  fontWeight: active ? '600' : '500',
                },
              ]}
              numberOfLines={1}>
              {labels[cycle]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 3,
    gap: 3,
  },
  segment: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
  },
});
