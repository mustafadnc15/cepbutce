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
