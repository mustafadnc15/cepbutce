// Lazy facade over react-native-image-crop-picker. Picking a receipt from the
// photo library is optional — if the module isn't linked we surface that to
// the caller instead of crashing.

export interface PickedImage {
  path: string;
  width: number;
  height: number;
  mime: string;
}

let mod: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  mod = require('react-native-image-crop-picker');
  // image-crop-picker uses default export via CJS interop
  mod = mod?.default ?? mod;
} catch {
  // Not installed; pickReceiptImage() returns null below.
}

export const isImagePickerAvailable: boolean = mod !== null;

export async function pickReceiptImage(): Promise<PickedImage | null> {
  if (!mod) return null;
  try {
    const img = await mod.openPicker({
      mediaType: 'photo',
      cropping: true,
      compressImageQuality: 0.85,
      freeStyleCropEnabled: true,
    });
    return {
      path: img.path,
      width: img.width,
      height: img.height,
      mime: img.mime,
    };
  } catch (e: any) {
    // User-cancel is a normal flow, not an error we want to log loudly.
    if (e?.code === 'E_PICKER_CANCELLED' || e?.message === 'User cancelled image selection') {
      return null;
    }
    console.warn('[imagePicker] openPicker failed', e);
    return null;
  }
}
