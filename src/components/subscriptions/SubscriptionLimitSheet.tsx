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
import { useSettingsStore } from '../../stores/useSettingsStore';
import { Button } from '../ui';
import { FREE_ACTIVE_SUBSCRIPTION_LIMIT } from '../../stores/useSubscriptionStore';
import { navigationRef } from '../../navigation/ref';

export interface SubscriptionLimitSheetHandle {
  present: () => void;
  dismiss: () => void;
}

export const SubscriptionLimitSheet = forwardRef<SubscriptionLimitSheetHandle>(
  function SubscriptionLimitSheet(_props, ref) {
    const { theme } = useTheme();
    const modalRef = useRef<BottomSheetModal>(null);
    const language = useSettingsStore((s) => s.language);

    useImperativeHandle(
      ref,
      () => ({
        present: () => modalRef.current?.present(),
        dismiss: () => modalRef.current?.dismiss(),
      }),
      []
    );

    const tr = language === 'tr';

    const handlePremium = useCallback(() => {
      HapticFeedback.trigger('impactLight');
      modalRef.current?.dismiss();
      // Route to the paywall under the Profile tab — the user arrives on a
      // stack screen they can back out of, not a modal that loses context.
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
            <Icon name="star" size={28} color={theme.colors.brand.primary} />
          </View>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            {tr ? 'Abonelik Limiti' : 'Subscription Limit'}
          </Text>
          <Text style={[styles.body, { color: theme.colors.text.secondary }]}>
            {tr
              ? `Ücretsiz planda en fazla ${FREE_ACTIVE_SUBSCRIPTION_LIMIT} abonelik takip edebilirsiniz. Premium ile sınırsız abonelik kaydedin.`
              : `You can track up to ${FREE_ACTIVE_SUBSCRIPTION_LIMIT} subscriptions on the free plan. Go Premium to track unlimited subscriptions.`}
          </Text>
          <View style={styles.actions}>
            <Button
              title={tr ? "Premium'a Geç" : 'Go Premium'}
              icon="star"
              onPress={handlePremium}
            />
            <Button
              title={tr ? 'Sonra' : 'Later'}
              variant="ghost"
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
