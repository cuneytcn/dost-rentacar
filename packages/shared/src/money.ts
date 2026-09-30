import type { Currency } from './constants'

/** Monetary amount in integer minor units (e.g. cents). */
export type Money = {
  amount: number
  currency: Currency
}

/** Rates are expressed as: 1 unit of base currency = `rate` units of target currency. */
export function convertMinor(amount: number, rate: number): number {
  return Math.round(amount * rate)
}

export function applyPercent(amount: number, percent: number): number {
  return Math.round((amount * (100 + percent)) / 100)
}

export function formatMoney(money: Money, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: money.currency,
  }).format(money.amount / 100)
}
