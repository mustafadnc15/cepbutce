import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from '@react-native-vector-icons/feather';
import HapticFeedback from 'react-native-haptic-feedback';
import Toast from 'react-native-toast-message';
import FastImage from '@d11/react-native-fast-image';

import { useTheme } from '../../theme';

interface ReceiptAttachmentRowProps {
  value: string | null;
  onChange: (uri: string | null) => void;
}

// Stub for Phase 2 — real camera + gallery pickers land in Phase 5 along with the
// OCR pipeline (image-crop-picker, react-native-fs, Info.plist/manifest perms).
// Keeps the (value, onChange) API stable so Phase 5 only swaps the handlers.
export function ReceiptAttachmentRow({ value, onChange }: ReceiptAttachmentRowProps) {
  const { theme } = useTheme();

  const handlePress = () => {
    HapticFeedback.trigger('impactLight');
    Toast.show({
      type: 'info',
      text1: 'Fiş ekleme',
      text2: "Fiş tarama özelliği Faz 5'te geliyor.",
    });
  };

  const handleRemove = () => {
    HapticFeedback.trigger('impactLight');
    onChange(null);
  };

  if (value) {
    return (
      <View
        style={[
          styles.thumbRow,
          { backgroundColor: theme.colors.bg.card, borderColor: theme.colors.border.card },
        ]}>
        <FastImage source={{ uri: value }} style={styles.thumb} />
        <Text style={[styles.thumbLabel, { color: theme.colors.text.primary }]}>
          Fiş eklendi
        </Text>
        <Pressable onPress={handleRemove} hitSlop={8} style={styles.removeBtn}>
          <Icon name="x" size={16} color={theme.colors.text.secondary} />
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable onPress={handlePress}>
      <View
        style={[
          styles.row,
          {
            backgroundColor: theme.colors.bg.card,
            borderColor: theme.colors.border.card,
          },
        ]}>
        <Icon name="camera" size={18} color={theme.colors.text.secondary} />
        <Text style={[styles.label, { color: theme.colors.text.primary }]}>
          Fiş Ekle
        </Text>
        <Icon
          name="chevron-right"
          size={18}
          color={theme.colors.text.secondary}
        />
      </View>
    </Pressable>
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
  thumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 76,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  thumbLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
