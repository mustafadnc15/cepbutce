// Thin wrapper around react-native-share so callers don't care about the
// native platform differences. Returns true on success, false if the user
// cancelled or the module isn't linked.

let shareMod: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const imported = require('react-native-share');
  shareMod = imported?.default ?? imported;
} catch {
  shareMod = null;
}

export const isShareAvailable: boolean = shareMod !== null;

export interface ShareOptions {
  url: string; // file:// path
  filename: string;
  mimeType: 'text/csv' | 'application/pdf';
}

export async function shareFile(opts: ShareOptions): Promise<boolean> {
  if (!shareMod) return false;
  try {
    const url = opts.url.startsWith('file://') ? opts.url : `file://${opts.url}`;
    await shareMod.open({
      url,
      type: opts.mimeType,
      filename: opts.filename,
      failOnCancel: false,
    });
    return true;
  } catch (e) {
    // `failOnCancel: false` should prevent user-cancel from throwing but the
    // library still throws on some platforms. Treat cancellation as success.
    const msg = e instanceof Error ? e.message : String(e);
    if (/user did not share|cancel|canceled/i.test(msg)) return true;
    console.warn('[share] failed', e);
    return false;
  }
}
