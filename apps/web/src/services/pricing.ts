import { applyPercent, type Currency, type ExtraPricingType } from '@rent/shared'

/**
 * Pure pricing logic. No Payload/Next imports: inputs are plain data so this can be
 * unit tested and moved to another runtime unchanged.
 */

const MINUTE_MS = 60_000
const DAY_MINUTES = 24 * 60

export type RateTier = { minDays: number; dailyRate: number }

export type SeasonRule = {
  id: number
  startDate: string // YYYY-MM-DD, inclusive
  endDate: string // YYYY-MM-DD, inclusive
  adjustmentPercent: number
  priority: number
  minRentalDays: number | null
  categoryIds: number[] // empty = all categories
}

export type ExtraRule = {
  id: number
  name: string
  pricingType: ExtraPricingType
  price: number
  maxQuantity: number
  maxChargeDays: number | null
}

export type PricingInput = {
  pickupAt: Date
  returnAt: Date
  timeZone: string
  graceMinutes: number
  currency: Currency
  categoryId: number | null
  rateTiers: RateTier[]
  seasons: SeasonRule[]
  extras: { extra: ExtraRule; quantity: number }[]
  transferFee: number
  deposit: number
}

export type PriceBreakdown = {
  rentalDays: number
  currency: Currency
  dailyBreakdown: { date: string; amount: number; seasonId: number | null }[]
  baseTotal: number
  extras: {
    extraId: number
    name: string
    quantity: number
    unitPrice: number
    chargedDays: number | null
    total: number
  }[]
  extrasTotal: number
  transferFee: number
  total: number
  deposit: number
  /** Minimum rental length required by global settings is checked by the caller; this is the seasonal minimum. */
  seasonalMinRentalDays: number | null
}

export class PricingError extends Error {
  constructor(
    public readonly code: 'no_rate_tier' | 'invalid_window' | 'extra_quantity',
    message: string,
  ) {
    super(message)
    this.name = 'PricingError'
  }
}

/** Billable days: every started 24h block counts, after a grace period on the last one. */
export function calculateRentalDays(pickupAt: Date, returnAt: Date, graceMinutes: number): number {
  const minutes = (returnAt.getTime() - pickupAt.getTime()) / MINUTE_MS
  if (minutes <= 0) throw new PricingError('invalid_window', 'returnAt must be after pickupAt')
  return Math.max(1, Math.ceil((minutes - graceMinutes) / DAY_MINUTES))
}

/** Calendar date (YYYY-MM-DD) of an instant in the given time zone. */
export function toLocalDate(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant)
}

export function selectRateTier(tiers: RateTier[], rentalDays: number): RateTier {
  const tier = [...tiers].sort((a, b) => b.minDays - a.minDays).find((candidate) => candidate.minDays <= rentalDays)
  if (!tier) throw new PricingError('no_rate_tier', `No rate tier covers ${rentalDays} day(s)`)
  return tier
}

export function selectSeason(date: string, seasons: SeasonRule[], categoryId: number | null): SeasonRule | null {
  const matching = seasons.filter(
    (season) =>
      season.startDate <= date &&
      date <= season.endDate &&
      (season.categoryIds.length === 0 || (categoryId !== null && season.categoryIds.includes(categoryId))),
  )
  matching.sort((a, b) => b.priority - a.priority || b.id - a.id)
  return matching[0] ?? null
}

export function calculatePrice(input: PricingInput): PriceBreakdown {
  const rentalDays = calculateRentalDays(input.pickupAt, input.returnAt, input.graceMinutes)
  const tier = selectRateTier(input.rateTiers, rentalDays)

  let seasonalMinRentalDays: number | null = null
  const dailyBreakdown = Array.from({ length: rentalDays }, (_, index) => {
    const date = toLocalDate(new Date(input.pickupAt.getTime() + index * DAY_MINUTES * MINUTE_MS), input.timeZone)
    const season = selectSeason(date, input.seasons, input.categoryId)
    if (season?.minRentalDays) {
      seasonalMinRentalDays = Math.max(seasonalMinRentalDays ?? 0, season.minRentalDays)
    }
    const amount = season ? applyPercent(tier.dailyRate, season.adjustmentPercent) : tier.dailyRate
    return { date, amount, seasonId: season?.id ?? null }
  })
  const baseTotal = sum(dailyBreakdown.map((day) => day.amount))

  const extras = input.extras.map(({ extra, quantity }) => {
    if (quantity < 1 || quantity > extra.maxQuantity) {
      throw new PricingError('extra_quantity', `Quantity for "${extra.name}" must be between 1 and ${extra.maxQuantity}`)
    }
    const chargedDays =
      extra.pricingType === 'per_day' ? Math.min(rentalDays, extra.maxChargeDays ?? rentalDays) : null
    const total = extra.price * quantity * (chargedDays ?? 1)
    return { extraId: extra.id, name: extra.name, quantity, unitPrice: extra.price, chargedDays, total }
  })
  const extrasTotal = sum(extras.map((line) => line.total))

  return {
    rentalDays,
    currency: input.currency,
    dailyBreakdown,
    baseTotal,
    extras,
    extrasTotal,
    transferFee: input.transferFee,
    total: baseTotal + extrasTotal + input.transferFee,
    deposit: capDeposit(input.deposit, baseTotal, rentalDays),
    seasonalMinRentalDays,
  }
}

/**
 * Motorlu Kara Taşıtlarının Kiralanması Hakkında Yönetmelik (RG 15.08.2026, art. 14): the deposit may not
 * exceed 3 days' rent for rentals of up to 6 days, or 7 days' rent for 7–29 days. The configured
 * deposit is the ceiling; the day rent is the average daily rent of this booking.
 */
export function capDeposit(deposit: number, baseTotal: number, rentalDays: number): number {
  const averageDay = baseTotal / Math.max(1, rentalDays)
  const cap = Math.floor(averageDay * (rentalDays <= 6 ? 3 : 7))
  return Math.min(deposit, cap)
}

/** Lowest possible daily rate, used for "from €X/day" labels. */
export function lowestDailyRate(tiers: RateTier[]): number {
  return Math.min(...tiers.map((tier) => tier.dailyRate))
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
}
