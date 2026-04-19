import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import Icon from '@react-native-vector-icons/feather';
import HapticFeedback from 'react-native-haptic-feedback';
import Toast from 'react-native-toast-message';

import { useTheme } from '../../theme';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useSubscriptionStore } from '../../stores/useSubscriptionStore';
import { cancelReminder } from '../../services/notifications';
import type { Subscription } from '../../types';

export interface SubscriptionActionSheetHandle {
  present: (sub: Subscription) => void;
  dismiss: () => void;
}

interface SubscriptionActionSheetProps {
  onEdit: (sub: Subscription) => void;
}

export const SubscriptionActionSheet = forwardRef<
  SubscriptionActionSheetHandle,
  SubscriptionActionSheetProps
>(function SubscriptionActionSheet({ onEdit }, ref) {
  const { theme } = useTheme();
  const modalRef = useRef<BottomSheetModal>(null);
  const [target, setTarget] = useState<Subscription | null>(null);

  const language = useSettingsStore((s) => s.language);
  const toggleActive = useSubscriptionStore((s) => s.toggleActive);
  const deleteSub = useSubscriptionStore((s) => s.delete);

  useImperativeHandle(
    ref,
    () => ({
      present: (sub) => {
        setTarget(sub);
        modalRef.current?.present();
      },
      dismiss: () => modalRef.current?.dismiss(),
    }),
    []
  );

  const tr = language === 'tr';

  const handleEdit = useCallback(() => {
    if (!target) return;
    const sub = target;
    modalRef.current?.dismiss();
    // Let the sheet finish dismissing before presenting the edit sheet,
    // otherwise gorhom bottom-sheet stacking gets confused on iOS.
    setTimeout(() => onEdit(sub), 260);
  }, [onEdit, target]);

  const handleToggle = useCallback(() => {
    if (!target) return;
    const ok = toggleActive(target.id);
    modalRef.current?.dismiss();
    if (!ok) {
      // Blocked by the free-tier activation limit. Surface it so the user
      // isn't left wondering why the state didn't change.
      Toast.show({
        type: 'info',
        text1: tr ? 'Abonelik limiti' : 'Subscription limit',
        text2: tr
          ? "Aktifleştirmek için Premium'a geçin."
          : 'Upgrade to Premium to activate more.',
      });
      return;
    }
    if (target.isActive) {
      cancelReminder(target.id);
    }
    Toast.show({
      type: 'success',
      text1: target.isActive
        ? tr
          ? 'Pasife alındı'
          : 'Moved to inactive'
        : tr
        ? 'Aktifleştirildi'
        : 'Activated',
    });
  }, [target, toggleActive, tr]);

  const handleDelete = useCallback(() => {
    if (!target) return;
    const sub = target;
    modalRef.current?.dismiss();
    setTimeout(() => {
      Alert.alert(
        tr ? 'Aboneliği Sil' : 'Delete Subscription',
        tr
          ? 'Bu aboneliği silmek istediğinize emin misiniz?'
          : 'Are you sure you want to delete this subscription?',
        [
          { text: tr ? 'Vazgeç' : 'Cancel', style: 'cancel' },
          {
            text: tr ? 'Sil' : 'Delete',
            style: 'destructive',
            onPress: () => {
              deleteSub(sub.id);
              cancelReminder(sub.id);
              HapticFeedback.trigger('notificationSuccess');
              Toast.show({ type: 'info', text1: tr ? 'Abonelik silindi' : 'Subscription deleted' });
            },
          },
        ],
        { cancelable: true }
      );
    }, 260);
  }, [deleteSub, target, tr]);

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
    <BottomSheetModal
      ref={modalRef}
      snapPoints={['42%']}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: theme.colors.border.card }}
      backgroundStyle={{ backgroundColor: theme.colors.bg.card }}>
      <BottomSheetView style={styles.sheet}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]} numberOfLines={1}>
          {target?.name ?? ''}
        </Text>
        <View
          style={[
            styles.group,
            {
              backgroundColor: theme.colors.bg.page,
              borderColor: theme.colors.border.card,
            },
          ]}>
          <OptionRow
            icon="edit-2"
            label={tr ? 'Düzenle' : 'Edit'}
            onPress={handleEdit}
            color={theme.colors.text.primary}
            separator
          />
          <OptionRow
            icon={target?.isActive ? 'pause-circle' : 'play-circle'}
            label={
              target?.isActive
                ? tr
                  ? 'Pasife Al'
                  : 'Deactivate'
                : tr
                ? 'Aktifleştir'
                : 'Activate'
            }
            onPress={handleToggle}
            color={theme.colors.text.primary}
            separator
          />
          <OptionRow
            icon="trash-2"
            label={tr ? 'Sil' : 'Delete'}
            onPress={handleDelete}
            color={theme.colors.semantic.error}
          />
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

interface OptionRowProps {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
  separator?: boolean;
}

function OptionRow({ icon, label, color, onPress, separator }: OptionRowProps) {
  const { theme } = useTheme();
  return (
    <>
      <Pressable
        onPress={onPress}
        android_ripple={{ color: theme.colors.border.card }}
        style={styles.row}>
        <Icon name={icon as any} size={20} color={color} />
        <Text style={[styles.rowLabel, { color }]}>{label}</Text>
      </Pressable>
      {separator && (
        <View style={[styles.separator, { backgroundColor: theme.colors.border.card }]} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  sheet: {
    padding: 16,
    paddingBottom: 24,
    gap: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  group: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    height: 54,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 50,
  },
});
