import 'server-only'

import type { Currency, Locale } from '@rent/shared'

import { INTL_LOCALES } from './constants'
import { getDisplayCurrency } from './data'
import { formatDisplayPrice, formatMoney } from './format'
import { getMessages } from './i18n/server'
import { format, formatPlural, type Plural } from './i18n/types'
import { sitePath } from './routes'

/** Server-side counterpart of `useSite()`: dictionary, links and price formatting for a locale. */
export async function getSiteKit(locale: Locale) {
  const messages = getMessages(locale)
  const display = await getDisplayCurrency(locale)
  const intlLocale = INTL_LOCALES[locale]
  return {
    locale,
    m: messages,
    messages,
    display,
    intlLocale,
    href: (internalPath: string) => sitePath(locale, internalPath),
    fmt: (message: string, values?: Record<string, string | number>) => format(message, values),
    plural: (message: Plural, count: number, values?: Record<string, string | number>) => formatPlural(intlLocale, message, count, values),
    price: (baseMinor: number, options?: { whole?: boolean }) => formatDisplayPrice(baseMinor, display, locale, options),
    money: (minor: number, currency: Currency) => formatMoney(minor, currency, locale),
  }
}

export type SiteKit = Awaited<ReturnType<typeof getSiteKit>>
