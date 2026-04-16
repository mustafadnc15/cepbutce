import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import 'dayjs/locale/en';

type Locale = 'tr' | 'en';

const labels = {
  tr: { today: 'Bugün', yesterday: 'Dün' },
  en: { today: 'Today', yesterday: 'Yesterday' },
};

export function formatRelativeDate(iso: string, locale: Locale): string {
  const target = dayjs(iso).startOf('day');
  const today = dayjs().startOf('day');
  const diffDays = today.diff(target, 'day');

  if (diffDays === 0) return labels[locale].today;
  if (diffDays === 1) return labels[locale].yesterday;

  return dayjs(iso).locale(locale).format('D MMM YYYY');
}

export function formatMonthName(iso: string, locale: Locale): string {
  return dayjs(iso).locale(locale).format('MMMM YYYY');
}
