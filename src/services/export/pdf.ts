// Builds an HTML report string and renders it to a PDF via
// react-native-html-to-pdf. Keeps the CSS simple so RNHTMLtoPDF's webview-
// based renderer doesn't choke — no flex, no variables.

import dayjs from 'dayjs';
import i18n from '../../i18n';
import { formatAmountTR } from '../../utils/csv';
import type { Transaction, Category } from '../../types';
import type { BuildCsvInput } from './csv';

let pdfMod: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const imported = require('react-native-html-to-pdf');
  pdfMod = imported?.default ?? imported;
} catch {
  pdfMod = null;
}

export const isPdfAvailable: boolean = pdfMod !== null;

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function categoryName(id: string, cats: Category[], lang: string): string {
  const cat = cats.find((c) => c.id === id);
  if (!cat) return '';
  return i18n.t(`categories.${cat.id}`, { lng: lang, defaultValue: cat.name });
}

interface Summary {
  income: number;
  expense: number;
  net: number;
  top: { name: string; amount: number }[];
}

function summarize(
  txs: Transaction[],
  cats: Category[],
  lang: string,
  start: dayjs.Dayjs,
  end: dayjs.Dayjs
): Summary {
  let income = 0;
  let expense = 0;
  const byCat: Record<string, number> = {};
  for (const tx of txs) {
    const d = dayjs(tx.date);
    if (d.isBefore(start, 'day') || d.isAfter(end, 'day')) continue;
    if (tx.type === 'income') income += tx.amount;
    else {
      expense += tx.amount;
      byCat[tx.categoryId] = (byCat[tx.categoryId] ?? 0) + tx.amount;
    }
  }
  const top = Object.entries(byCat)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, amount]) => ({ name: categoryName(id, cats, lang), amount }));
  return { income, expense, net: income - expense, top };
}

export function buildHtml(input: BuildCsvInput): string {
  const lang = i18n.language || 'tr';
  const t = (k: string, opts?: Record<string, unknown>): string =>
    String(i18n.t(k, { lng: lang, ...(opts ?? {}) }));
  const start = dayjs(input.range.start);
  const end = dayjs(input.range.end);
  const summary = summarize(input.transactions, input.categories, lang, start, end);

  const txRows = input.transactions
    .filter((tx) => {
      const d = dayjs(tx.date);
      if (d.isBefore(start, 'day') || d.isAfter(end, 'day')) return false;
      if (tx.type === 'expense' && !input.flags.expenses) return false;
      if (tx.type === 'income' && !input.flags.incomes) return false;
      return true;
    })
    .map((tx) => {
      const d = dayjs(tx.date).format('DD.MM.YYYY');
      const type = t(`export.types.${tx.type}`);
      const cat = categoryName(tx.categoryId, input.categories, lang);
      const amt = formatAmountTR(tx.amount) + ' ' + tx.currency;
      const sign = tx.type === 'expense' ? '-' : '+';
      const color = tx.type === 'expense' ? '#E53935' : '#00A857';
      return `<tr>
        <td>${esc(d)}</td>
        <td>${esc(type)}</td>
        <td>${esc(cat)}</td>
        <td style="color:${color};text-align:right">${sign}${esc(amt)}</td>
        <td>${esc(tx.note ?? '')}</td>
      </tr>`;
    })
    .join('');

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<title>${esc(t('export.pdfReport.title'))}</title>
<style>
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #111; margin: 32px; }
  h1 { color: #00A857; margin: 0 0 4px 0; font-size: 28px; }
  .sub { color: #6B6B70; margin: 0 0 24px 0; font-size: 13px; }
  h2 { font-size: 16px; margin: 24px 0 8px 0; color: #111; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { padding: 8px 10px; border-bottom: 1px solid #EFEFF1; text-align: left; }
  th { background: #F7F7F8; font-weight: 600; color: #48484A; }
  .summary td { padding: 6px 10px; }
  .summary .label { color: #6B6B70; }
  .summary .value { text-align: right; font-weight: 600; }
  .positive { color: #00A857; }
  .negative { color: #E53935; }
</style>
</head>
<body>
  <h1>${esc(t('export.pdfReport.title'))}</h1>
  <p class="sub">
    ${esc(t('export.pdfReport.period'))}: ${esc(start.format('DD.MM.YYYY'))} – ${esc(end.format('DD.MM.YYYY'))}
    &nbsp;·&nbsp;
    ${esc(t('export.pdfReport.generated'))}: ${esc(dayjs().format('DD.MM.YYYY HH:mm'))}
  </p>

  <h2>${esc(t('export.pdfReport.summary'))}</h2>
  <table class="summary">
    <tr><td class="label">${esc(t('export.pdfReport.totalIncome'))}</td><td class="value positive">${esc(formatAmountTR(summary.income))}</td></tr>
    <tr><td class="label">${esc(t('export.pdfReport.totalExpense'))}</td><td class="value negative">${esc(formatAmountTR(summary.expense))}</td></tr>
    <tr><td class="label">${esc(t('export.pdfReport.net'))}</td><td class="value">${esc(formatAmountTR(summary.net))}</td></tr>
  </table>

  ${
    summary.top.length > 0
      ? `<h2>${esc(t('export.pdfReport.topCategories'))}</h2>
         <table>
           ${summary.top
             .map(
               (c) =>
                 `<tr><td>${esc(c.name)}</td><td style="text-align:right">${esc(formatAmountTR(c.amount))}</td></tr>`
             )
             .join('')}
         </table>`
      : ''
  }

  <h2>${esc(t('export.pdfReport.transactions'))}</h2>
  <table>
    <thead>
      <tr>
        <th>${esc(t('export.csvHeaders.date'))}</th>
        <th>${esc(t('export.csvHeaders.type'))}</th>
        <th>${esc(t('export.csvHeaders.category'))}</th>
        <th style="text-align:right">${esc(t('export.csvHeaders.amount'))}</th>
        <th>${esc(t('export.csvHeaders.note'))}</th>
      </tr>
    </thead>
    <tbody>${txRows}</tbody>
  </table>
</body>
</html>`;
}

export async function writePdf(html: string): Promise<string | null> {
  if (!pdfMod) return null;
  try {
    const filename = `cepbutce-${dayjs().format('YYYYMMDD-HHmm')}`;
    const res = await pdfMod.convert({
      html,
      fileName: filename,
      directory: 'Documents',
    });
    return res?.filePath ?? null;
  } catch (e) {
    console.warn('[pdf] convert failed', e);
    return null;
  }
}

export type { BuildCsvInput };
