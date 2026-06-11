export const SUPPORTED_LOCALES = new Set(['en', 'es']);

export function normalizeLocale(locale) {
  const base = String(locale || '').toLowerCase().split('-')[0];
  return SUPPORTED_LOCALES.has(base) ? base : 'en';
}

export function documentLocale() {
  if (typeof document === 'undefined') return 'en';
  return normalizeLocale(document.documentElement.lang);
}

export const initialDocumentLocale = documentLocale();

export function formatDate(value, locale = documentLocale(), options) {
  return new Date(value).toLocaleDateString(normalizeLocale(locale), options);
}

export function formatNumber(value, locale = documentLocale(), options) {
  return Number(value).toLocaleString(normalizeLocale(locale), options);
}
