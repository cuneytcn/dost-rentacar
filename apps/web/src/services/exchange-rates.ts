import type { Payload } from 'payload'
import { z } from 'zod'

import { CURRENCIES, type Currency } from '@rent/shared'

import { getBaseCurrency, getSettings } from './settings'

/**
 * Exchange rates from the licensed XE Currency Data API (https://xecdapi.xe.com).
 * Scraping xe.com is prohibited by its terms of use, so the API is the only supported source.
 * Credentials: XE_ACCOUNT_ID / XE_API_KEY. Without them the refresh is skipped and the last
 * stored rates stay in use.
 */

const XE_API_URL = 'https://xecdapi.xe.com/v1/convert_from.json/'
const REQUEST_TIMEOUT_MS = 15_000

// XE returns `to` as a list of { quotecurrency, mid }; some plans/versions return a { CODE: rate } map.
const xeResponseSchema = z.object({
  from: z.string(),
  timestamp: z.string().optional(),
  to: z.union([
    z.array(z.object({ quotecurrency: z.string(), mid: z.number().positive() })),
    z.record(z.string(), z.number().positive()),
  ]),
})

export type RateSnapshot = {
  baseCurrency: Currency
  rates: { currency: Currency; rate: number }[]
  source: string
  fetchedAt: string
}

export class ExchangeRateError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'ExchangeRateError'
  }
}

export function isXeConfigured(): boolean {
  return Boolean(process.env.XE_ACCOUNT_ID && process.env.XE_API_KEY)
}

/** Parses an XE convert_from response, keeping only supported currencies. */
export function parseXeResponse(body: unknown, baseCurrency: Currency, targets: Currency[], now: Date): RateSnapshot {
  const parsed = xeResponseSchema.safeParse(body)
  if (!parsed.success) throw new ExchangeRateError('Unexpected XE response format', { cause: parsed.error })
  if (parsed.data.from.toUpperCase() !== baseCurrency) {
    throw new ExchangeRateError(`XE returned rates for ${parsed.data.from}, expected ${baseCurrency}`)
  }

  const entries = Array.isArray(parsed.data.to)
    ? parsed.data.to.map(({ quotecurrency, mid }) => [quotecurrency.toUpperCase(), mid] as const)
    : Object.entries(parsed.data.to).map(([code, rate]) => [code.toUpperCase(), rate] as const)
  const byCurrency = new Map(entries)

  const rates = targets.flatMap((currency) => {
    const rate = byCurrency.get(currency)
    return rate ? [{ currency, rate }] : []
  })
  const missing = targets.filter((currency) => !byCurrency.has(currency))
  if (missing.length) throw new ExchangeRateError(`XE response is missing: ${missing.join(', ')}`)

  return { baseCurrency, rates, source: 'xe.com', fetchedAt: parsed.data.timestamp ?? now.toISOString() }
}

export async function fetchXeRates(baseCurrency: Currency, targets: Currency[], now = new Date()): Promise<RateSnapshot> {
  const url = new URL(XE_API_URL)
  url.searchParams.set('from', baseCurrency)
  url.searchParams.set('to', targets.join(','))
  url.searchParams.set('amount', '1')

  const credentials = Buffer.from(`${process.env.XE_ACCOUNT_ID}:${process.env.XE_API_KEY}`).toString('base64')
  const response = await fetch(url, {
    headers: { Authorization: `Basic ${credentials}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  }).catch((error: unknown) => {
    throw new ExchangeRateError('XE request failed', { cause: error })
  })
  if (!response.ok) {
    throw new ExchangeRateError(`XE responded with HTTP ${response.status}: ${(await response.text()).slice(0, 200)}`)
  }
  return parseXeResponse(await response.json(), baseCurrency, targets, now)
}

export type RefreshResult = { status: 'updated'; snapshot: RateSnapshot } | { status: 'skipped'; reason: string }

/** Fetches current rates for every supported currency and stores them in the `exchange-rates` global. */
export async function refreshExchangeRates(payload: Payload): Promise<RefreshResult> {
  if (!isXeConfigured()) return { status: 'skipped', reason: 'XE_ACCOUNT_ID / XE_API_KEY not set' }

  const baseCurrency = getBaseCurrency(await getSettings(payload))
  const targets = CURRENCIES.filter((currency) => currency !== baseCurrency)
  const snapshot = await fetchXeRates(baseCurrency, targets)

  await payload.updateGlobal({
    slug: 'exchange-rates',
    data: {
      baseCurrency: snapshot.baseCurrency,
      rates: snapshot.rates,
      source: snapshot.source,
      fetchedAt: snapshot.fetchedAt,
    },
  })
  return { status: 'updated', snapshot }
}
