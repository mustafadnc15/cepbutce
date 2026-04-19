// Minimal CSV serializer/parser. RFC 4180-ish — fields containing separator,
// newline, or double-quote get wrapped in double-quotes with the quote doubled.

export type CsvRow = Record<string, string | number | null | undefined>;

export function serializeCsv(rows: CsvRow[], headers: string[]): string {
  const lines: string[] = [headers.map(escapeField).join(',')];
  for (const row of rows) {
    const cells = headers.map((h) => escapeField(toCell(row[h])));
    lines.push(cells.join(','));
  }
  // Explicit CRLF so Excel on Windows reads it cleanly.
  return lines.join('\r\n');
}

function toCell(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val);
}

function escapeField(val: string): string {
  if (val === '') return '';
  const needsQuoting = /[",\r\n]/.test(val);
  if (!needsQuoting) return val;
  return `"${val.replace(/"/g, '""')}"`;
}

export interface ParseResult {
  headers: string[];
  rows: Record<string, string>[];
}

export function parseCsv(input: string): ParseResult {
  const trimmed = input.replace(/^\ufeff/, ''); // strip BOM if present
  if (!trimmed.trim()) return { headers: [], rows: [] };

  const records = tokenize(trimmed);
  if (records.length === 0) return { headers: [], rows: [] };

  const headers = records[0];
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < records.length; i++) {
    const rec = records[i];
    if (rec.length === 1 && rec[0] === '') continue; // trailing empty line
    const obj: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = rec[j] ?? '';
    }
    rows.push(obj);
  }
  return { headers, rows };
}

// State-machine tokenizer that handles quoted fields containing commas and
// newlines. Accepts both LF and CRLF line terminators.
function tokenize(input: string): string[][] {
  const out: string[][] = [];
  let row: string[] = [];
  let field = '';
  let i = 0;
  let inQuotes = false;

  while (i < input.length) {
    const ch = input[i];

    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ',') {
      row.push(field);
      field = '';
      i++;
      continue;
    }
    if (ch === '\r') {
      // Treat \r\n as one break; bare \r also ends a row.
      row.push(field);
      field = '';
      out.push(row);
      row = [];
      i++;
      if (input[i] === '\n') i++;
      continue;
    }
    if (ch === '\n') {
      row.push(field);
      field = '';
      out.push(row);
      row = [];
      i++;
      continue;
    }
    field += ch;
    i++;
  }

  // Flush the last record if the file doesn't end with a newline.
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    out.push(row);
  }
  return out;
}

// Turkish number format: dot thousand separator, comma decimal — matching
// the in-app formatCurrency output.
export function formatAmountTR(amount: number): string {
  const negative = amount < 0;
  const abs = negative ? -amount : amount;
  const fixed = abs.toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  let grouped = '';
  for (let i = 0; i < intPart.length; i++) {
    if (i > 0 && (intPart.length - i) % 3 === 0) grouped += '.';
    grouped += intPart[i];
  }
  return (negative ? '-' : '') + grouped + ',' + decPart;
}

export function parseAmountTR(raw: string): number | null {
  const cleaned = raw.trim().replace(/\./g, '').replace(',', '.');
  const n = Number(cleaned);
  if (Number.isNaN(n)) return null;
  return n;
}
