type SupportedCurrency = 'TRY' | 'USD' | 'EUR' | 'GBP';
type SupportedLocale = 'tr' | 'en';

const localeMap: Record<SupportedLocale, string> = {
  tr: 'tr-TR',
  en: 'en-US',
};

export function formatCurrency(
  amount: number,
  currency: SupportedCurrency,
  locale: SupportedLocale = 'tr'
): string {
  return new Intl.NumberFormat(localeMap[locale], {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Worklet-safe mirror of formatCurrency. Reanimated's UI thread runs on a
// bare Hermes runtime without Intl, so any currency rendering called from
// useAnimatedProps / useDerivedValue must use this variant. Output must
// match formatCurrency exactly (see __tests__/utils/currency.test.ts).
export function formatCurrencyWorklet(
  amount: number,
  currency: SupportedCurrency,
  locale: SupportedLocale = 'tr'
): string {
  'worklet';
  const symbol =
    currency === 'TRY' ? '₺' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';
  const thousandsSep = locale === 'tr' ? '.' : ',';
  const decimalSep = locale === 'tr' ? ',' : '.';

  const negative = amount < 0;
  const abs = negative ? -amount : amount;
  const fixed = abs.toFixed(2);
  const dotIdx = fixed.indexOf('.');
  const intPart = dotIdx === -1 ? fixed : fixed.substring(0, dotIdx);
  const decPart = dotIdx === -1 ? '00' : fixed.substring(dotIdx + 1);

  let grouped = '';
  for (let i = 0; i < intPart.length; i++) {
    if (i > 0 && (intPart.length - i) % 3 === 0) grouped += thousandsSep;
    grouped += intPart[i];
  }

  return (negative ? '-' : '') + symbol + grouped + decimalSep + decPart;
}
