import { formatRelativeDate, formatMonthName } from '../../src/utils/date';
import dayjs from 'dayjs';

describe('formatRelativeDate', () => {
  it('returns "Bugün" for today in Turkish', () => {
    const today = dayjs().toISOString();
    expect(formatRelativeDate(today, 'tr')).toBe('Bugün');
  });

  it('returns "Dün" for yesterday in Turkish', () => {
    const yesterday = dayjs().subtract(1, 'day').toISOString();
    expect(formatRelativeDate(yesterday, 'tr')).toBe('Dün');
  });

  it('returns "Today" for today in English', () => {
    const today = dayjs().toISOString();
    expect(formatRelativeDate(today, 'en')).toBe('Today');
  });
});

describe('formatMonthName', () => {
  it('returns Turkish month name', () => {
    expect(formatMonthName('2026-01-15', 'tr')).toBe('Ocak 2026');
  });

  it('returns English month name', () => {
    expect(formatMonthName('2026-01-15', 'en')).toBe('January 2026');
  });
});
