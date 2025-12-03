import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import de from './locales/de.json'
import es from './locales/es.json'
import fr from './locales/fr.json'

export type MessageSchema = typeof en

const STORAGE_KEY = 'locale'
const SUPPORTED_LOCALES = ['en', 'de', 'es', 'fr'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

function detectBrowserLocale(): SupportedLocale {
  const browserLang = navigator.language.split('-')[0]
  if (SUPPORTED_LOCALES.includes(browserLang as SupportedLocale)) {
    return browserLang as SupportedLocale
  }
  return 'en'
}

function getInitialLocale(): SupportedLocale {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && SUPPORTED_LOCALES.includes(stored as SupportedLocale)) {
    return stored as SupportedLocale
  }
  const detected = detectBrowserLocale()
  localStorage.setItem(STORAGE_KEY, detected)
  return detected
}

export const i18n = createI18n<[MessageSchema], SupportedLocale>({
  legacy: false,
  locale: getInitialLocale(),
  fallbackLocale: 'en',
  messages: {
    en,
    de,
    es,
    fr
  }
})

export const availableLocales: { code: SupportedLocale; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Espanol' },
  { code: 'fr', name: 'Francais' }
]

export function setLocale(locale: SupportedLocale) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(i18n.global.locale as any).value = locale
  localStorage.setItem(STORAGE_KEY, locale)
  document.documentElement.lang = locale
}

export function getCurrentLocale(): SupportedLocale {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (i18n.global.locale as any).value as SupportedLocale
}
