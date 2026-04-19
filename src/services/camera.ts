// Lazy facade over react-native-vision-camera. We always consume camera APIs
// through this file so the rest of the app keeps booting even when the native
// module isn't linked (fresh checkout, missing `pod install`, etc.). The
// scanner screen renders an "install native modules" fallback in that case.

import type { ComponentType, MutableRefObject } from 'react';

type PermissionState = {
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
};

type CameraDevice = unknown | null;

export interface TakePhotoResult {
  path: string;
  width: number;
  height: number;
}

export interface CameraRef {
  takePhoto: (options?: {
    flash?: 'on' | 'off' | 'auto';
    enableShutterSound?: boolean;
  }) => Promise<TakePhotoResult>;
}

type CameraProps = {
  ref?: MutableRefObject<CameraRef | null>;
  device: CameraDevice;
  isActive: boolean;
  photo?: boolean;
  torch?: 'on' | 'off';
  style?: unknown;
};

let mod: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  mod = require('react-native-vision-camera');
} catch {
  // Package not installed yet; scanner screen will fall back to a placeholder.
}

export const isCameraAvailable: boolean = mod !== null;

export const Camera: ComponentType<CameraProps> | null = mod?.Camera ?? null;

export function useCameraDevice(position: 'front' | 'back'): CameraDevice {
  if (!mod?.useCameraDevice) return null;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return mod.useCameraDevice(position);
}

export function useCameraPermission(): PermissionState {
  if (!mod?.useCameraPermission) {
    return {
      hasPermission: false,
      requestPermission: async () => false,
    };
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return mod.useCameraPermission();
}
