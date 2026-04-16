import { formatCurrency } from '../../src/utils/currency';

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
