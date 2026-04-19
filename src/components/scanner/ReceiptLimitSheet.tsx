import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
} from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import Icon from '@react-native-vector-icons/feather';
import HapticFeedback from 'react-native-haptic-feedback';

import { useTheme } from '../../theme';
import {
  FREE_RECEIPT_SCANS_PER_MONTH,
  PREMIUM_RECEIPT_SCANS_PER_MONTH,
  useSettingsStore,
} from '../../stores/useSettingsStore';
import { Button } from '../ui';
import { navigationRef } from '../../navigation/ref';

export interface ReceiptLimitSheetHandle {
  present: () => void;
  dismiss: () => void;
}

export const ReceiptLimitSheet = forwardRef<ReceiptLimitSheetHandle>(
  function ReceiptLimitSheet(_props, ref) {
    const { theme } = useTheme();
    const modalRef = useRef<BottomSheetModal>(null);
    const language = useSettingsStore((s) => s.language);
    const isPremium = useSettingsStore((s) => s.isPremium);
    const scansUsed = useSettingsStore((s) => s.receiptScansThisMonth);

    useImperativeHandle(
      ref,
      () => ({
        present: () => modalRef.current?.present(),
        dismiss: () => modalRef.current?.dismiss(),
      }),
      []
    );

    const tr = language === 'tr';
    const limit = isPremium ? PREMIUM_RECEIPT_SCANS_PER_MONTH : FREE_RECEIPT_SCANS_PER_MONTH;

    const handlePremium = useCallback(() => {
      HapticFeedback.trigger('impactLight');
      modalRef.current?.dismiss();
      if (navigationRef.isReady()) {
        navigationRef.navigate('Main' as any, {
          screen: 'Profile',
          params: { screen: 'Premium' },
        } as any);
      }
    }, []);

    const handleLater = useCallback(() => {
      modalRef.current?.dismiss();
    }, []);

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

    const title = tr
      ? isPremium
        ? 'Aylık Tarama Limiti'
        : 'Tarama Limitine Ulaştınız'
      : isPremium
      ? 'Monthly Scan Limit'
      : 'Scan Limit Reached';

    const body = tr
      ? isPremium
        ? `Bu ay ${scansUsed}/${limit} tarama kullandınız. Limit yenilenecek.`
        : `Ücretsiz planda ayda ${FREE_RECEIPT_SCANS_PER_MONTH} fiş tarayabilirsiniz. Premium ile ayda ${PREMIUM_RECEIPT_SCANS_PER_MONTH} AI destekli tarama.`
      : isPremium
      ? `You've used ${scansUsed}/${limit} scans this month.`
      : `Free plan allows ${FREE_RECEIPT_SCANS_PER_MONTH} receipt scans per month. Premium includes ${PREMIUM_RECEIPT_SCANS_PER_MONTH} AI-powered scans.`;

    return (
      <BottomSheetModal
        ref={modalRef}
        snapPoints={['50%']}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: theme.colors.border.card }}
        backgroundStyle={{ backgroundColor: theme.colors.bg.card }}>
        <BottomSheetView style={styles.sheet}>
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: theme.colors.brand.primaryTint },
            ]}>
            <Icon name="camera" size={28} color={theme.colors.brand.primary} />
          </View>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>{title}</Text>
          <Text style={[styles.body, { color: theme.colors.text.secondary }]}>{body}</Text>
          <View style={styles.actions}>
            {!isPremium && (
              <Button
                title={tr ? "Premium'a Geç" : 'Go Premium'}
                icon="star"
                onPress={handlePremium}
              />
            )}
            <Button
              title={tr ? 'Tamam' : 'OK'}
              variant={isPremium ? 'primary' : 'ghost'}
              onPress={handleLater}
            />
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  sheet: {
    padding: 24,
    paddingBottom: 32,
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  actions: {
    alignSelf: 'stretch',
    gap: 8,
    marginTop: 12,
  },
});
