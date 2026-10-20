import { format as dfFormat } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import type { TFunction } from 'i18next';

const LOCALES = { en: enUS, fr } as const;

export const localeFor = (lang: string) => (lang === 'fr' ? LOCALES.fr : LOCALES.en);

export const formatTime = (value: Date | string) => dfFormat(typeof value === 'string' ? new Date(value) : value, 'HH:mm');

export function formatDate(value: Date | string, pattern: string, lang: string) {
  return dfFormat(typeof value === 'string' ? new Date(value) : value, pattern, { locale: localeFor(lang) });
}

export function formatDuration(totalMinutes: number, t: TFunction): string {
  const m = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(m / 60);
  return h > 0 ? t('common.hoursShort', { h, m: m % 60 }) : t('common.minutesShort', { m });
}

export function formatDistance(meters: number, t: TFunction): string {
  return meters >= 1000
    ? t('common.km', { value: (meters / 1000).toFixed(1) })
    : t('common.meters', { value: Math.round(meters) });
}

/** Capitalise the first letter (date-fns lowercases French weekdays/months). */
export const capitalize = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
