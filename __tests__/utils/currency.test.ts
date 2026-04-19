import { formatCurrency, formatCurrencyWorklet } from '../../src/utils/currency';

describe('formatCurrency', () => {
  it('formats Turkish lira with dot thousands and comma decimals', () => {
    expect(formatCurrency(1234.56, 'TRY', 'tr')).toBe('₺1.234,56');
  });

  it('formats US dollars with comma thousands and dot decimals', () => {
    expect(formatCurrency(1234.56, 'USD', 'en')).toBe('$1,234.56');
  });

  it('handles zero', () => {
    expect(formatCurrency(0, 'TRY', 'tr')).toBe('₺0,00');
  });

  it('handles negative values', () => {
    expect(formatCurrency(-42.5, 'TRY', 'tr')).toBe('-₺42,50');
  });
});

// The worklet variant must match formatCurrency exactly — it's called from
// the Reanimated UI thread (no Intl) to render the animated balance count-up.
describe('formatCurrencyWorklet', () => {
  const cases: Array<[number, 'TRY' | 'USD' | 'EUR' | 'GBP', 'tr' | 'en']> = [
    [0, 'TRY', 'tr'],
    [1234.56, 'TRY', 'tr'],
    [-42.5, 'TRY', 'tr'],
    [1234.56, 'USD', 'en'],
    [1_000_000, 'TRY', 'tr'],
    [99.995, 'TRY', 'tr'],
  ];

  it.each(cases)('matches formatCurrency for (%s, %s, %s)', (amount, currency, locale) => {
    expect(formatCurrencyWorklet(amount, currency, locale)).toBe(
      formatCurrency(amount, currency, locale)
    );
  });
});
