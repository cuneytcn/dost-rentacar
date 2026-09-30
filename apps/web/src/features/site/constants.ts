import type { Locale } from '@rent/shared'

export const SITE_CURRENCY_COOKIE = 'site-currency'

/** Prices are shown in Turkish lira until the visitor picks another currency. */
export const DEFAULT_DISPLAY_CURRENCY = 'TRY'

export const INTL_LOCALES: Record<Locale, string> = { tr: 'tr-TR', en: 'en-GB', de: 'de-DE', ru: 'ru-RU' }

export const LOCALE_NAMES: Record<Locale, string> = { tr: 'Türkçe', en: 'English', de: 'Deutsch', ru: 'Русский' }

/** Time used for new searches before the visitor picks one. */
export const DEFAULT_PICKUP_TIME = '10:00'
