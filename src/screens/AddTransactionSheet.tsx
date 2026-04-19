import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
import { useTransactionStore } from '../stores/useTransactionStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { checkBudgetThresholds } from '../services/budgetAlerts';
import type { Transaction, TransactionType } from '../types';
import { DEFAULT_CATEGORIES } from '../constants/categories';

import { ExpenseIncomeToggle } from '../components/transactions/ExpenseIncomeToggle';
import { AmountKeypad } from '../components/transactions/AmountKeypad';
import { CategoryPicker } from '../components/transactions/CategoryPicker';
import { DateField } from '../components/transactions/DateField';
import { ReceiptAttachmentRow } from '../components/transactions/ReceiptAttachmentRow';

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
  // Strip trailing zeros but keep at least an integer
  const trimmed = fixed.replace(/\.?0+$/, '');
  return trimmed.length === 0 ? '0' : trimmed;
}

export interface AddTransactionSheetHandle {
  present: (opts?: PresentOptions) => void;
  dismiss: () => void;
}

export interface PresentOptions {
  transaction?: Transaction;
  initialType?: TransactionType;
}

export const AddTransactionSheet = forwardRef<AddTransactionSheetHandle>(
  function AddTransactionSheet(_props, ref) {
    const { theme } = useTheme();
    const modalRef = useRef<BottomSheetModal>(null);

    const language = useSettingsStore((s) => s.language);
    const defaultCurrency = useSettingsStore((s) => s.currency);
    const isPremium = useSettingsStore((s) => s.isPremium);

    const addTransaction = useTransactionStore((s) => s.addTransaction);
    const updateTransaction = useTransactionStore((s) => s.updateTransaction);
    const deleteTransaction = useTransactionStore((s) => s.deleteTransaction);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [type, setType] = useState<TransactionType>('expense');
    const [rawAmount, setRawAmount] = useState<string>('0');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [date, setDate] = useState<Date>(new Date());
    const [note, setNote] = useState<string>('');
    const [receiptUri, setReceiptUri] = useState<string | null>(null);
    const [currency, setCurrency] = useState<string>(defaultCurrency);

    const resetForNew = useCallback(
      (initialType: TransactionType = 'expense') => {
        setEditingId(null);
        setType(initialType);
        setRawAmount('0');
        setSelectedCategoryId(null);
        setDate(new Date());
        setNote('');
        setReceiptUri(null);
        setCurrency(defaultCurrency);
      },
      [defaultCurrency]
    );

    const loadFromTransaction = useCallback((tx: Transaction) => {
      setEditingId(tx.id);
      setType(tx.type);
      setRawAmount(toRawAmount(tx.amount));
      setSelectedCategoryId(tx.categoryId);
      setDate(new Date(tx.date));
      setNote(tx.note ?? '');
      setReceiptUri(tx.receiptUri ?? null);
      setCurrency(tx.currency);
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        present: (opts) => {
          if (opts?.transaction) {
            loadFromTransaction(opts.transaction);
          } else {
            resetForNew(opts?.initialType ?? 'expense');
          }
          modalRef.current?.present();
        },
        dismiss: () => modalRef.current?.dismiss(),
      }),
      [loadFromTransaction, resetForNew]
    );

    // When the user flips type, the previously selected category may no longer belong
    // to the new type — clear it so the selection stays consistent.
    useEffect(() => {
      if (!selectedCategoryId) return;
      const cat = DEFAULT_CATEGORIES.find((c) => c.id === selectedCategoryId);
      if (cat && cat.type !== type) setSelectedCategoryId(null);
    }, [type, selectedCategoryId]);

    const amount = useMemo(() => {
      const n = parseFloat(rawAmount);
      return Number.isFinite(n) ? n : 0;
    }, [rawAmount]);

    const displayAmount = useMemo(
      () => formatAmountInput(rawAmount, getSymbol(currency), language),
      [rawAmount, currency, language]
    );

    const canSave = amount > 0 && selectedCategoryId !== null;

    const accentColor =
      type === 'expense' ? theme.colors.semantic.expense : theme.colors.brand.primary;

    const handleSave = useCallback(() => {
      if (!canSave || !selectedCategoryId) return;
      Keyboard.dismiss();

      if (editingId) {
        updateTransaction(editingId, {
          amount,
          currency,
          type,
          categoryId: selectedCategoryId,
          note: note.trim() ? note.trim() : null,
          date: date.toISOString(),
          receiptUri,
        });
        HapticFeedback.trigger('notificationSuccess');
        Toast.show({
          type: 'success',
          text1: 'İşlem güncellendi ✓',
        });
      } else {
        addTransaction({
          amount,
          currency,
          type,
          categoryId: selectedCategoryId,
          note: note.trim() ? note.trim() : null,
          date: date.toISOString(),
          receiptUri,
          receiptOcrData: null,
          subscriptionId: null,
        });
        HapticFeedback.trigger('notificationSuccess');
        Toast.show({
          type: 'success',
          text1: type === 'expense' ? 'Harcama kaydedildi ✓' : 'Gelir kaydedildi ✓',
        });
      }

      // Fire-and-forget — an expense may have crossed a budget threshold.
      // Never block the save UX if notifee is unavailable or throws.
      if (type === 'expense') {
        checkBudgetThresholds().catch((e) =>
          console.warn('[budgetAlerts] check failed', e)
        );
      }

      modalRef.current?.dismiss();
    }, [
      canSave,
      selectedCategoryId,
      editingId,
      updateTransaction,
      amount,
      currency,
      type,
      note,
      date,
      receiptUri,
      addTransaction,
    ]);

    const handleDelete = useCallback(() => {
      if (!editingId) return;
      Alert.alert(
        'İşlemi Sil',
        'Bu işlemi silmek istediğinize emin misiniz?',
        [
          { text: 'Vazgeç', style: 'cancel' },
          {
            text: 'Sil',
            style: 'destructive',
            onPress: () => {
              deleteTransaction(editingId);
              HapticFeedback.trigger('notificationSuccess');
              Toast.show({ type: 'info', text1: 'İşlem silindi' });
              modalRef.current?.dismiss();
            },
          },
        ],
        { cancelable: true }
      );
    }, [editingId, deleteTransaction]);

    const handleRequestCustom = useCallback(() => {
      Toast.show({
        type: 'info',
        text1: 'Özel kategori',
        text2: isPremium
          ? "Özel kategoriler Faz 7'de geliyor."
          : 'Premium ile özel kategoriler oluşturabilirsin.',
      });
    }, [isPremium]);

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
              title={editingId ? 'Güncelle' : 'Kaydet'}
              onPress={handleSave}
              disabled={!canSave}
            />
          </View>
        </BottomSheetFooter>
      ),
      [theme, editingId, canSave, handleSave]
    );

    return (
      <BottomSheetModal
        ref={modalRef}
        snapPoints={['92%']}
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
            {editingId ? 'İşlemi Düzenle' : 'Yeni İşlem'}
          </Text>
          {editingId && (
            <Pressable onPress={handleDelete} hitSlop={10} style={styles.deleteBtn}>
              <Icon
                name="trash-2"
                size={20}
                color={theme.colors.semantic.error}
              />
            </Pressable>
          )}
        </View>

        <BottomSheetScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <ExpenseIncomeToggle value={type} onChange={setType} />

          <View style={styles.amountBlock}>
            <Text
              style={[styles.amountText, { color: accentColor }]}
              numberOfLines={1}
              adjustsFontSizeToFit>
              {displayAmount}
            </Text>
          </View>

          <AmountKeypad value={rawAmount} onChange={setRawAmount} locale={language} />

          <View style={styles.section}>
            <SectionHeader title="Kategori" />
            <CategoryPicker
              type={type}
              selectedId={selectedCategoryId}
              onSelect={setSelectedCategoryId}
              onRequestCustom={handleRequestCustom}
              isPremium={isPremium}
            />
          </View>

          <View style={styles.section}>
            <SectionHeader title="Tarih" />
            <DateField value={date} onChange={setDate} />
          </View>

          <View style={styles.section}>
            <SectionHeader title="Not" />
            <BottomSheetTextInput
              value={note}
              onChangeText={setNote}
              placeholder="Not ekle..."
              placeholderTextColor={theme.colors.text.placeholder}
              style={[
                styles.noteInput,
                {
                  backgroundColor: theme.colors.bg.card,
                  borderColor: theme.colors.border.card,
                  color: theme.colors.text.primary,
                },
              ]}
              maxLength={140}
            />
          </View>

          <View style={styles.section}>
            <SectionHeader title="Fiş" />
            <ReceiptAttachmentRow value={receiptUri} onChange={setReceiptUri} />
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
  amountBlock: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  amountText: {
    fontSize: 32,
    fontWeight: '700',
  },
  section: {
    gap: 0,
  },
  noteInput: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 50,
    fontSize: 14,
    fontWeight: '400',
  },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
