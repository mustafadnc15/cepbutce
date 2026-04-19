import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, Keyboard, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import type {
  BottomSheetBackdropProps,
  BottomSheetFooterProps,
} from '@gorhom/bottom-sheet';
import Icon from '@react-native-vector-icons/feather';
import HapticFeedback from 'react-native-haptic-feedback';
import Toast from 'react-native-toast-message';

import { useTheme } from '../theme';
import { Button, SectionHeader } from '../components/ui';
import { useSettingsStore } from '../stores/useSettingsStore';
import {
  FREE_ACTIVE_SUBSCRIPTION_LIMIT,
  useSubscriptionStore,
} from '../stores/useSubscriptionStore';
import {
  cancelReminder,
  requestNotificationPermissions,
  scheduleSubscriptionReminder,
} from '../services/notifications';
import { DEFAULT_CATEGORIES } from '../constants/categories';
import { SUBSCRIPTION_COLORS } from '../constants/subscriptionColors';
import type { BillingCycle, Subscription } from '../types';
import type { PopularService } from '../constants/popularServices';

import { AmountKeypad } from '../components/transactions/AmountKeypad';
import { CategoryPicker } from '../components/transactions/CategoryPicker';
import { DateField } from '../components/transactions/DateField';
import { PopularServicesRow } from '../components/subscriptions/PopularServicesRow';
import { CyclePicker } from '../components/subscriptions/CyclePicker';
import { ReminderRow } from '../components/subscriptions/ReminderRow';
import { ColorPicker } from '../components/subscriptions/ColorPicker';

const CURRENCY_SYMBOLS: Record<string, string> = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

function getSymbol(code: string): string {
  return CURRENCY_SYMBOLS[code] ?? code;
}

function formatAmountInput(raw: string, symbol: string, locale: 'tr' | 'en'): string {
  const thousandsSep = locale === 'tr' ? '.' : ',';
  const decimalSep = locale === 'tr' ? ',' : '.';
  const dotIdx = raw.indexOf('.');
  const intPart = dotIdx === -1 ? raw : raw.substring(0, dotIdx);
  const decPart = dotIdx === -1 ? null : raw.substring(dotIdx + 1);

  let grouped = '';
  for (let i = 0; i < intPart.length; i++) {
    if (i > 0 && (intPart.length - i) % 3 === 0) grouped += thousandsSep;
    grouped += intPart[i];
  }
  return symbol + grouped + (decPart !== null ? decimalSep + decPart : '');
}

function toRawAmount(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0';
  const fixed = n.toFixed(2);
  const trimmed = fixed.replace(/\.?0+$/, '');
  return trimmed.length === 0 ? '0' : trimmed;
}

export interface AddSubscriptionSheetHandle {
  present: (opts?: PresentOptions) => void;
  dismiss: () => void;
}

export interface PresentOptions {
  subscription?: Subscription;
}

export const AddSubscriptionSheet = forwardRef<AddSubscriptionSheetHandle>(
  function AddSubscriptionSheet(_props, ref) {
    const { theme } = useTheme();
    const modalRef = useRef<BottomSheetModal>(null);

    const language = useSettingsStore((s) => s.language);
    const defaultCurrency = useSettingsStore((s) => s.currency);
    const isPremium = useSettingsStore((s) => s.isPremium);

    const addSubscription = useSubscriptionStore((s) => s.add);
    const updateSubscription = useSubscriptionStore((s) => s.update);
    const deleteSubscription = useSubscriptionStore((s) => s.delete);
    const canAddActive = useSubscriptionStore((s) => s.canAddActive);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState<string>('');
    const [rawAmount, setRawAmount] = useState<string>('0');
    const [cycle, setCycle] = useState<BillingCycle>('monthly');
    const [categoryId, setCategoryId] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [reminderEnabled, setReminderEnabled] = useState<boolean>(true);
    const [remindBefore, setRemindBefore] = useState<number>(3);
    const [color, setColor] = useState<string>(SUBSCRIPTION_COLORS[3]);
    const [note, setNote] = useState<string>('');
    const [currency, setCurrency] = useState<string>(defaultCurrency);
    const [icon, setIcon] = useState<string>('repeat');
    const [autoCreateTransactions, setAutoCreateTransactions] = useState<boolean>(true);

    const tr = language === 'tr';

    const resetForNew = useCallback(() => {
      setEditingId(null);
      setName('');
      setRawAmount('0');
      setCycle('monthly');
      setCategoryId(null);
      setStartDate(new Date());
      setReminderEnabled(true);
      setRemindBefore(3);
      setColor(SUBSCRIPTION_COLORS[3]);
      setNote('');
      setCurrency(defaultCurrency);
      setIcon('repeat');
      setAutoCreateTransactions(true);
    }, [defaultCurrency]);

    const loadFromSubscription = useCallback((sub: Subscription) => {
      setEditingId(sub.id);
      setName(sub.name);
      setRawAmount(toRawAmount(sub.amount));
      setCycle(sub.billingCycle);
      setCategoryId(sub.categoryId);
      setStartDate(new Date(sub.startDate));
      setReminderEnabled(sub.remindBefore > 0);
      setRemindBefore(sub.remindBefore > 0 ? sub.remindBefore : 3);
      setColor(sub.color);
      setNote(sub.note ?? '');
      setCurrency(sub.currency);
      setIcon(sub.icon);
      setAutoCreateTransactions(sub.autoCreateTransactions);
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        present: (opts) => {
          if (opts?.subscription) {
            loadFromSubscription(opts.subscription);
          } else {
            resetForNew();
          }
          modalRef.current?.present();
        },
        dismiss: () => modalRef.current?.dismiss(),
      }),
      [loadFromSubscription, resetForNew]
    );

    const amount = useMemo(() => {
      const n = parseFloat(rawAmount);
      return Number.isFinite(n) ? n : 0;
    }, [rawAmount]);

    const displayAmount = useMemo(
      () => formatAmountInput(rawAmount, getSymbol(currency), language),
      [rawAmount, currency, language]
    );

    const canSave =
      amount > 0 && name.trim().length > 0 && categoryId !== null;

    const handleQuickPick = useCallback(
      (service: PopularService) => {
        setName(service.name);
        setRawAmount(toRawAmount(service.defaultAmount));
        setCycle(service.defaultCycle);
        setColor(service.color);
        setIcon(service.icon);
        setCategoryId(service.categoryId);
      },
      []
    );

    const handleSave = useCallback(async () => {
      if (!canSave || !categoryId) return;
      Keyboard.dismiss();

      const effectiveRemind = reminderEnabled ? remindBefore : 0;

      if (editingId) {
        // Edits intentionally don't touch nextRenewalDate — the user is
        // amending sub metadata, not resetting the renewal cadence. Past txns
        // already exist for prior renewals; future renewals will use the new
        // amount/category when they fire.
        updateSubscription(editingId, {
          name: name.trim(),
          amount,
          currency,
          billingCycle: cycle,
          categoryId,
          startDate: startDate.toISOString(),
          icon,
          color,
          note: note.trim() ? note.trim() : null,
          remindBefore: effectiveRemind,
          autoCreateTransactions,
        });

        // Rebuild reminder: cancel old, schedule fresh if still enabled + active.
        await cancelReminder(editingId);
        const updated = useSubscriptionStore.getState().subscriptions.find(
          (s) => s.id === editingId
        );
        if (updated && updated.isActive && effectiveRemind > 0) {
          await scheduleSubscriptionReminder(updated, language);
        }

        HapticFeedback.trigger('notificationSuccess');
        Toast.show({
          type: 'success',
          text1: tr ? 'Abonelik güncellendi ✓' : 'Subscription updated ✓',
        });
      } else {
        if (!canAddActive()) {
          Toast.show({
            type: 'info',
            text1: tr ? 'Abonelik limiti' : 'Subscription limit',
            text2: tr
              ? `Ücretsiz planda en fazla ${FREE_ACTIVE_SUBSCRIPTION_LIMIT} abonelik.`
              : `Free plan limit: ${FREE_ACTIVE_SUBSCRIPTION_LIMIT} subscriptions.`,
          });
          return;
        }

        // Permission prompt only when the user has opted in to reminders.
        // Saves the sub regardless of permission outcome so we never block the
        // flow; reminder simply won't fire without permission.
        if (effectiveRemind > 0) {
          await requestNotificationPermissions();
        }

        // Store derives nextRenewalDate from startDate + cycle and backfills
        // historical txns when autoCreateTransactions is on.
        const created = addSubscription({
          name: name.trim(),
          amount,
          currency,
          billingCycle: cycle,
          categoryId,
          startDate: startDate.toISOString(),
          icon,
          color,
          note: note.trim() ? note.trim() : null,
          isActive: true,
          remindBefore: effectiveRemind,
          autoCreateTransactions,
        });
        if (!created) return;

        if (effectiveRemind > 0) {
          await scheduleSubscriptionReminder(created, language);
        }

        HapticFeedback.trigger('notificationSuccess');
        Toast.show({
          type: 'success',
          text1: tr ? 'Abonelik eklendi ✓' : 'Subscription added ✓',
        });
      }
      modalRef.current?.dismiss();
    }, [
      canSave,
      categoryId,
      startDate,
      cycle,
      reminderEnabled,
      remindBefore,
      editingId,
      updateSubscription,
      name,
      amount,
      currency,
      icon,
      color,
      note,
      language,
      tr,
      canAddActive,
      addSubscription,
      autoCreateTransactions,
    ]);

    const handleDelete = useCallback(() => {
      if (!editingId) return;
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
            onPress: async () => {
              await cancelReminder(editingId);
              deleteSubscription(editingId);
              HapticFeedback.trigger('notificationSuccess');
              Toast.show({
                type: 'info',
                text1: tr ? 'Abonelik silindi' : 'Subscription deleted',
              });
              modalRef.current?.dismiss();
            },
          },
        ],
        { cancelable: true }
      );
    }, [editingId, deleteSubscription, tr]);

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

    const renderFooter = useCallback(
      (props: BottomSheetFooterProps) => (
        <BottomSheetFooter {...props} bottomInset={0}>
          <View
            style={[
              styles.footer,
              {
                backgroundColor: theme.colors.bg.card,
                borderTopColor: theme.colors.border.card,
              },
            ]}>
            <Button
              title={
                editingId
                  ? tr
                    ? 'Güncelle'
                    : 'Update'
                  : tr
                  ? 'Abonelik Ekle'
                  : 'Add Subscription'
              }
              onPress={handleSave}
              disabled={!canSave}
            />
          </View>
        </BottomSheetFooter>
      ),
      [theme, editingId, canSave, handleSave, tr]
    );

    const handleRequestCustom = useCallback(() => {
      Toast.show({
        type: 'info',
        text1: tr ? 'Özel kategori' : 'Custom category',
        text2: tr
          ? 'Özel kategoriler Faz 7\'de geliyor.'
          : 'Custom categories arrive in Phase 7.',
      });
    }, [tr]);

    return (
      <BottomSheetModal
        ref={modalRef}
        snapPoints={['90%']}
        enablePanDownToClose
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        backdropComponent={renderBackdrop}
        footerComponent={renderFooter}
        handleIndicatorStyle={{ backgroundColor: theme.colors.border.card }}
        backgroundStyle={{ backgroundColor: theme.colors.bg.card }}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            {editingId
              ? tr
                ? 'Aboneliği Düzenle'
                : 'Edit Subscription'
              : tr
              ? 'Yeni Abonelik'
              : 'New Subscription'}
          </Text>
          {editingId && (
            <Pressable onPress={handleDelete} hitSlop={10} style={styles.deleteBtn}>
              <Icon name="trash-2" size={20} color={theme.colors.semantic.error} />
            </Pressable>
          )}
        </View>

        <BottomSheetScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          {!editingId && (
            <View style={styles.section}>
              <SectionHeader title={tr ? 'Popüler Servisler' : 'Popular Services'} />
              <PopularServicesRow onPick={handleQuickPick} />
            </View>
          )}

          <View style={styles.section}>
            <SectionHeader title={tr ? 'Ad' : 'Name'} />
            <BottomSheetTextInput
              value={name}
              onChangeText={setName}
              placeholder={tr ? 'Ör. Netflix' : 'e.g. Netflix'}
              placeholderTextColor={theme.colors.text.placeholder}
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.colors.bg.card,
                  borderColor: theme.colors.border.card,
                  color: theme.colors.text.primary,
                },
              ]}
              maxLength={60}
            />
          </View>

          <View style={styles.amountBlock}>
            <Text
              style={[styles.amountText, { color: color }]}
              numberOfLines={1}
              adjustsFontSizeToFit>
              {displayAmount}
            </Text>
          </View>

          <AmountKeypad value={rawAmount} onChange={setRawAmount} locale={language} />

          <View style={styles.section}>
            <SectionHeader title={tr ? 'Dönem' : 'Cycle'} />
            <CyclePicker value={cycle} onChange={setCycle} />
          </View>

          <View style={styles.section}>
            <SectionHeader title={tr ? 'Kategori' : 'Category'} />
            <CategoryPicker
              type="expense"
              selectedId={categoryId}
              onSelect={setCategoryId}
              onRequestCustom={handleRequestCustom}
              isPremium={isPremium}
            />
          </View>

          <View style={styles.section}>
            <SectionHeader title={tr ? 'İlk Fatura Tarihi' : 'First Billing Date'} />
            <DateField
              value={startDate}
              onChange={setStartDate}
              maximumDate={null}
              sheetTitle={tr ? 'Tarih Seç' : 'Pick Date'}
            />
          </View>

          <View style={styles.section}>
            <SectionHeader title={tr ? 'Hatırlatma' : 'Reminder'} />
            <ReminderRow
              enabled={reminderEnabled}
              daysBefore={remindBefore}
              onChange={(next, days) => {
                setReminderEnabled(next);
                setRemindBefore(days);
              }}
            />
          </View>

          <View style={styles.section}>
            <SectionHeader title={tr ? 'Otomatik İşlem' : 'Auto Transaction'} />
            <View
              style={[
                styles.autoRow,
                {
                  backgroundColor: theme.colors.bg.card,
                  borderColor: theme.colors.border.card,
                },
              ]}>
              <View style={styles.autoTextWrap}>
                <Text style={[styles.autoTitle, { color: theme.colors.text.primary }]}>
                  {tr ? 'Yenilemelerde işlem oluştur' : 'Create transaction on renewal'}
                </Text>
                <Text style={[styles.autoSub, { color: theme.colors.text.secondary }]}>
                  {tr
                    ? 'Her yenileme tarihinde otomatik gider kaydı eklenir.'
                    : 'An expense entry is added every renewal day.'}
                </Text>
              </View>
              <Switch
                value={autoCreateTransactions}
                onValueChange={setAutoCreateTransactions}
                trackColor={{
                  false: theme.colors.border.card,
                  true: theme.colors.brand.primary,
                }}
              />
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader title={tr ? 'Renk' : 'Color'} />
            <View
              style={[
                styles.colorWrap,
                {
                  backgroundColor: theme.colors.bg.card,
                  borderColor: theme.colors.border.card,
                },
              ]}>
              <ColorPicker value={color} onChange={setColor} />
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader title={tr ? 'Not (İsteğe Bağlı)' : 'Note (Optional)'} />
            <BottomSheetTextInput
              value={note}
              onChangeText={setNote}
              placeholder={tr ? 'Not ekle...' : 'Add a note...'}
              placeholderTextColor={theme.colors.text.placeholder}
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.colors.bg.card,
                  borderColor: theme.colors.border.card,
                  color: theme.colors.text.primary,
                },
              ]}
              maxLength={140}
            />
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  }
);

const FOOTER_HEIGHT = 82;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: FOOTER_HEIGHT + 24,
    gap: 16,
  },
  section: {
    gap: 0,
  },
  textInput: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 50,
    fontSize: 14,
    fontWeight: '400',
  },
  amountBlock: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  amountText: {
    fontSize: 32,
    fontWeight: '700',
  },
  colorWrap: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
  },
  autoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
  },
  autoTextWrap: {
    flex: 1,
    gap: 2,
  },
  autoTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  autoSub: {
    fontSize: 12,
    fontWeight: '400',
  },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
