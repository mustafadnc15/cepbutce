import { recognizeText, isTextRecognitionAvailable } from './textRecognition';
import { readFileAsBase64, isFileSystemAvailable } from './fileSystem';
import { parseReceipt, type ParsedReceiptItem } from '../utils/receiptParser';

export type OCRSource = 'on-device' | 'gemini' | 'unavailable';
export type OCRConfidence = 'high' | 'medium' | 'low';

export interface ReceiptOCR {
  vendor: string | null;
  date: string | null; // YYYY-MM-DD
  total: number | null;
  currency: string;
  items: ParsedReceiptItem[];
  rawText: string | null;
  source: OCRSource;
  confidence: OCRConfidence;
}

function confidenceFor(
  vendor: string | null,
  date: string | null,
  total: number | null
): OCRConfidence {
  if (total === null) return 'low';
  const hits = [vendor, date].filter((x) => x !== null && x !== '').length;
  return hits === 2 ? 'high' : 'medium';
}

// Strategy A — ML Kit on-device. Runs entirely offline, free tier.
async function extractOnDevice(imagePath: string): Promise<ReceiptOCR> {
  if (!isTextRecognitionAvailable) {
    return {
      vendor: null,
      date: null,
      total: null,
      currency: 'TRY',
      items: [],
      rawText: null,
      source: 'unavailable',
      confidence: 'low',
    };
  }
  const result = await recognizeText(imagePath);
  if (!result) {
    return {
      vendor: null,
      date: null,
      total: null,
      currency: 'TRY',
      items: [],
      rawText: null,
      source: 'unavailable',
      confidence: 'low',
    };
  }
  const parsed = parseReceipt(result.text);
  return {
    vendor: parsed.vendor,
    date: parsed.date,
    total: parsed.total,
    currency: parsed.currency,
    items: parsed.items,
    rawText: result.text,
    source: 'on-device',
    confidence: confidenceFor(parsed.vendor, parsed.date, parsed.total),
  };
}

// Strategy B — Gemini Vision. Premium tier, requires API key + network.
// The API key is read from an env-like constant; Phase 7 replaces with the
// real IAP-gated key delivery mechanism.
const GEMINI_API_KEY: string | null = null;
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const GEMINI_PROMPT =
  'Bu bir Türk fiş/fatura görüntüsüdür. Aşağıdaki bilgileri çıkar ve SADECE geçerli JSON formatında yanıtla, başka hiçbir metin ekleme:\n' +
  '{ "vendor": "mağaza adı", "date": "YYYY-MM-DD", "total": sayı, "currency": "TRY", "items": [{"name": "ürün adı", "amount": sayı}] }\n' +
  'Eğer bir alan okunamıyorsa null yaz.';

interface GeminiReply {
  vendor: string | null;
  date: string | null;
  total: number | null;
  currency: string | null;
  items: ParsedReceiptItem[] | null;
}

function parseGeminiJSON(text: string): GeminiReply | null {
  // The model sometimes wraps JSON in ```json ... ``` fences even when told not to.
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
  try {
    const parsed = JSON.parse(cleaned);
    return {
      vendor: typeof parsed.vendor === 'string' ? parsed.vendor : null,
      date: typeof parsed.date === 'string' ? parsed.date : null,
      total: typeof parsed.total === 'number' ? parsed.total : null,
      currency: typeof parsed.currency === 'string' ? parsed.currency : null,
      items: Array.isArray(parsed.items)
        ? parsed.items
            .filter((x: any) => x && typeof x.name === 'string' && typeof x.amount === 'number')
            .map((x: any) => ({ name: x.name, amount: x.amount }))
        : null,
    };
  } catch {
    return null;
  }
}

async function extractWithGemini(imagePath: string): Promise<ReceiptOCR | null> {
  if (!GEMINI_API_KEY || !isFileSystemAvailable) return null;
  const base64 = await readFileAsBase64(imagePath);
  if (!base64) return null;

  try {
    const res = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: GEMINI_PROMPT },
              { inline_data: { mime_type: 'image/jpeg', data: base64 } },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      }),
    });
    if (!res.ok) return null;
    const body = await res.json();
    const text: string | undefined = body?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const parsed = parseGeminiJSON(text);
    if (!parsed) return null;

    return {
      vendor: parsed.vendor,
      date: parsed.date,
      total: parsed.total,
      currency: parsed.currency ?? 'TRY',
      items: parsed.items ?? [],
      rawText: text,
      source: 'gemini',
      confidence: confidenceFor(parsed.vendor, parsed.date, parsed.total),
    };
  } catch (e) {
    console.warn('[ocr] gemini call failed', e);
    return null;
  }
}

// Premium callers should pass true; we fall back to on-device automatically
// when Gemini is unavailable (no key, no network, parse failure) so the user
// never hits a dead end.
export async function extractReceiptData(
  imagePath: string,
  usePremiumAI: boolean
): Promise<ReceiptOCR> {
  if (usePremiumAI) {
    const gemini = await extractWithGemini(imagePath);
    if (gemini) return gemini;
  }
  return extractOnDevice(imagePath);
}
