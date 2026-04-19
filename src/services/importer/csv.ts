// CSV → Transaction rows. Designed to accept files produced by our own
// export (Tarih, Tür, Kategori, Tutar, Para Birimi, Not — Turkish DD.MM.YYYY
// dates and comma-decimal amounts) but tolerant of the English header set as
// well.

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import i18n from '../../i18n';
import { parseCsv, parseAmountTR } from '../../utils/csv';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { getDB } from '../../db/connection';
import type { TransactionType } from '../../types';

dayjs.extend(customParseFormat);

interface HeaderMap {
  date: string;
  type: string;
  category: string;
  amount: string;
  currency: string;
  note: string;
}

function resolveHeaders(headers: string[]): HeaderMap | null {
  const lc = headers.map((h) => h.trim().toLowerCase());
  // Map either Turkish or English header labels back to our canonical names.
  const findOne = (...candidates: string[]): string | null => {
    for (const c of candidates) {
      const idx = lc.indexOf(c);
      if (idx >= 0) return headers[idx];
    }
    return null;
  };
  const date = findOne('tarih', 'date');
  const type = findOne('tür', 'tur', 'type');
  const category = findOne('kategori', 'category');
  const amount = findOne('tutar', 'amount');
  const currency = findOne('para birimi', 'currency');
  const note = findOne('not', 'note') ?? 'Note'; // optional
  if (!date || !type || !category || !amount || !currency) return null;
  return { date, type, category, amount, currency, note };
}

function parseDate(raw: string): string | null {
  const candidates = ['DD.MM.YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY'];
  for (const fmt of candidates) {
    const d = dayjs(raw, fmt);
    if (d.isValid()) return d.startOf('day').toISOString();
  }
  // dayjs without a format accepts ISO strings:
  const fallback = dayjs(raw);
  if (fallback.isValid()) return fallback.startOf('day').toISOString();
  return null;
}

function parseType(raw: string, lang: string): TransactionType | null {
  const norm = raw.trim().toLowerCase();
  const expense = i18n.t('export.types.expense', { lng: lang }).toLowerCase();
  const income = i18n.t('export.types.income', { lng: lang }).toLowerCase();
  if (norm === expense || norm === 'gider' || norm === 'expense') return 'expense';
  if (norm === income || norm === 'gelir' || norm === 'income') return 'income';
  return null;
}

function parseAmount(raw: string): number | null {
  const tr = parseAmountTR(raw);
  if (tr !== null && !Number.isNaN(tr)) return tr;
  const n = Number(raw.replace(',', '.'));
  return Number.isNaN(n) ? null : n;
}

function resolveCategoryId(name: string, type: TransactionType): string {
  const db = getDB();
  const result = db.executeSync(
    `SELECT id FROM categories WHERE name = ? AND type = ? LIMIT 1;`,
    [name, type]
  );
  const id = result.rows?.[0]?.id;
  if (typeof id === 'string') return id;
  return type === 'expense' ? 'cat_other_expense' : 'cat_other_income';
}

export interface ImportResult {
  ok: number;
  failed: number;
}

export function importCsv(content: string): ImportResult {
  const parsed = parseCsv(content);
  if (parsed.headers.length === 0) return { ok: 0, failed: 0 };
  const map = resolveHeaders(parsed.headers);
  if (!map) return { ok: 0, failed: parsed.rows.length };

  const lang = i18n.language || 'tr';
  const add = useTransactionStore.getState().addTransaction;

  let ok = 0;
  let failed = 0;
  for (const row of parsed.rows) {
    try {
      const dateIso = parseDate(row[map.date] ?? '');
      const type = parseType(row[map.type] ?? '', lang);
      const amount = parseAmount(row[map.amount] ?? '');
      const currency = (row[map.currency] ?? 'TRY').toUpperCase().trim();
      if (!dateIso || !type || amount === null) {
        failed++;
        continue;
      }
      // Subscription rows in our own export reuse the Category column for the
      // subscription name. We skip them on import — users can add those via
      // the subscriptions flow, and we don't want to silently create half-
      // populated subscription records.
      const typeCell = (row[map.type] ?? '').trim().toLowerCase();
      if (typeCell === 'abonelik' || typeCell === 'subscription') {
        failed++;
        continue;
      }
      const categoryName = (row[map.category] ?? '').trim();
      const categoryId = resolveCategoryId(categoryName, type);
      add({
        amount,
        currency,
        type,
        categoryId,
        note: (row[map.note] ?? '').trim() || null,
        date: dateIso,
        receiptUri: null,
        receiptOcrData: null,
        subscriptionId: null,
      });
      ok++;
    } catch {
      failed++;
    }
  }
  return { ok, failed };
}

export { resolveHeaders as __testResolveHeaders };
