import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import Icon from '@react-native-vector-icons/feather';
import HapticFeedback from 'react-native-haptic-feedback';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../theme';
import { useSettingsStore } from '../stores/useSettingsStore';
import { Button } from '../components/ui';
import { extractReceiptData } from '../services/ocr';
import type { ScannerStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<ScannerStackParamList, 'ReceiptReview'>;
type Route = RouteProp<ScannerStackParamList, 'ReceiptReview'>;

const ROTATION_STEPS: number[] = [0, 90, 180, 270];

export function ReceiptReviewScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { imagePath } = useRoute<Route>().params;
  const language = useSettingsStore((s) => s.language);
  const isPremium = useSettingsStore((s) => s.isPremium);
  const incrementReceiptScans = useSettingsStore((s) => s.incrementReceiptScans);
  const canScan = useSettingsStore((s) => s.canScanReceipt);

  const [rotationIndex, setRotationIndex] = useState(0);
  const [running, setRunning] = useState(false);

  const tr = language === 'tr';

  const uri = imagePath.startsWith('file://') ? imagePath : `file://${imagePath}`;

  const handleRetake = useCallback(() => {
    HapticFeedback.trigger('impactLight');
    navigation.goBack();
  }, [navigation]);

  const handleRotate = useCallback(() => {
    HapticFeedback.trigger('impactLight');
    setRotationIndex((i) => (i + 1) % ROTATION_STEPS.length);
  }, []);

  const handleUse = useCallback(async () => {
    if (running) return;
    if (!canScan()) {
      Toast.show({
        type: 'info',
        text1: tr ? 'Tarama limiti' : 'Scan limit',
        text2: tr
          ? 'Bu ay tarama hakkınız doldu.'
          : 'No scans remaining this month.',
      });
      navigation.getParent()?.goBack();
      return;
    }
    try {
      setRunning(true);
      HapticFeedback.trigger('impactLight');
      const ocr = await extractReceiptData(imagePath, isPremium);
      incrementReceiptScans();
      navigation.replace('ReceiptResults', { imagePath, ocr });
    } catch (e) {
      console.warn('[review] OCR failed', e);
      Toast.show({
        type: 'error',
        text1: tr ? 'Okuma başarısız' : 'OCR failed',
        text2: tr ? 'Tekrar deneyin veya manuel girin.' : 'Try again or enter manually.',
      });
    } finally {
      setRunning(false);
    }
  }, [running, canScan, tr, navigation, imagePath, isPremium, incrementReceiptScans]);

  const rotation = ROTATION_STEPS[rotationIndex];

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <View style={styles.imageWrap}>
        <FastImage
          source={{ uri }}
          style={[styles.image, { transform: [{ rotate: `${rotation}deg` }] }]}
          resizeMode={FastImage.resizeMode.contain}
        />
      </View>

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={handleRetake} hitSlop={12} style={styles.iconButton}>
          <Icon name="x" size={22} color="#FFFFFF" />
        </Pressable>
        <Pressable onPress={handleRotate} hitSlop={12} style={styles.iconButton}>
          <Icon name="rotate-cw" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: insets.bottom + 20,
            backgroundColor: 'rgba(0,0,0,0.55)',
          },
        ]}>
        {running && (
          <View style={styles.progressRow}>
            <ActivityIndicator color={theme.colors.brand.primary} />
            <Text style={styles.progressText}>
              {tr
                ? isPremium
                  ? 'AI fiş analizi yapılıyor...'
                  : 'Fiş okunuyor...'
                : isPremium
                ? 'AI analysing receipt...'
                : 'Reading receipt...'}
            </Text>
          </View>
        )}
        <Button
          title={tr ? 'Bu Fotoğrafı Kullan' : 'Use This Photo'}
          onPress={handleUse}
          loading={running}
          disabled={running}
        />
        <Button
          title={tr ? 'Tekrar Çek' : 'Retake'}
          variant="ghost"
          onPress={handleRetake}
          disabled={running}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  imageWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
});
