import React, {
  ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import Icon from '@react-native-vector-icons/feather';
import HapticFeedback from 'react-native-haptic-feedback';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../theme';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import { Button, IconBox } from '../components/ui';
import { CategoryPicker } from '../components/transactions/CategoryPicker';
import { DateField } from '../components/transactions/DateField';
import { DEFAULT_CATEGORIES } from '../constants/categories';
import { suggestCategoryFromVendor } from '../utils/vendorCategory';
import { formatCurrency } from '../utils/currency';
import type { ScannerStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<ScannerStackParamList, 'ReceiptResults'>;
type Route = RouteProp<ScannerStackParamList, 'ReceiptResults'>;
type SupportedCurrency = 'TRY' | 'USD' | 'EUR' | 'GBP';

interface EditableItem {
  id: string;
  name: string;
  amount: number;
}

let itemIdCounter = 1;
const newItemId = () => `item-${itemIdCounter++}`;

function totalToInputString(n: number | null, locale: 'tr' | 'en'): string {
  if (n === null) return '';
  const sep = locale === 'tr' ? ',' : '.';
  return n.toFixed(2).replace('.', sep);
}

function inputStringToTotal(s: string): number | null {
  if (!s.trim()) return null;
  // Accept either "12.50" or "12,50"; ignore everything else.
  const cleaned = s.replace(/[^\d.,-]/g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function ReceiptResultsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { imagePath, ocr } = useRoute<Route>().params;

  const language = useSettingsStore((s) => s.language);
  const settingsCurrency = useSettingsStore((s) => s.currency) as SupportedCurrency;
  const isPremium = useSettingsStore((s) => s.isPremium);
  const addTransaction = useTransactionStore((s) => s.addTransaction);

  const tr = language === 'tr';

  // Each field tracks "was this OCR-supplied?" so we can flip the marker when
  // the user edits it. The boolean flips on first user change and never back.
  const [vendor, setVendor] = useState<string>(ocr.vendor ?? '');
  const [vendorEdited, setVendorEdited] = useState<boolean>(false);
  const [totalStr, setTotalStr] = useState<string>(totalToInputString(ocr.total, language));
  const [totalEdited, setTotalEdited] = useState<boolean>(false);
  const [date, setDate] = useState<Date>(
    ocr.date ? new Date(`${ocr.date}T12:00:00`) : new Date()
  );
  const [dateEdited, setDateEdited] = useState<boolean>(false);

  const initialCategoryId = useMemo(
    () => suggestCategoryFromVendor(ocr.vendor) ?? 'cat_other_expense',
    [ocr.vendor]
  );
  const [categoryId, setCategoryId] = useState<string>(initialCategoryId);
  const [categoryEdited, setCategoryEdited] = useState<boolean>(false);

  const [items, setItems] = useState<EditableItem[]>(() =>
    ocr.items.map((it) => ({ id: newItemId(), name: it.name, amount: it.amount }))
  );
  const [itemsExpanded, setItemsExpanded] = useState<boolean>(false);

  const total = useMemo(() => inputStringToTotal(totalStr), [totalStr]);
  const canSave = total !== null && categoryId !== '';

  const categoryPickerRef = useRef<BottomSheetModal>(null);
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

  const handleClose = useCallback(() => {
    navigation.getParent()?.goBack();
  }, [navigation]);

  const handleSave = useCallback(() => {
    if (!canSave || total === null) return;
    HapticFeedback.trigger('notificationSuccess');
    addTransaction({
      amount: total,
      currency: ocr.currency || settingsCurrency,
      type: 'expense',
      categoryId,
      note: vendor.trim() || null,
      date: date.toISOString(),
      receiptUri: imagePath,
      receiptOcrData: JSON.stringify({
        ...ocr,
        // Persist what the user actually saved, not just the raw OCR.
        vendor: vendor.trim() || null,
        total,
        date: date.toISOString(),
        items: items.map((i) => ({ name: i.name, amount: i.amount })),
        categoryId,
      }),
      subscriptionId: null,
    });
    Toast.show({
      type: 'success',
      text1: tr ? 'Fiş kaydedildi ✓' : 'Receipt saved ✓',
    });
    handleClose();
  }, [
    canSave,
    total,
    addTransaction,
    ocr,
    settingsCurrency,
    categoryId,
    vendor,
    date,
    imagePath,
    items,
    tr,
    handleClose,
  ]);

  const handleAddItem = useCallback(() => {
    HapticFeedback.trigger('impactLight');
    setItems((prev) => [...prev, { id: newItemId(), name: '', amount: 0 }]);
    setItemsExpanded(true);
  }, []);

  const handleRemoveItem = useCallback((id: string) => {
    HapticFeedback.trigger('impactLight');
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const handleUpdateItem = useCallback((id: string, patch: Partial<EditableItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }, []);

  const uri = imagePath.startsWith('file://') ? imagePath : `file://${imagePath}`;

  const statusOk = ocr.confidence !== 'low' && ocr.source !== 'unavailable';
  const badgeText = statusOk
    ? tr
      ? ocr.source === 'gemini'
        ? 'AI ile tarandı ✓'
        : 'Otomatik tarandı ✓'
      : 'Auto scanned ✓'
    : tr
    ? 'Manuel kontrol gerekli'
    : 'Manual review needed';
  const badgeColor = statusOk ? theme.colors.semantic.income : theme.colors.semantic.warning;
  const badgeBg = statusOk
    ? theme.colors.brand.primaryTint
    : 'rgba(255, 149, 0, 0.15)';

  const totalDisplay = total !== null
    ? formatCurrency(total, (ocr.currency as SupportedCurrency) || settingsCurrency, language)
    : '';

  const selectedCategory = useMemo(
    () => DEFAULT_CATEGORIES.find((c) => c.id === categoryId),
    [categoryId]
  );

  const vendorAuto = !vendorEdited && !!ocr.vendor;
  const totalAuto = !totalEdited && ocr.total !== null;
  const dateAuto = !dateEdited && !!ocr.date;
  const categoryAuto = !categoryEdited && initialCategoryId !== 'cat_other_expense';

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg.page }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.bg.page}
      />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 120 },
        ]}>
        <View style={styles.header}>
          <Pressable onPress={handleClose} hitSlop={12} style={styles.closeButton}>
            <Icon name="x" size={22} color={theme.colors.text.primary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            {tr ? 'Fiş Detayları' : 'Receipt Details'}
          </Text>
          <View style={styles.closeButton} />
        </View>

        <View style={styles.thumbWrap}>
          <FastImage
            source={{ uri }}
            style={[
              styles.thumb,
              { backgroundColor: theme.colors.bg.card, borderColor: theme.colors.border.card },
            ]}
            resizeMode={FastImage.resizeMode.contain}
          />
        </View>

        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <Icon name={statusOk ? 'check-circle' : 'alert-triangle'} size={14} color={badgeColor} />
          <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeText}</Text>
        </View>

        <FieldRow
          label={tr ? 'Mağaza' : 'Vendor'}
          marker={<AutoMarker auto={vendorAuto} />}>
          <TextInput
            value={vendor}
            onChangeText={(t) => {
              setVendor(t);
              setVendorEdited(true);
            }}
            placeholder={tr ? 'Mağaza adı' : 'Vendor name'}
            placeholderTextColor={theme.colors.text.placeholder}
            style={[styles.input, { color: theme.colors.text.primary }]}
            maxLength={60}
          />
        </FieldRow>

        <FieldRow
          label={tr ? 'Toplam' : 'Total'}
          marker={<AutoMarker auto={totalAuto} />}>
          <View style={styles.totalRow}>
            <TextInput
              value={totalStr}
              onChangeText={(t) => {
                setTotalStr(t);
                setTotalEdited(true);
              }}
              placeholder="0,00"
              placeholderTextColor={theme.colors.text.placeholder}
              keyboardType="decimal-pad"
              style={[
                styles.input,
                styles.totalInput,
                { color: theme.colors.text.primary },
              ]}
            />
            {totalDisplay && (
              <Text style={[styles.totalPreview, { color: theme.colors.text.secondary }]}>
                {totalDisplay}
              </Text>
            )}
          </View>
        </FieldRow>

        <FieldRow
          label={tr ? 'Tarih' : 'Date'}
          marker={<AutoMarker auto={dateAuto} />}>
          <DateField
            value={date}
            onChange={(d) => {
              setDate(d);
              setDateEdited(true);
            }}
            sheetTitle={tr ? 'Tarih Seç' : 'Pick Date'}
          />
        </FieldRow>

        <FieldRow
          label={tr ? 'Kategori' : 'Category'}
          marker={<AutoMarker auto={categoryAuto} />}>
          <Pressable
            onPress={() => {
              HapticFeedback.trigger('impactLight');
              categoryPickerRef.current?.present();
            }}
            style={[
              styles.categoryRow,
              {
                backgroundColor: theme.colors.bg.card,
                borderColor: theme.colors.border.card,
              },
            ]}>
            {selectedCategory ? (
              <>
                <IconBox
                  iconName={selectedCategory.icon}
                  iconColor={selectedCategory.color}
                  bgColor={hexWithAlpha(selectedCategory.color, 0.15)}
                  size={32}
                  iconSize={16}
                />
                <Text
                  style={[styles.categoryText, { color: theme.colors.text.primary }]}>
                  {selectedCategory.name}
                </Text>
              </>
            ) : (
              <Text style={[styles.categoryText, { color: theme.colors.text.placeholder }]}>
                {tr ? 'Kategori seç' : 'Choose category'}
              </Text>
            )}
            <Icon name="chevron-down" size={18} color={theme.colors.text.secondary} />
          </Pressable>
        </FieldRow>

        <View
          style={[
            styles.itemsCard,
            { backgroundColor: theme.colors.bg.card, borderColor: theme.colors.border.card },
          ]}>
          <Pressable
            onPress={() => {
              HapticFeedback.trigger('impactLight');
              setItemsExpanded((v) => !v);
            }}
            style={styles.itemsHeader}>
            <Text style={[styles.itemsLabel, { color: theme.colors.text.secondary }]}>
              {tr ? `Ürünler (${items.length})` : `Items (${items.length})`}
            </Text>
            <Icon
              name={itemsExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={theme.colors.text.secondary}
            />
          </Pressable>
          {itemsExpanded && (
            <View style={styles.itemsList}>
              {items.length === 0 && (
                <Text style={[styles.itemsEmpty, { color: theme.colors.text.placeholder }]}>
                  {tr ? 'Hiç ürün yok' : 'No items'}
                </Text>
              )}
              {items.map((item) => (
                <View
                  key={item.id}
                  style={[styles.itemRow, { borderColor: theme.colors.border.card }]}>
                  <TextInput
                    value={item.name}
                    onChangeText={(t) => handleUpdateItem(item.id, { name: t })}
                    placeholder={tr ? 'Ürün adı' : 'Item name'}
                    placeholderTextColor={theme.colors.text.placeholder}
                    style={[styles.itemNameInput, { color: theme.colors.text.primary }]}
                  />
                  <TextInput
                    value={item.amount > 0 ? totalToInputString(item.amount, language) : ''}
                    onChangeText={(t) => {
                      const n = inputStringToTotal(t);
                      handleUpdateItem(item.id, { amount: n ?? 0 });
                    }}
                    placeholder="0,00"
                    placeholderTextColor={theme.colors.text.placeholder}
                    keyboardType="decimal-pad"
                    style={[
                      styles.itemAmountInput,
                      { color: theme.colors.text.primary },
                    ]}
                  />
                  <Pressable
                    onPress={() => handleRemoveItem(item.id)}
                    hitSlop={6}
                    style={styles.itemDelete}>
                    <Icon
                      name="trash-2"
                      size={16}
                      color={theme.colors.semantic.error}
                    />
                  </Pressable>
                </View>
              ))}
              <Pressable onPress={handleAddItem} style={styles.itemAdd}>
                <Icon name="plus" size={16} color={theme.colors.brand.primary} />
                <Text style={[styles.itemAddText, { color: theme.colors.brand.primary }]}>
                  {tr ? 'Ürün ekle' : 'Add item'}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.colors.bg.card,
            borderTopColor: theme.colors.border.card,
            paddingBottom: insets.bottom + 12,
          },
        ]}>
        <Button
          title={tr ? 'Harcama Olarak Kaydet' : 'Save as Expense'}
          onPress={handleSave}
          disabled={!canSave}
        />
      </View>

      <BottomSheetModal
        ref={categoryPickerRef}
        snapPoints={['65%']}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: theme.colors.border.card }}
        backgroundStyle={{ backgroundColor: theme.colors.bg.card }}>
        <BottomSheetScrollView contentContainerStyle={styles.categorySheet}>
          <Text style={[styles.categorySheetTitle, { color: theme.colors.text.primary }]}>
            {tr ? 'Kategori Seç' : 'Choose Category'}
          </Text>
          <CategoryPicker
            type="expense"
            selectedId={categoryId}
            onSelect={(id) => {
              setCategoryId(id);
              setCategoryEdited(true);
              categoryPickerRef.current?.dismiss();
            }}
            isPremium={isPremium}
          />
        </BottomSheetScrollView>
      </BottomSheetModal>
    </View>
  );
}

interface AutoMarkerProps {
  auto: boolean;
}

function AutoMarker({ auto }: AutoMarkerProps) {
  const { theme } = useTheme();
  return (
    <Icon
      name={auto ? 'check-circle' : 'edit-2'}
      size={14}
      color={auto ? theme.colors.semantic.income : theme.colors.text.secondary}
    />
  );
}

interface FieldRowProps {
  label: string;
  marker: ReactNode;
  children: ReactNode;
}

function FieldRow({ label, marker, children }: FieldRowProps) {
  const { theme } = useTheme();
  return (
    <View style={styles.field}>
      <View style={styles.fieldLabelRow}>
        <Text style={[styles.fieldLabel, { color: theme.colors.text.secondary }]}>
          {label}
        </Text>
        {marker}
      </View>
      {children}
    </View>
  );
}

function hexWithAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  thumbWrap: {
    alignItems: 'center',
  },
  thumb: {
    width: 200,
    height: 200,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  field: {
    gap: 6,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    backgroundColor: 'transparent',
    fontSize: 14,
    fontWeight: '400',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0)',
  },
  totalInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  totalPreview: {
    fontSize: 13,
    fontWeight: '500',
    paddingRight: 14,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 50,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  categoryText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  itemsCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  itemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  itemsLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  itemsList: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  itemsEmpty: {
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 8,
    textAlign: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 4,
  },
  itemNameInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    paddingVertical: 8,
  },
  itemAmountInput: {
    width: 80,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'right',
    paddingVertical: 8,
  },
  itemDelete: {
    padding: 6,
  },
  itemAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  itemAddText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  categorySheet: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  categorySheetTitle: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
});
