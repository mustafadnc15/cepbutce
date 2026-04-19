// Lazy facade over @react-native-ml-kit/text-recognition. On-device OCR is the
// free-tier path; if the module isn't linked the OCR service falls through to
// a noop and the user can still fill the receipt form manually.

export interface RecognizedBlock {
  text: string;
  frame?: { x: number; y: number; width: number; height: number };
}

export interface RecognizedResult {
  text: string;
  blocks: RecognizedBlock[];
}

let mod: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  mod = require('@react-native-ml-kit/text-recognition');
  mod = mod?.default ?? mod;
} catch {
  // Not installed; recognizeText returns null below.
}

export const isTextRecognitionAvailable: boolean = mod !== null;

export async function recognizeText(imagePath: string): Promise<RecognizedResult | null> {
  if (!mod) return null;
  try {
    const uri = imagePath.startsWith('file://') ? imagePath : `file://${imagePath}`;
    const res = await mod.recognize(uri);
    // Library returns { text, blocks: [{ text, lines, frame }] }.
    const blocks: RecognizedBlock[] = (res?.blocks ?? []).map((b: any) => ({
      text: b.text ?? '',
      frame: b.frame,
    }));
    return {
      text: res?.text ?? '',
      blocks,
    };
  } catch (e) {
    console.warn('[textRecognition] recognize failed', e);
    return null;
  }
}
