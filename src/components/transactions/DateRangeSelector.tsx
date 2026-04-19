import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import 'dayjs/locale/en';
import Icon from '@react-native-vector-icons/feather';
import HapticFeedback from 'react-native-haptic-feedback';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';

import { useTheme } from '../../theme';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { Button } from '../ui';

export type DateRangePreset =
  | 'today'
  | 'thisWeek'
  | 'thisMonth'
  | 'last3Months'
  | 'thisYear'
  | 'allTime'
  | 'custom';

export interface DateRange {
  preset: DateRangePreset;
  start: Date | null;
  end: Date | null;
}

const PRESET_LABELS_TR: Record<DateRangePreset, string> = {
  today: 'Bugün',
  thisWeek: 'Bu Hafta',
  thisMonth: 'Bu Ay',
  last3Months: 'Son 3 Ay',
  thisYear: 'Bu Yıl',
  allTime: 'Tüm Zamanlar',
  custom: 'Özel Aralık...',
};

const PRESET_LABELS_EN: Record<DateRangePreset, string> = {
  today: 'Today',
  thisWeek: 'This Week',
  thisMonth: 'This Month',
  last3Months: 'Last 3 Months',
  thisYear: 'This Year',
  allTime: 'All Time',
  custom: 'Custom Range...',
};

const ORDERED_PRESETS: DateRangePreset[] = [
  'today',
  'thisWeek',
  'thisMonth',
  'last3Months',
  'thisYear',
  'allTime',
  'custom',
];

// dayjs startOf('week') defaults to Sunday. Turkish weeks start Monday — compute manually.
function startOfMondayWeek(d: dayjs.Dayjs): dayjs.Dayjs {
  const dow = d.day();
  const daysFromMonday = (dow + 6) % 7;
  return d.startOf('day').subtract(daysFromMonday, 'day');
}

export function computeRange(
  preset: DateRangePreset,
  customStart?: Date,
  customEnd?: Date
): DateRange {
  const today = dayjs();
  switch (preset) {
    case 'today':
      return { preset, start: today.startOf('day').toDate(), end: today.endOf('day').toDate() };
    case 'thisWeek': {
      const start = startOfMondayWeek(today);
      return { preset, start: start.toDate(), end: start.add(6, 'day').endOf('day').toDate() };
    }
    case 'thisMonth':
      return {
        preset,
        start: today.startOf('month').toDate(),
        end: today.endOf('month').toDate(),
      };
    case 'last3Months':
      return {
        preset,
        start: today.subtract(90, 'day').startOf('day').toDate(),
        end: today.endOf('day').toDate(),
      };
    case 'thisYear':
      return {
        preset,
        start: today.startOf('year').toDate(),
        end: today.endOf('year').toDate(),
      };
    case 'allTime':
      return { preset, start: null, end: null };
    case 'custom': {
      const s = customStart ? dayjs(customStart).startOf('day') : today.startOf('month');
      const e = customEnd ? dayjs(customEnd).endOf('day') : today.endOf('day');
      return { preset, start: s.toDate(), end: e.toDate() };
    }
  }
}

function formatRangeLabel(range: DateRange, locale: 'tr' | 'en'): string {
  if (range.preset !== 'custom') {
    return locale === 'tr' ? PRESET_LABELS_TR[range.preset] : PRESET_LABELS_EN[range.preset];
  }
  if (!range.start || !range.end) return '';
  const start = dayjs(range.start).locale(locale);
  const end = dayjs(range.end).locale(locale);
  const sameYear = start.year() === end.year();
  const startFmt = sameYear ? start.format('D MMM') : start.format('D MMM YYYY');
  const endFmt = end.format('D MMM YYYY');
  return `${startFmt} – ${endFmt}`;
}

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  const { theme } = useTheme();
  const language = useSettingsStore((s) => s.language);
  const sheetRef = useRef<BottomSheetModal>(null);
  const [view, setView] = useState<'presets' | 'custom'>('presets');
  const [customStart, setCustomStart] = useState<Date>(
    value.preset === 'custom' && value.start ? value.start : dayjs().startOf('month').toDate()
  );
  const [customEnd, setCustomEnd] = useState<Date>(
    value.preset === 'custom' && value.end ? value.end : new Date()
  );
  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);

  const labels = language === 'tr' ? PRESET_LABELS_TR : PRESET_LABELS_EN;
  const displayText = useMemo(() => formatRangeLabel(value, language), [value, language]);

  const open = () => {
    HapticFeedback.trigger('impactLight');
    setView(value.preset === 'custom' ? 'custom' : 'presets');
    sheetRef.current?.present();
  };

  const handlePresetPress = (p: DateRangePreset) => {
    HapticFeedback.trigger('impactLight');
    if (p === 'custom') {
      setView('custom');
      return;
    }
    onChange(computeRange(p));
    sheetRef.current?.dismiss();
  };

  const handleApplyCustom = () => {
    HapticFeedback.trigger('impactLight');
    const start = dayjs(customStart).startOf('day').toDate();
    const end = dayjs(customEnd).endOf('day').toDate();
    // If user inverted start/end, swap so the range stays valid.
    const ordered = start <= end ? { start, end } : { start: end, end: start };
    onChange({ preset: 'custom', start: ordered.start, end: ordered.end });
    sheetRef.current?.dismiss();
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  const snapPoints = useMemo(
    () => (view === 'custom' ? ['68%'] : ['62%']),
    [view]
  );

  return (
    <>
      <Pressable onPress={open}>
        <View
          style={[
            styles.row,
            {
              backgroundColor: theme.colors.bg.card,
              borderColor: theme.colors.border.card,
            },
          ]}>
          <Icon name="calendar" size={16} color={theme.colors.text.secondary} />
          <Text style={[styles.rowLabel, { color: theme.colors.text.primary }]} numberOfLines={1}>
            {displayText}
          </Text>
          <Icon name="chevron-down" size={16} color={theme.colors.text.secondary} />
        </View>
      </Pressable>

      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: theme.colors.border.card }}
        backgroundStyle={{ backgroundColor: theme.colors.bg.card }}>
        <BottomSheetView style={styles.sheetBody}>
          {view === 'presets' ? (
            <>
              <Text style={[styles.sheetTitle, { color: theme.colors.text.primary }]}>
                {language === 'tr' ? 'Tarih Aralığı' : 'Date Range'}
              </Text>
              <View
                style={[
                  styles.presetGroup,
                  {
                    backgroundColor: theme.colors.bg.page,
                    borderColor: theme.colors.border.card,
                  },
                ]}>
                {ORDERED_PRESETS.map((p, idx) => {
                  const active = value.preset === p;
                  const isLast = idx === ORDERED_PRESETS.length - 1;
                  return (
                    <React.Fragment key={p}>
                      <Pressable
                        onPress={() => handlePresetPress(p)}
                        android_ripple={{ color: theme.colors.border.card }}
                        style={styles.presetRow}>
                        <Text
                          style={[
                            styles.presetLabel,
                            {
                              color: active
                                ? theme.colors.brand.primary
                                : theme.colors.text.primary,
                              fontWeight: active ? '600' : '400',
                            },
                          ]}
                          numberOfLines={1}>
                          {labels[p]}
                        </Text>
                        {active && (
                          <Icon
                            name="check"
                            size={18}
                            color={theme.colors.brand.primary}
                          />
                        )}
                      </Pressable>
                      {!isLast && (
                        <View
                          style={[
                            styles.presetSeparator,
                            { backgroundColor: theme.colors.border.card },
                          ]}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </View>
            </>
          ) : (
            <CustomRangeView
              start={customStart}
              end={customEnd}
              activePicker={activePicker}
              onSelectStart={() => {
                HapticFeedback.trigger('impactLight');
                setActivePicker(activePicker === 'start' ? null : 'start');
              }}
              onSelectEnd={() => {
                HapticFeedback.trigger('impactLight');
                setActivePicker(activePicker === 'end' ? null : 'end');
              }}
              onChangeStart={(d: Date) => setCustomStart(d)}
              onChangeEnd={(d: Date) => setCustomEnd(d)}
              onBack={() => {
                HapticFeedback.trigger('impactLight');
                setView('presets');
                setActivePicker(null);
              }}
              onApply={handleApplyCustom}
              language={language}
            />
          )}
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
}

interface CustomRangeViewProps {
  start: Date;
  end: Date;
  activePicker: 'start' | 'end' | null;
  onSelectStart: () => void;
  onSelectEnd: () => void;
  onChangeStart: (d: Date) => void;
  onChangeEnd: (d: Date) => void;
  onBack: () => void;
  onApply: () => void;
  language: 'tr' | 'en';
}

function CustomRangeView({
  start,
  end,
  activePicker,
  onSelectStart,
  onSelectEnd,
  onChangeStart,
  onChangeEnd,
  onBack,
  onApply,
  language,
}: CustomRangeViewProps) {
  const { theme } = useTheme();
  const fmt = (d: Date) => dayjs(d).locale(language).format('D MMMM YYYY');

  const handlePickerChange = (
    which: 'start' | 'end'
  ) => (_: DateTimePickerEvent, d?: Date) => {
    if (!d) return;
    if (which === 'start') onChangeStart(d);
    else onChangeEnd(d);
  };

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.customHeader}>
        <Pressable onPress={onBack} hitSlop={8} style={styles.backBtn}>
          <Icon name="chevron-left" size={22} color={theme.colors.text.primary} />
        </Pressable>
        <Text style={[styles.sheetTitle, { color: theme.colors.text.primary, flex: 1 }]}>
          {language === 'tr' ? 'Özel Aralık' : 'Custom Range'}
        </Text>
      </View>

      <Pressable
        onPress={onSelectStart}
        style={[
          styles.dateRow,
          {
            backgroundColor: theme.colors.bg.page,
            borderColor:
              activePicker === 'start' ? theme.colors.brand.primary : theme.colors.border.card,
          },
        ]}>
        <Text style={[styles.dateRowLabel, { color: theme.colors.text.secondary }]}>
          {language === 'tr' ? 'Başlangıç' : 'Start'}
        </Text>
        <Text style={[styles.dateRowValue, { color: theme.colors.text.primary }]}>
          {fmt(start)}
        </Text>
      </Pressable>
      {activePicker === 'start' && (
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={start}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'spinner'}
            maximumDate={end}
            onChange={handlePickerChange('start')}
            themeVariant={theme.isDark ? 'dark' : 'light'}
            locale={language === 'tr' ? 'tr-TR' : 'en-US'}
            style={styles.picker}
          />
        </View>
      )}

      <Pressable
        onPress={onSelectEnd}
        style={[
          styles.dateRow,
          {
            backgroundColor: theme.colors.bg.page,
            borderColor:
              activePicker === 'end' ? theme.colors.brand.primary : theme.colors.border.card,
          },
        ]}>
        <Text style={[styles.dateRowLabel, { color: theme.colors.text.secondary }]}>
          {language === 'tr' ? 'Bitiş' : 'End'}
        </Text>
        <Text style={[styles.dateRowValue, { color: theme.colors.text.primary }]}>
          {fmt(end)}
        </Text>
      </Pressable>
      {activePicker === 'end' && (
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={end}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'spinner'}
            minimumDate={start}
            maximumDate={new Date()}
            onChange={handlePickerChange('end')}
            themeVariant={theme.isDark ? 'dark' : 'light'}
            locale={language === 'tr' ? 'tr-TR' : 'en-US'}
            style={styles.picker}
          />
        </View>
      )}

      <Button title={language === 'tr' ? 'Uygula' : 'Apply'} onPress={onApply} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  sheetBody: {
    padding: 16,
    paddingBottom: 24,
    gap: 12,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  presetGroup: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    paddingHorizontal: 16,
  },
  presetLabel: {
    flex: 1,
    fontSize: 15,
  },
  presetSeparator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateRow: {
    height: 56,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    gap: 2,
  },
  dateRowLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  dateRowValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  pickerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  picker: {
    alignSelf: 'stretch',
    height: 180,
  },
});
