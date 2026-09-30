import { DEFAULT_TIME_ZONE, type Currency, type Locale } from '@rent/shared/constants'
import { convertMinor } from '@rent/shared/money'

import { INTL_LOCALES } from './constants'

export type DisplayCurrency = { currency: Currency; rate: number }

export function formatMoney(minor: number, currency: Currency, locale: Locale, options: { whole?: boolean } = {}): string {
  const whole = options.whole ?? minor % 100 === 0
  return new Intl.NumberFormat(INTL_LOCALES[locale], {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(minor / 100)
}

/** Formats an amount in the base currency in the visitor's display currency. */
export function formatDisplayPrice(baseMinor: number, display: DisplayCurrency, locale: Locale, options: { whole?: boolean } = {}): string {
  const amount = convertMinor(baseMinor, display.rate)
  // Converted amounts are approximate; whole units read better than odd cents.
  const whole = options.whole ?? (display.rate !== 1 || amount % 100 === 0)
  return formatMoney(whole ? Math.round(amount / 100) * 100 : amount, display.currency, locale, { whole })
}

export function formatDateTime(value: string | Date, locale: Locale, timeZone = DEFAULT_TIME_ZONE): string {
  return new Intl.DateTimeFormat(INTL_LOCALES[locale], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone }).format(
    new Date(value),
  )
}

export function formatDate(value: string | Date, locale: Locale, timeZone = DEFAULT_TIME_ZONE): string {
  return new Intl.DateTimeFormat(INTL_LOCALES[locale], { day: 'numeric', month: 'long', year: 'numeric', timeZone }).format(new Date(value))
}
