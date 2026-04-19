import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
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
import { formatLongDate } from '../../utils/date';

interface DateFieldProps {
  value: Date;
  onChange: (d: Date) => void;
  maximumDate?: Date | null;
  minimumDate?: Date | null;
  sheetTitle?: string;
}

export function DateField({
  value,
  onChange,
  maximumDate = new Date(),
  minimumDate,
  sheetTitle = 'Tarih Seç',
}: DateFieldProps) {
  const { theme } = useTheme();
  const language = useSettingsStore((s) => s.language);
  const sheetRef = useRef<BottomSheetModal>(null);
  const [draft, setDraft] = useState<Date>(value);

  const formatted = useMemo(
    () => formatLongDate(value.toISOString(), language),
    [value, language]
  );

  const handlePress = () => {
    HapticFeedback.trigger('impactLight');
    setDraft(value);
    sheetRef.current?.present();
  };

  const handlePickerChange = (_: DateTimePickerEvent, d?: Date) => {
    if (d) setDraft(d);
  };

  const handleDone = () => {
    onChange(draft);
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

  return (
    <>
      <Pressable onPress={handlePress}>
        <View
          style={[
            styles.row,
            {
              backgroundColor: theme.colors.bg.card,
              borderColor: theme.colors.border.card,
            },
          ]}>
          <Icon name="calendar" size={18} color={theme.colors.text.secondary} />
          <Text style={[styles.label, { color: theme.colors.text.primary }]}>
            {formatted}
          </Text>
          <Icon
            name="chevron-down"
            size={18}
            color={theme.colors.text.secondary}
          />
        </View>
      </Pressable>

      <BottomSheetModal
        ref={sheetRef}
        snapPoints={['46%']}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: theme.colors.border.card }}
        backgroundStyle={{ backgroundColor: theme.colors.bg.card }}>
        <BottomSheetView style={styles.pickerSheet}>
          <Text style={[styles.sheetTitle, { color: theme.colors.text.primary }]}>
            {sheetTitle}
          </Text>
          <View style={styles.pickerContainer}>
            <DateTimePicker
              value={draft}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'spinner'}
              maximumDate={maximumDate ?? undefined}
              minimumDate={minimumDate ?? undefined}
              onChange={handlePickerChange}
              themeVariant={theme.isDark ? 'dark' : 'light'}
              locale={language === 'tr' ? 'tr-TR' : 'en-US'}
              style={styles.picker}
            />
          </View>
          <Button title="Bitti" onPress={handleDone} />
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 50,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  pickerSheet: {
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
  pickerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  picker: {
    alignSelf: 'stretch',
  },
});
