// Lazy facade over react-native-biometrics. Keeps the import optional so the
// app still boots if the native module isn't linked yet.

let mod: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const imported = require('react-native-biometrics');
  // react-native-biometrics exports a default class — instantiate once.
  const Ctor = imported?.default ?? imported?.ReactNativeBiometrics ?? imported;
  if (typeof Ctor === 'function') {
    mod = new Ctor({ allowDeviceCredentials: true });
  }
} catch {
  mod = null;
}

export const isBiometricsAvailable: boolean = mod !== null;

export async function isSensorAvailable(): Promise<boolean> {
  if (!mod) return false;
  try {
    const res = await mod.isSensorAvailable();
    return Boolean(res?.available);
  } catch {
    return false;
  }
}

export async function authenticate(
  promptMessage: string
): Promise<{ success: boolean; error?: string }> {
  if (!mod) return { success: false, error: 'biometric-unavailable' };
  try {
    const res = await mod.simplePrompt({ promptMessage });
    if (res?.success) return { success: true };
    return { success: false, error: res?.error ?? 'cancelled' };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}
