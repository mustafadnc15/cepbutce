// Lazy facade over react-native-fs. Only used for reading a captured receipt
// into base64 for the Gemini Vision call.

let mod: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  mod = require('react-native-fs');
  mod = mod?.default ?? mod;
} catch {
  // Not installed; Gemini path will surface as unavailable.
}

export const isFileSystemAvailable: boolean = mod !== null;

export async function readFileAsBase64(path: string): Promise<string | null> {
  if (!mod) return null;
  try {
    const clean = path.startsWith('file://') ? path.slice('file://'.length) : path;
    return await mod.readFile(clean, 'base64');
  } catch (e) {
    console.warn('[fileSystem] readFile failed', e);
    return null;
  }
}
