import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import Icon from '@react-native-vector-icons/feather';
import HapticFeedback from 'react-native-haptic-feedback';

import { useTheme } from '../../theme';

export interface OptionSheetItem {
  value: string;
  label: string;
  sublabel?: string;
  leading?: string;
}

export interface OptionSheetHandle {
  present: () => void;
  dismiss: () => void;
}

interface Props {
  title: string;
  items: OptionSheetItem[];
  selectedValue: string;
  onSelect: (value: string) => void;
  snapPoints?: string[];
}

// Reusable bottom-sheet list of selectable options. Callers that need a
// narrower value type (enum, union) serialize to/from string at the edges.
export const OptionSheet = forwardRef<OptionSheetHandle, Props>(
  function OptionSheet(
    { title, items, selectedValue, onSelect, snapPoints = ['60%'] },
    ref
  ) {
    const { theme } = useTheme();
    const modalRef = useRef<BottomSheetModal>(null);

    useImperativeHandle(
      ref,
      () => ({
        present: () => modalRef.current?.present(),
        dismiss: () => modalRef.current?.dismiss(),
      }),
      []
    );

    const snaps = useMemo(() => snapPoints, [snapPoints]);

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

    const handlePick = useCallback(
      (value: string) => {
        HapticFeedback.trigger('impactLight');
        onSelect(value);
        modalRef.current?.dismiss();
      },
      [onSelect]
    );

    return (
      <BottomSheetModal
        ref={modalRef}
        snapPoints={snaps}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: theme.colors.border.card }}
        backgroundStyle={{ backgroundColor: theme.colors.bg.card }}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>{title}</Text>
        </View>
        <BottomSheetScrollView contentContainerStyle={styles.list}>
          {items.map((opt) => {
            const isSelected = opt.value === selectedValue;
            return (
              <Pressable
                key={opt.value}
                onPress={() => handlePick(opt.value)}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: pressed
                      ? theme.colors.bg.page
                      : 'transparent',
                  },
                ]}>
                {opt.leading ? (
                  <View
                    style={[
                      styles.leadingBox,
                      { backgroundColor: theme.colors.bg.page },
                    ]}>
                    <Text
                      style={[styles.leadingText, { color: theme.colors.text.primary }]}>
                      {opt.leading}
                    </Text>
                  </View>
                ) : null}
                <View style={styles.rowText}>
                  <Text style={[styles.label, { color: theme.colors.text.primary }]}>
                    {opt.label}
                  </Text>
                  {opt.sublabel ? (
                    <Text
                      style={[styles.sublabel, { color: theme.colors.text.secondary }]}>
                      {opt.sublabel}
                    </Text>
                  ) : null}
                </View>
                {isSelected ? (
                  <Icon name="check" size={20} color={theme.colors.brand.primary} />
                ) : null}
              </Pressable>
            );
          })}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  list: {
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 14,
  },
  leadingBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadingText: {
    fontSize: 17,
    fontWeight: '600',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  sublabel: {
    fontSize: 13,
    fontWeight: '400',
  },
});
