import React, { memo, useCallback, useRef } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, SharedValue } from 'react-native-reanimated';
import ReanimatedSwipeable, {
  SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Icon from '@react-native-vector-icons/feather';
import HapticFeedback from 'react-native-haptic-feedback';

import { IconBox } from '../ui';
import { useTheme } from '../../theme';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { formatCurrency } from '../../utils/currency';
import type { Category, Transaction } from '../../types';

const ROW_HEIGHT = 64;
const ACTION_WIDTH = 80;

type SupportedCurrency = 'TRY' | 'USD' | 'EUR' | 'GBP';

function hexWithAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface TransactionListItemProps {
  transaction: Transaction;
  category: Category | undefined;
  onPress: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}

function TransactionListItemImpl({
  transaction,
  category,
  onPress,
  onDelete,
}: TransactionListItemProps) {
  const { theme } = useTheme();
  const language = useSettingsStore((s) => s.language);
  const currency = useSettingsStore((s) => s.currency) as SupportedCurrency;
  const swipeRef = useRef<SwipeableMethods>(null);

  const name = category?.name ?? (language === 'tr' ? 'Kategori' : 'Category');
  const icon = category?.icon ?? 'help-circle';
  const color = category?.color ?? theme.colors.text.secondary;

  const hasNote = !!transaction.note && transaction.note.trim().length > 0;
  const title = hasNote ? transaction.note! : name;
  const subtitle = hasNote ? name : undefined;

  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? theme.colors.semantic.income : theme.colors.semantic.expense;
  const sign = isIncome ? '+' : '−';
  const amountStr = formatCurrency(transaction.amount, currency, language);

  const confirmDelete = useCallback(() => {
    HapticFeedback.trigger('impactMedium');
    const tr = language === 'tr';
    Alert.alert(
      tr ? 'İşlemi Sil' : 'Delete Transaction',
      tr
        ? 'Bu işlemi silmek istediğinize emin misiniz?'
        : 'Are you sure you want to delete this transaction?',
      [
        {
          text: tr ? 'Vazgeç' : 'Cancel',
          style: 'cancel',
          onPress: () => swipeRef.current?.close(),
        },
        {
          text: tr ? 'Sil' : 'Delete',
          style: 'destructive',
          onPress: () => {
            swipeRef.current?.close();
            onDelete(transaction);
          },
        },
      ]
    );
  }, [language, onDelete, transaction]);

  const renderRightActions = useCallback(
    (progress: SharedValue<number>, _translation: SharedValue<number>) => (
      <DeleteAction progress={progress} onPress={confirmDelete} color={theme.colors.semantic.error} />
    ),
    [confirmDelete, theme.colors.semantic.error]
  );

  // Auto-prompt when the user fully commits the swipe past the action width.
  const handleSwipeableWillOpen = useCallback(() => {
    confirmDelete();
  }, [confirmDelete]);

  const handlePress = useCallback(() => {
    HapticFeedback.trigger('impactLight');
    onPress(transaction);
  }, [onPress, transaction]);

  return (
    <ReanimatedSwipeable
      ref={swipeRef}
      friction={2}
      rightThreshold={ACTION_WIDTH * 0.6}
      renderRightActions={renderRightActions}
      onSwipeableWillOpen={handleSwipeableWillOpen}
      overshootRight={false}
      containerStyle={{ backgroundColor: theme.colors.bg.page }}>
      <Pressable
        onPress={handlePress}
        style={[
          styles.row,
          {
            backgroundColor: theme.colors.bg.card,
            borderColor: theme.colors.border.card,
          },
        ]}>
        <IconBox
          iconName={icon}
          iconColor={color}
          bgColor={hexWithAlpha(color, 0.12)}
          size={40}
          iconSize={18}
        />
        <View style={styles.middle}>
          <Text
            style={[styles.title, { color: theme.colors.text.primary }]}
            numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[styles.subtitle, { color: theme.colors.text.secondary }]}
              numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        <Text style={[styles.amount, { color: amountColor }]} numberOfLines={1}>
          {sign}
          {amountStr}
        </Text>
      </Pressable>
    </ReanimatedSwipeable>
  );
}

interface DeleteActionProps {
  progress: SharedValue<number>;
  color: string;
  onPress: () => void;
}

function DeleteAction({ progress, color, onPress }: DeleteActionProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: Math.min(1, progress.value) }],
    opacity: Math.min(1, progress.value),
  }));

  return (
    <View style={[styles.actionWrap, { backgroundColor: color }]}>
      <Pressable onPress={onPress} style={styles.actionPress}>
        <Animated.View style={animatedStyle}>
          <Icon name="trash-2" size={20} color="#FFFFFF" />
        </Animated.View>
      </Pressable>
    </View>
  );
}

export const TransactionListItem = memo(TransactionListItemImpl);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: ROW_HEIGHT,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  middle: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '400',
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionWrap: {
    width: ACTION_WIDTH,
    borderRadius: 14,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPress: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
