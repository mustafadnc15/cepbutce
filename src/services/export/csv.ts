// Builds CSV strings from the app's domain models and writes them to a temp
// file via react-native-fs. Headers are localized; numbers use Turkish
// formatting so the exported file looks native in TRY workflows regardless
// of the UI language.

import dayjs from 'dayjs';
import i18n from '../../i18n';
import { serializeCsv, formatAmountTR } from '../../utils/csv';
import type { Transaction, Subscription, Category } from '../../types';

let fsMod: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const imported = require('react-native-fs');
  fsMod = imported?.default ?? imported;
} catch {
  fsMod = null;
}

export const isFsAvailable: boolean = fsMod !== null;

export interface ExportFlags {
  expenses: boolean;
  incomes: boolean;
  subscriptions: boolean;
}

export interface DateRange {
  start: string; // ISO
  end: string; // ISO
}

export interface BuildCsvInput {
  range: DateRange;
  flags: ExportFlags;
  transactions: Transaction[];
  subscriptions: Subscription[];
  categories: Category[];
}

function categoryName(
  id: string,
  categories: Category[],
  lang: string
): string {
  const cat = categories.find((c) => c.id === id);
  if (!cat) return '';
  const key = `categories.${cat.id}`;
  const translated = i18n.t(key, { lng: lang, defaultValue: cat.name });
  return translated;
}

export function buildCsv(input: BuildCsvInput): string {
  const { range, flags, transactions, subscriptions, categories } = input;
  const lang = i18n.language || 'tr';
  const start = dayjs(range.start);
  const end = dayjs(range.end);

  const rows: Record<string, string>[] = [];

  for (const tx of transactions) {
    const d = dayjs(tx.date);
    if (d.isBefore(start, 'day') || d.isAfter(end, 'day')) continue;
    if (tx.type === 'expense' && !flags.expenses) continue;
    if (tx.type === 'income' && !flags.incomes) continue;
    const typeLabel = i18n.t(`export.types.${tx.type}`, { lng: lang });
    rows.push({
      [i18n.t('export.csvHeaders.date', { lng: lang })]: d.format('DD.MM.YYYY'),
      [i18n.t('export.csvHeaders.type', { lng: lang })]: typeLabel,
      [i18n.t('export.csvHeaders.category', { lng: lang })]: categoryName(tx.categoryId, categories, lang),
      [i18n.t('export.csvHeaders.amount', { lng: lang })]: formatAmountTR(tx.amount),
      [i18n.t('export.csvHeaders.currency', { lng: lang })]: tx.currency,
      [i18n.t('export.csvHeaders.note', { lng: lang })]: tx.note ?? '',
    });
  }

  if (flags.subscriptions) {
    for (const sub of subscriptions) {
      rows.push({
        [i18n.t('export.csvHeaders.date', { lng: lang })]: dayjs(sub.nextRenewalDate).format('DD.MM.YYYY'),
        [i18n.t('export.csvHeaders.type', { lng: lang })]: i18n.t('export.types.subscription', { lng: lang }),
        [i18n.t('export.csvHeaders.category', { lng: lang })]: sub.name,
        [i18n.t('export.csvHeaders.amount', { lng: lang })]: formatAmountTR(sub.amount),
        [i18n.t('export.csvHeaders.currency', { lng: lang })]: sub.currency,
        [i18n.t('export.csvHeaders.note', { lng: lang })]: sub.note ?? '',
      });
    }
  }

  const headers = [
    i18n.t('export.csvHeaders.date', { lng: lang }),
    i18n.t('export.csvHeaders.type', { lng: lang }),
    i18n.t('export.csvHeaders.category', { lng: lang }),
    i18n.t('export.csvHeaders.amount', { lng: lang }),
    i18n.t('export.csvHeaders.currency', { lng: lang }),
    i18n.t('export.csvHeaders.note', { lng: lang }),
  ];
  return serializeCsv(rows, headers);
}

export async function writeCsvFile(content: string): Promise<string | null> {
  if (!fsMod) return null;
  const filename = `cepbutce-${dayjs().format('YYYYMMDD-HHmm')}.csv`;
  const path = `${fsMod.DocumentDirectoryPath}/${filename}`;
  try {
    // Write with UTF-8 BOM so Excel opens Turkish characters correctly.
    await fsMod.writeFile(path, '\ufeff' + content, 'utf8');
    return path;
  } catch (e) {
    console.warn('[csv] writeFile failed', e);
    return null;
  }
}
