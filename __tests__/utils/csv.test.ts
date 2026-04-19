import {
  serializeCsv,
  parseCsv,
  formatAmountTR,
  parseAmountTR,
} from '../../src/utils/csv';

describe('formatAmountTR / parseAmountTR', () => {
  it('formats with Turkish thousands + decimal conventions', () => {
    expect(formatAmountTR(1234.56)).toBe('1.234,56');
    expect(formatAmountTR(0)).toBe('0,00');
    expect(formatAmountTR(-42.5)).toBe('-42,50');
    expect(formatAmountTR(1_000_000)).toBe('1.000.000,00');
  });

  it('round-trips format → parse', () => {
    const cases = [0, 1, 42.5, 1234.56, 999999.99, -100.25];
    for (const n of cases) {
      const formatted = formatAmountTR(n);
      const parsed = parseAmountTR(formatted);
      expect(parsed).toBeCloseTo(n, 2);
    }
  });

  it('rejects obvious garbage', () => {
    expect(parseAmountTR('abc')).toBeNull();
  });
});

describe('serializeCsv / parseCsv', () => {
  it('round-trips simple rows', () => {
    const rows = [
      { Tarih: '01.01.2026', Tür: 'Gider', Tutar: '42,00' },
      { Tarih: '02.01.2026', Tür: 'Gelir', Tutar: '1.000,00' },
    ];
    const csv = serializeCsv(rows, ['Tarih', 'Tür', 'Tutar']);
    const parsed = parseCsv(csv);
    expect(parsed.headers).toEqual(['Tarih', 'Tür', 'Tutar']);
    expect(parsed.rows).toEqual(rows);
  });

  it('escapes commas, quotes, and newlines inside fields', () => {
    const rows = [
      { Not: 'Hello, world' },
      { Not: 'She said "hi"' },
      { Not: 'line1\nline2' },
    ];
    const csv = serializeCsv(rows, ['Not']);
    const parsed = parseCsv(csv);
    expect(parsed.rows).toEqual(rows);
  });

  it('handles empty input', () => {
    expect(parseCsv('')).toEqual({ headers: [], rows: [] });
  });

  it('strips a leading BOM', () => {
    const withBom = '\ufeffcol\r\nval';
    const parsed = parseCsv(withBom);
    expect(parsed.headers).toEqual(['col']);
    expect(parsed.rows).toEqual([{ col: 'val' }]);
  });
});
