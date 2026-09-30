import { describe, expect, it } from 'vitest'

import { ExchangeRateError, parseXeResponse } from './exchange-rates'

const now = new Date('2026-09-30T10:00:00Z')

describe('parseXeResponse', () => {
  it('parses the list format', () => {
    const snapshot = parseXeResponse(
      {
        from: 'EUR',
        amount: 1,
        timestamp: '2026-09-30T09:59:00Z',
        to: [
          { quotecurrency: 'TRY', mid: 48.51 },
          { quotecurrency: 'USD', mid: 1.17 },
          { quotecurrency: 'GBP', mid: 0.87 },
        ],
      },
      'EUR',
      ['TRY', 'USD', 'GBP'],
      now,
    )
    expect(snapshot).toEqual({
      baseCurrency: 'EUR',
      rates: [
        { currency: 'TRY', rate: 48.51 },
        { currency: 'USD', rate: 1.17 },
        { currency: 'GBP', rate: 0.87 },
      ],
      source: 'xe.com',
      fetchedAt: '2026-09-30T09:59:00Z',
    })
  })

  it('parses the map format and falls back to now for the timestamp', () => {
    const snapshot = parseXeResponse({ from: 'eur', to: { TRY: 48.5, USD: 1.17 } }, 'EUR', ['TRY', 'USD'], now)
    expect(snapshot.rates).toEqual([
      { currency: 'TRY', rate: 48.5 },
      { currency: 'USD', rate: 1.17 },
    ])
    expect(snapshot.fetchedAt).toBe(now.toISOString())
  })

  it('rejects a wrong base currency, missing currencies and malformed bodies', () => {
    expect(() => parseXeResponse({ from: 'USD', to: { TRY: 40 } }, 'EUR', ['TRY'], now)).toThrow(ExchangeRateError)
    expect(() => parseXeResponse({ from: 'EUR', to: { TRY: 48 } }, 'EUR', ['TRY', 'USD'], now)).toThrow(/missing: USD/)
    expect(() => parseXeResponse({ error: 'unauthorized' }, 'EUR', ['TRY'], now)).toThrow(ExchangeRateError)
    expect(() => parseXeResponse({ from: 'EUR', to: { TRY: 0 } }, 'EUR', ['TRY'], now)).toThrow(ExchangeRateError)
  })
})
