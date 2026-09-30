import { describe, expect, it } from 'vitest'

import {
  calculatePrice,
  capDeposit,
  calculateRentalDays,
  PricingError,
  selectRateTier,
  selectSeason,
  toLocalDate,
  type PricingInput,
  type SeasonRule,
} from './pricing'

const TZ = 'Europe/Istanbul'
const at = (iso: string) => new Date(iso)

const tiers = [
  { minDays: 1, dailyRate: 5000 },
  { minDays: 3, dailyRate: 4500 },
  { minDays: 7, dailyRate: 4000 },
]

const season = (overrides: Partial<SeasonRule>): SeasonRule => ({
  id: 1,
  startDate: '2026-07-01',
  endDate: '2026-08-31',
  adjustmentPercent: 30,
  priority: 0,
  minRentalDays: null,
  categoryIds: [],
  ...overrides,
})

const baseInput = (overrides: Partial<PricingInput> = {}): PricingInput => ({
  pickupAt: at('2026-06-10T10:00:00+03:00'),
  returnAt: at('2026-06-12T10:00:00+03:00'),
  timeZone: TZ,
  graceMinutes: 60,
  currency: 'EUR',
  categoryId: 1,
  rateTiers: tiers,
  seasons: [],
  extras: [],
  transferFee: 0,
  deposit: 20000,
  ...overrides,
})

describe('calculateRentalDays', () => {
  it('counts exact 24h blocks', () => {
    expect(calculateRentalDays(at('2026-06-10T10:00:00Z'), at('2026-06-12T10:00:00Z'), 60)).toBe(2)
  })

  it('applies the grace period to the last block', () => {
    expect(calculateRentalDays(at('2026-06-10T10:00:00Z'), at('2026-06-12T10:59:00Z'), 60)).toBe(2)
    expect(calculateRentalDays(at('2026-06-10T10:00:00Z'), at('2026-06-12T11:01:00Z'), 60)).toBe(3)
  })

  it('charges at least one day', () => {
    expect(calculateRentalDays(at('2026-06-10T10:00:00Z'), at('2026-06-10T12:00:00Z'), 60)).toBe(1)
  })

  it('rejects an inverted window', () => {
    expect(() => calculateRentalDays(at('2026-06-12T10:00:00Z'), at('2026-06-10T10:00:00Z'), 60)).toThrow(PricingError)
  })
})

describe('toLocalDate', () => {
  it('uses the location time zone, not UTC', () => {
    expect(toLocalDate(at('2026-06-10T22:30:00Z'), TZ)).toBe('2026-06-11')
  })
})

describe('selectRateTier', () => {
  it('picks the highest tier not exceeding the rental length', () => {
    expect(selectRateTier(tiers, 1).dailyRate).toBe(5000)
    expect(selectRateTier(tiers, 5).dailyRate).toBe(4500)
    expect(selectRateTier(tiers, 30).dailyRate).toBe(4000)
  })

  it('throws when no tier starts at or below the length', () => {
    expect(() => selectRateTier([{ minDays: 3, dailyRate: 1 }], 2)).toThrow(PricingError)
  })
})

describe('selectSeason', () => {
  it('prefers higher priority and respects categories', () => {
    const seasons = [
      season({ id: 1, priority: 0 }),
      season({ id: 2, priority: 5, categoryIds: [2] }),
      season({ id: 3, priority: 1 }),
    ]
    expect(selectSeason('2026-07-15', seasons, 1)?.id).toBe(3)
    expect(selectSeason('2026-07-15', seasons, 2)?.id).toBe(2)
    expect(selectSeason('2026-09-01', seasons, 1)).toBeNull()
  })
})

describe('calculatePrice', () => {
  it('prices a plain rental with the matching tier', () => {
    const result = calculatePrice(baseInput())
    expect(result.rentalDays).toBe(2)
    expect(result.baseTotal).toBe(10000)
    expect(result.total).toBe(10000)
    // 3 days × 5000 caps the configured 20000 deposit (rental regulation art. 14).
    expect(result.deposit).toBe(15000)
  })

  it('applies seasonal adjustment per day, including partial overlap', () => {
    const result = calculatePrice(
      baseInput({
        pickupAt: at('2026-06-29T10:00:00+03:00'),
        returnAt: at('2026-07-02T10:00:00+03:00'),
        seasons: [season({})],
      }),
    )
    // 3 days -> 4500 tier; 29, 30 June normal, 1 July +30%
    expect(result.dailyBreakdown.map((day) => day.amount)).toEqual([4500, 4500, 5850])
    expect(result.baseTotal).toBe(14850)
  })

  it('reports the seasonal minimum rental length', () => {
    const result = calculatePrice(
      baseInput({
        pickupAt: at('2026-07-10T10:00:00+03:00'),
        returnAt: at('2026-07-12T10:00:00+03:00'),
        seasons: [season({ minRentalDays: 3 })],
      }),
    )
    expect(result.seasonalMinRentalDays).toBe(3)
  })

  it('adds extras, caps per-day charges and includes the transfer fee', () => {
    const result = calculatePrice(
      baseInput({
        pickupAt: at('2026-06-01T10:00:00+03:00'),
        returnAt: at('2026-06-11T10:00:00+03:00'),
        transferFee: 3000,
        extras: [
          {
            extra: { id: 1, name: 'Child seat', pricingType: 'per_day', price: 500, maxQuantity: 2, maxChargeDays: 7 },
            quantity: 2,
          },
          {
            extra: { id: 2, name: 'Additional driver', pricingType: 'per_rental', price: 2000, maxQuantity: 1, maxChargeDays: null },
            quantity: 1,
          },
        ],
      }),
    )
    expect(result.rentalDays).toBe(10)
    expect(result.baseTotal).toBe(40000)
    expect(result.extras[0]).toMatchObject({ chargedDays: 7, total: 7000 })
    expect(result.extras[1]).toMatchObject({ chargedDays: null, total: 2000 })
    expect(result.extrasTotal).toBe(9000)
    expect(result.total).toBe(40000 + 9000 + 3000)
  })

  it('rejects quantities above the limit', () => {
    expect(() =>
      calculatePrice(
        baseInput({
          extras: [
            {
              extra: { id: 1, name: 'Child seat', pricingType: 'per_day', price: 500, maxQuantity: 1, maxChargeDays: null },
              quantity: 2,
            },
          ],
        }),
      ),
    ).toThrow(PricingError)
  })
})

describe('capDeposit', () => {
  it('limits the deposit to 3 days of rent up to 6 days and 7 days of rent from 7 days', () => {
    expect(capDeposit(750000, 3 * 170000, 3)).toBe(510000)
    expect(capDeposit(300000, 3 * 170000, 3)).toBe(300000)
    expect(capDeposit(2000000, 10 * 135000, 10)).toBe(945000)
    expect(capDeposit(750000, 135000, 1)).toBe(405000)
  })
})
