/**
 * Date formatting utilities with locale support
 * German locale uses dd.MM.yyyy HH:mm format
 */

type SupportedLocale = 'de' | 'en' | 'fr' | 'es';

const localeMap: Record<SupportedLocale, string> = {
  de: 'de-DE',
  en: 'en-US',
  fr: 'fr-FR',
  es: 'es-ES',
};

/**
 * Get the full locale string for Intl APIs
 */
export function getIntlLocale(locale: string): string {
  return localeMap[locale as SupportedLocale] || 'en-US';
}

/**
 * Format a date string as dd.MM.yyyy for German locale, or locale-appropriate format for others
 */
export function formatDate(dateString: string | null, locale: string, fallback = '—'): string {
  if (!dateString) return fallback;

  const date = new Date(dateString);
  const intlLocale = getIntlLocale(locale);

  return date.toLocaleDateString(intlLocale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format a date string as dd.MM.yyyy HH:mm for German locale, or locale-appropriate format for others
 */
export function formatDateTime(dateString: string | null, locale: string, fallback = '—'): string {
  if (!dateString) return fallback;

  const date = new Date(dateString);
  const intlLocale = getIntlLocale(locale);

  const datePart = date.toLocaleDateString(intlLocale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const timePart = date.toLocaleTimeString(intlLocale, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${datePart} ${timePart}`;
}

/**
 * Format a date with long month name (e.g., "4. Dezember 2024" for German)
 */
export function formatDateLong(dateString: string | null, locale: string, fallback = '—'): string {
  if (!dateString) return fallback;

  const date = new Date(dateString);
  const intlLocale = getIntlLocale(locale);

  return date.toLocaleDateString(intlLocale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
