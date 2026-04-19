// Heuristic parser for Turkish supermarket/restaurant receipts. Input is the
// raw text ML Kit produces; output is the best-guess structured fields. Used
// by the on-device (free tier) path; Gemini returns structured JSON directly.

import dayjs from 'dayjs';

export interface ParsedReceiptItem {
  name: string;
  amount: number;
}

export interface ParsedReceipt {
  vendor: string | null;
  date: string | null; // ISO date (YYYY-MM-DD) at local midnight
  total: number | null;
  currency: string;
  items: ParsedReceiptItem[];
}

// Keywords that commonly label the grand total on a Turkish receipt.
const TOTAL_KEYWORDS = [
  'GENEL TOPLAM',
  'TOPLAM',
  'TOTAL',
  'TUTARI',
  'TUTAR',
  'NET TUTAR',
  'ÖDENECEK',
  'ODENECEK',
];

const VENDOR_SKIP_LINES = [
  /^fi[sş]$/i,
  /^fatura$/i,
  /^ta[sş]a?t$/i,
  /^hosgeldiniz$/i,
  /^ho[sş]geldiniz$/i,
  /^tarih[:：]?/i,
  /^saat[:：]?/i,
  /^no[:：]?/i,
  /^\d+$/,
];

// Strip thousand separators and normalize decimal comma → dot so parseFloat
// can read Turkish-formatted numbers.
function toNumber(raw: string): number | null {
  // Remove currency symbols and whitespace
  let s = raw.replace(/₺|TL|TRY/gi, '').trim();
  if (!s) return null;

  // If both '.' and ',' appear, assume Turkish format: '.' as thousands, ',' as decimal.
  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes(',')) {
    // Only comma → decimal separator
    s = s.replace(',', '.');
  }
  // Keep digits, dot, and leading minus
  const m = s.match(/-?\d+(?:\.\d+)?/);
  if (!m) return null;
  const n = parseFloat(m[0]);
  return Number.isFinite(n) ? n : null;
}

function extractTotal(lines: string[]): number | null {
  // Pass 1: lines containing a total keyword — pick the largest number on
  // such lines (the VAT breakdown sometimes lists smaller sub-totals first).
  const candidates: number[] = [];
  for (const line of lines) {
    const upper = line.toLocaleUpperCase('tr-TR');
    if (!TOTAL_KEYWORDS.some((kw) => upper.includes(kw))) continue;
    // Find every number on the line and keep the largest. Works whether the
    // line is "TOPLAM 124,50" or "GENEL TOPLAM: 124,50 TL".
    const matches = line.match(/-?\d[\d\.,]*/g);
    if (!matches) continue;
    for (const m of matches) {
      const n = toNumber(m);
      if (n !== null && n > 0) candidates.push(n);
    }
  }
  if (candidates.length > 0) return Math.max(...candidates);

  // Pass 2: no keyword hit — fall back to the largest number on the whole
  // receipt as a rough guess.
  const all: number[] = [];
  for (const line of lines) {
    const matches = line.match(/-?\d[\d\.,]*/g);
    if (!matches) continue;
    for (const m of matches) {
      const n = toNumber(m);
      if (n !== null && n > 0) all.push(n);
    }
  }
  if (all.length === 0) return null;
  return Math.max(...all);
}

function extractDate(lines: string[]): string | null {
  // Match common Turkish date formats: 12.04.2026, 12/04/2026, 12-04-2026
  // (day-first). Also tolerate 2-digit year.
  const re = /\b([0-3]?\d)[.\/\-]([01]?\d)[.\/\-]((?:19|20)?\d{2})\b/;
  for (const line of lines) {
    const m = line.match(re);
    if (!m) continue;
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    let year = parseInt(m[3], 10);
    if (year < 100) year += 2000;
    if (day < 1 || day > 31 || month < 1 || month > 12) continue;
    const iso = dayjs(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    if (!iso.isValid()) continue;
    return iso.format('YYYY-MM-DD');
  }
  return null;
}

function extractVendor(lines: string[]): string | null {
  // Vendors almost always sit on the first non-empty, non-skip line.
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (VENDOR_SKIP_LINES.some((re) => re.test(line))) continue;
    // Too numeric → probably a receipt number, not a store name.
    const letters = line.replace(/[^\p{L}]/gu, '');
    if (letters.length < 3) continue;
    // Clip overly long lines (some receipts paste the full legal name).
    return line.length > 40 ? line.substring(0, 40).trim() : line;
  }
  return null;
}

// A "line item" row looks like:  "ELMA KG    2,50"  or  "EKMEK   5.00 TL"
// We need a name (text) followed by a price at the end.
function extractItems(lines: string[]): ParsedReceiptItem[] {
  const itemRe = /^(.+?)\s+(-?\d[\d\.,]*)\s*(?:TL|₺|TRY)?$/i;
  const out: ParsedReceiptItem[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    // Skip lines that are clearly totals/metadata so they don't appear as items.
    const upper = line.toLocaleUpperCase('tr-TR');
    if (TOTAL_KEYWORDS.some((kw) => upper.includes(kw))) continue;
    if (/\b(KDV|VAT|ARA TOPLAM|SUBTOTAL|TARIH|SAAT|FI[SŞ])\b/.test(upper)) continue;

    const m = line.match(itemRe);
    if (!m) continue;
    const name = m[1].trim();
    const amount = toNumber(m[2]);
    if (!name || amount === null || amount <= 0) continue;
    // Require a couple of letters in the name — otherwise the regex matches
    // "12345   42,00" as item "12345" which is useless.
    const letters = name.replace(/[^\p{L}]/gu, '');
    if (letters.length < 2) continue;
    out.push({ name: name.length > 30 ? name.substring(0, 30) : name, amount });
  }
  return out;
}

export function parseReceipt(rawText: string): ParsedReceipt {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const total = extractTotal(lines);
  const date = extractDate(lines);
  const vendor = extractVendor(lines);
  const items = extractItems(lines);

  // If we found a total and items, drop the last item when it duplicates the
  // total — some receipts repeat the grand total as a trailing line.
  const filteredItems =
    total !== null && items.length > 0 && Math.abs(items[items.length - 1].amount - total) < 0.01
      ? items.slice(0, -1)
      : items;

  return {
    vendor,
    date,
    total,
    currency: 'TRY',
    items: filteredItems,
  };
}
