import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import HapticFeedback from 'react-native-haptic-feedback';

import { useTheme } from '../../theme';
import { useSettingsStore } from '../../stores/useSettingsStore';

const OPTIONS: number[] = [1, 3, 7];

interface ReminderRowProps {
  enabled: boolean;
  daysBefore: number;
  onChange: (enabled: boolean, daysBefore: number) => void;
}

export function ReminderRow({ enabled, daysBefore, onChange }: ReminderRowProps) {
  const { theme } = useTheme();
  const language = useSettingsStore((s) => s.language);

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: theme.colors.bg.card,
          borderColor: theme.colors.border.card,
        },
      ]}>
      <View style={styles.toggleRow}>
        <Text style={[styles.label, { color: theme.colors.text.primary }]}>
          {language === 'tr' ? 'Hatırlatma' : 'Reminder'}
        </Text>
        <Switch
          value={enabled}
          onValueChange={(next) => {
            HapticFeedback.trigger('impactLight');
            onChange(next, daysBefore);
          }}
          trackColor={{
            false: theme.colors.border.card,
            true: theme.colors.brand.primary,
          }}
        />
      </View>
      {enabled && (
        <>
          <View style={[styles.divider, { backgroundColor: theme.colors.border.card }]} />
          <View style={styles.daysRow}>
            {OPTIONS.map((days) => {
              const active = days === daysBefore;
              return (
                <Pressable
                  key={days}
                  onPress={() => {
                    HapticFeedback.trigger('impactLight');
                    onChange(enabled, days);
                  }}
                  style={[
                    styles.dayChip,
                    {
                      backgroundColor: active
                        ? theme.colors.brand.primary
                        : theme.colors.bg.page,
                      borderColor: active
                        ? theme.colors.brand.primary
                        : theme.colors.border.card,
                    },
                  ]}>
                  <Text
                    style={{
                      color: active ? theme.colors.text.white : theme.colors.text.primary,
                      fontSize: 13,
                      fontWeight: '500',
                    }}
                    numberOfLines={1}>
                    {language === 'tr' ? `${days} gün önce` : `${days} days before`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dayChip: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
