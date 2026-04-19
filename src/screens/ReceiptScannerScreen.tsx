import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/feather';
import HapticFeedback from 'react-native-haptic-feedback';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../theme';
import { useSettingsStore } from '../stores/useSettingsStore';
import {
  Camera,
  isCameraAvailable,
  useCameraDevice,
  useCameraPermission,
  type CameraRef,
} from '../services/camera';
import { pickReceiptImage, isImagePickerAvailable } from '../services/imagePicker';
import { Button } from '../components/ui';
import type { ScannerStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<ScannerStackParamList, 'ReceiptScanner'>;

export function ReceiptScannerScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();

  const language = useSettingsStore((s) => s.language);
  const scansRemaining = useSettingsStore((s) => s.receiptScansRemaining());

  const tr = language === 'tr';

  const cameraRef = useRef<CameraRef | null>(null);
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const [permissionAsked, setPermissionAsked] = useState(false);
  const [torch, setTorch] = useState<'on' | 'off'>('off');
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    if (!isCameraAvailable) return;
    if (hasPermission) return;
    if (permissionAsked) return;
    setPermissionAsked(true);
    requestPermission();
  }, [hasPermission, permissionAsked, requestPermission]);

  const handleClose = useCallback(() => {
    navigation.getParent()?.goBack();
  }, [navigation]);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || capturing) return;
    try {
      setCapturing(true);
      HapticFeedback.trigger('impactMedium');
      const photo = await cameraRef.current.takePhoto({
        flash: torch === 'on' ? 'on' : 'off',
        enableShutterSound: false,
      });
      navigation.navigate('ReceiptReview', { imagePath: photo.path });
    } catch (e) {
      console.warn('[scanner] capture failed', e);
      Toast.show({
        type: 'error',
        text1: tr ? 'Çekim başarısız' : 'Capture failed',
      });
    } finally {
      setCapturing(false);
    }
  }, [capturing, torch, navigation, tr]);

  const handleGallery = useCallback(async () => {
    HapticFeedback.trigger('impactLight');
    if (!isImagePickerAvailable) {
      Toast.show({
        type: 'info',
        text1: tr ? 'Galeri kullanılamıyor' : 'Gallery unavailable',
        text2: tr
          ? 'react-native-image-crop-picker yüklenmedi.'
          : 'react-native-image-crop-picker not installed.',
      });
      return;
    }
    const picked = await pickReceiptImage();
    if (!picked) return;
    navigation.navigate('ReceiptReview', { imagePath: picked.path });
  }, [navigation, tr]);

  const handleToggleTorch = useCallback(() => {
    HapticFeedback.trigger('impactLight');
    setTorch((t) => (t === 'on' ? 'off' : 'on'));
  }, []);

  if (!isCameraAvailable || !Camera) {
    return (
      <UnavailableView
        language={language}
        title={tr ? 'Kamera modülü yüklenmemiş' : 'Camera module not installed'}
        body={
          tr
            ? 'react-native-vision-camera paketini yükleyip pod install çalıştırın.'
            : 'Install react-native-vision-camera and run pod install.'
        }
        onClose={handleClose}
      />
    );
  }

  if (!hasPermission) {
    return (
      <PermissionView
        language={language}
        onRequest={requestPermission}
        onOpenSettings={() => Linking.openSettings()}
        onClose={handleClose}
      />
    );
  }

  if (!device) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }

  const CaptureButton = (
    <Pressable onPress={handleCapture} disabled={capturing} hitSlop={12}>
      <View style={[styles.captureRing, { borderColor: theme.colors.brand.primary }]}>
        <View style={styles.captureInner}>
          {capturing ? <ActivityIndicator color={theme.colors.brand.primary} /> : null}
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive
        photo
        torch={torch}
      />

      <Overlay />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={handleClose} hitSlop={12} style={styles.iconButton}>
          <Icon name="x" size={22} color="#FFFFFF" />
        </Pressable>
        <View style={styles.scansPill}>
          <Text style={styles.scansPillText}>
            {tr ? `${scansRemaining} tarama hakkınız kaldı` : `${scansRemaining} scans left`}
          </Text>
        </View>
      </View>

      <View
        style={[styles.bottomBar, { paddingBottom: insets.bottom + 20 }]}>
        <Pressable onPress={handleGallery} hitSlop={12} style={styles.iconButton}>
          <Icon name="image" size={22} color="#FFFFFF" />
        </Pressable>
        {CaptureButton}
        <Pressable onPress={handleToggleTorch} hitSlop={12} style={styles.iconButton}>
          <Icon name={torch === 'on' ? 'zap' : 'zap-off'} size={22} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

function Overlay() {
  const language = useSettingsStore((s) => s.language);
  const tr = language === 'tr';
  return (
    <View style={styles.overlayRoot} pointerEvents="none">
      <View style={styles.overlayEdge} />
      <View style={styles.overlayCenterRow}>
        <View style={styles.overlayEdge} />
        <View style={styles.frame}>
          <Text style={styles.frameHint}>
            {tr ? 'Fişi çerçevenin içine hizalayın' : 'Align the receipt inside the frame'}
          </Text>
        </View>
        <View style={styles.overlayEdge} />
      </View>
      <View style={styles.overlayEdge} />
    </View>
  );
}

interface PermissionViewProps {
  language: 'tr' | 'en';
  onRequest: () => Promise<boolean>;
  onOpenSettings: () => void;
  onClose: () => void;
}

function PermissionView({ language, onRequest, onOpenSettings, onClose }: PermissionViewProps) {
  const tr = language === 'tr';
  return (
    <View style={styles.unavailableRoot}>
      <StatusBar hidden />
      <Icon name="camera" size={48} color="#FFFFFF" />
      <Text style={styles.unavailableTitle}>
        {tr ? 'Kamera izni gerekiyor' : 'Camera permission required'}
      </Text>
      <Text style={styles.unavailableBody}>
        {tr
          ? 'Fiş taramak için kameraya erişmemiz gerekiyor.'
          : 'We need camera access to scan receipts.'}
      </Text>
      <View style={styles.unavailableActions}>
        <Button
          title={tr ? 'İzin Ver' : 'Grant Permission'}
          onPress={async () => {
            const ok = await onRequest();
            if (!ok) onOpenSettings();
          }}
        />
        <Button title={tr ? 'Kapat' : 'Close'} variant="ghost" onPress={onClose} />
      </View>
    </View>
  );
}

interface UnavailableViewProps {
  language: 'tr' | 'en';
  title: string;
  body: string;
  onClose: () => void;
}

function UnavailableView({ language, title, body, onClose }: UnavailableViewProps) {
  const tr = language === 'tr';
  return (
    <View style={styles.unavailableRoot}>
      <StatusBar hidden />
      <Icon name="alert-circle" size={48} color="#FFFFFF" />
      <Text style={styles.unavailableTitle}>{title}</Text>
      <Text style={styles.unavailableBody}>{body}</Text>
      <View style={styles.unavailableActions}>
        <Button title={tr ? 'Kapat' : 'Close'} onPress={onClose} />
      </View>
    </View>
  );
}

const FRAME_HEIGHT = 400;
const EDGE_BG = 'rgba(0,0,0,0.5)';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingRoot: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayRoot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'column',
  },
  overlayEdge: {
    flex: 1,
    backgroundColor: EDGE_BG,
  },
  overlayCenterRow: {
    height: FRAME_HEIGHT,
    flexDirection: 'row',
  },
  frame: {
    width: 300,
    height: FRAME_HEIGHT,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    borderStyle: 'dashed',
    alignItems: 'center',
    paddingTop: 18,
  },
  frameHint: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '400',
    position: 'absolute',
    top: -28,
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
  scansPill: {
    paddingHorizontal: 14,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scansPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
  },
  captureRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unavailableRoot: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  unavailableTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  unavailableBody: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
  },
  unavailableActions: {
    alignSelf: 'stretch',
    gap: 8,
    marginTop: 16,
  },
});
