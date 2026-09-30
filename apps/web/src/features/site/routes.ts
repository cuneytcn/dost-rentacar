import { DEFAULT_LOCALE, LOCALES, type Locale } from '@rent/shared/constants'

/**
 * Localized URL segments for the public site. Route folders under `app/(frontend)/[locale]`
 * and every link in code use the internal (English) segment; `proxy.ts` rewrites the localized
 * spelling to it and redirects other spellings, so each page has exactly one URL per language.
 */
const SEGMENTS: Record<string, Record<Locale, string>> = {
  cars: { tr: 'araclar', en: 'cars', de: 'fahrzeuge', ru: 'avtomobili' },
  booking: { tr: 'rezervasyon', en: 'booking', de: 'buchung', ru: 'bronirovanie' },
  reservation: { tr: 'rezervasyonum', en: 'my-booking', de: 'meine-buchung', ru: 'moe-bronirovanie' },
  corporate: { tr: 'kurumsal', en: 'corporate', de: 'firmenkunden', ru: 'korporativnym-klientam' },
  contact: { tr: 'iletisim', en: 'contact', de: 'kontakt', ru: 'kontakty' },
  faq: { tr: 'sss', en: 'faq', de: 'faq', ru: 'voprosy' },
  // Service area landing pages: /arac-kiralama/foca, /en/car-rental/foca …
  'car-rental': { tr: 'arac-kiralama', en: 'car-rental', de: 'mietwagen', ru: 'arenda-avto' },
  // Legal CMS pages (see LEGAL_PAGE_SLUGS); other CMS pages keep their slug in every language.
  'rental-terms': { tr: 'kiralama-kosullari', en: 'rental-terms', de: 'mietbedingungen', ru: 'usloviya-arendy' },
  'privacy-policy': { tr: 'kvkk-aydinlatma-metni', en: 'privacy-policy', de: 'datenschutz', ru: 'konfidentsialnost' },
  'cookie-policy': { tr: 'cerez-politikasi', en: 'cookie-policy', de: 'cookie-richtlinie', ru: 'politika-cookie' },
}

const TO_INTERNAL = Object.fromEntries(
  LOCALES.map((locale) => [locale, new Map(Object.entries(SEGMENTS).map(([internal, localized]) => [localized[locale], internal]))]),
) as Record<Locale, Map<string, string>>

export function isLocale(value: string | undefined): value is Locale {
  return (LOCALES as readonly string[]).includes(value ?? '')
}

/** Locale of a public URL: the first segment when it is a language code, otherwise the default (Turkish URLs carry no prefix). */
function splitPath(path: string): { locale: Locale; rest: string[] } {
  const [first, ...rest] = path.split('/').filter(Boolean)
  return isLocale(first) ? { locale: first, rest } : { locale: DEFAULT_LOCALE, rest: first ? [first, ...rest] : [] }
}

/**
 * Route-folder path for a public URL, always with the locale segment:
 * `/araclar/fiat-egea` → `/tr/cars/fiat-egea`, `/en/my-booking` → `/en/reservation`.
 * Only the first segment after the locale is localized.
 */
export function toInternalSitePath(path: string): string {
  const { locale, rest } = splitPath(path)
  const [head, ...tail] = rest
  const internal = head ? (TO_INTERNAL[locale].get(head) ?? head) : undefined
  return ['', locale, ...(internal ? [internal] : []), ...tail].join('/')
}

/** Public URL for an internal path: `sitePath('en', '/reservation')` → `/en/my-booking`, `sitePath('tr', '/cars')` → `/araclar`. Query strings are kept. */
export function sitePath(locale: Locale, internalPath = '/'): string {
  const [pathname = '/', query] = internalPath.split('?')
  const [head, ...tail] = pathname.split('/').filter(Boolean)
  const localizedHead = head ? (SEGMENTS[head]?.[locale] ?? head) : undefined
  const segments = [...(locale === DEFAULT_LOCALE ? [] : [locale]), ...(localizedHead ? [localizedHead] : []), ...tail]
  const path = `/${segments.join('/')}`
  return query ? `${path}?${query}` : path
}

/** The same page in another language, from the current public URL. */
export function switchLocalePath(path: string, locale: Locale): string {
  const [pathname = '/', query] = path.split('?')
  const [, , ...rest] = toInternalSitePath(pathname).split('/')
  return sitePath(locale, `/${rest.join('/')}${query ? `?${query}` : ''}`)
}
