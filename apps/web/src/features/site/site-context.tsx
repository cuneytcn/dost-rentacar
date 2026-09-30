'use client'

import { createContext, useContext, useMemo } from 'react'

import type { Currency, Locale, PublicSettings } from '@rent/shared'

import { INTL_LOCALES } from './constants'
import { formatDisplayPrice, formatMoney, type DisplayCurrency } from './format'
import type { Messages } from './i18n/messages/en'
import { format, formatPlural, type Plural } from './i18n/types'
import { sitePath } from './routes'
import { violationText } from './violations'

type SiteContextValue = {
  locale: Locale
  messages: Messages
  display: DisplayCurrency
  baseCurrency: Currency
  rules: PublicSettings['reservationRules']
}

const SiteContext = createContext<SiteContextValue | null>(null)

export function SiteProvider({ children, ...value }: SiteContextValue & { children: React.ReactNode }) {
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}

function useSiteContext(): SiteContextValue {
  const context = useContext(SiteContext)
  if (!context) throw new Error('useSite must be used inside <SiteProvider>')
  return context
}

/** Locale, dictionary and formatting helpers for client components of the public site. */
export function useSite() {
  const context = useSiteContext()
  return useMemo(() => {
    const intlLocale = INTL_LOCALES[context.locale]
    return {
      ...context,
      m: context.messages,
      intlLocale,
      href: (internalPath: string) => sitePath(context.locale, internalPath),
      fmt: (message: string, values?: Record<string, string | number>) => format(message, values),
      plural: (message: Plural, count: number, values?: Record<string, string | number>) => formatPlural(intlLocale, message, count, values),
      /** Base-currency amount shown in the visitor's currency. */
      price: (baseMinor: number, options?: { whole?: boolean }) => formatDisplayPrice(baseMinor, context.display, context.locale, options),
      money: (minor: number, currency: Currency) => formatMoney(minor, currency, context.locale),
      /** Customer-facing text for a booking rule violation or unavailability code. */
      violation: (code: string | null | undefined) => violationText(context.messages, intlLocale, context.rules, code),
    }
  }, [context])
}

