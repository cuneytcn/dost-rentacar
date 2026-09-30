import type { Payload, PayloadRequest } from 'payload'

import { convertMinor, type Currency, type Locale, type Quote } from '@rent/shared'

import { relationId } from '@/lib/relations'
import type { Location, Setting, VehicleModel } from '@/payload-types'

import {
  getActiveLocation,
  getExtraRules,
  getSeasons,
  getTransferFee,
  toOpeningHours,
  toRateTiers,
} from './catalog'
import { ServiceError } from './errors'
import { calculatePrice, PricingError, toLocalDate, type ExtraRule, type PriceBreakdown, type SeasonRule } from './pricing'
import { checkRentalRules, type RuleViolation } from './rental-rules'
import { getBaseCurrency, getExchangeRate, getReservationRules, getSettings, type ReservationRules } from './settings'

export type RentalWindowParams = {
  pickupLocationId: number
  returnLocationId: number
  pickupAt: string
  returnAt: string
  currency?: Currency
  extras?: { extraId: number; quantity: number }[]
}

type Ctx = { req?: Partial<PayloadRequest>; locale?: Locale; now?: Date }

/** Everything needed to price any vehicle model for one rental window, loaded once. */
export type QuoteEnvironment = {
  settings: Setting
  rules: ReservationRules
  baseCurrency: Currency
  pickupAt: Date
  returnAt: Date
  now: Date
  pickupLocation: Location
  returnLocation: Location
  seasons: SeasonRule[]
  transferFee: number
  extraRules: Map<number, ExtraRule>
  selectedExtras: { extraId: number; quantity: number }[]
  display: { currency: Currency; rate: number } | null
}

export type ModelQuote = {
  quote: Quote
  breakdown: PriceBreakdown
  violations: RuleViolation[]
}

export async function loadQuoteEnvironment(payload: Payload, params: RentalWindowParams, ctx: Ctx = {}): Promise<QuoteEnvironment> {
  const settings = await getSettings(payload, ctx.req)
  const baseCurrency = getBaseCurrency(settings)
  const [pickupLocation, returnLocation] = await Promise.all([
    getActiveLocation(payload, params.pickupLocationId, ctx),
    getActiveLocation(payload, params.returnLocationId, ctx),
  ])
  if (!pickupLocation.allowsPickup) throw new ServiceError('rule_violation', 'Pickup is not available at this location')
  if (!returnLocation.allowsReturn) throw new ServiceError('rule_violation', 'Return is not available at this location')

  const pickupAt = new Date(params.pickupAt)
  const returnAt = new Date(params.returnAt)
  const selectedExtras = mergeExtras(params.extras ?? [])

  const [seasons, transferFee, extraRules, display] = await Promise.all([
    getSeasons(payload, toLocalDate(pickupAt, pickupLocation.timeZone), toLocalDate(returnAt, pickupLocation.timeZone), ctx),
    getTransferFee(payload, pickupLocation.id, returnLocation.id, ctx),
    getExtraRules(
      payload,
      selectedExtras.map((extra) => extra.extraId),
      ctx,
    ),
    resolveDisplay(payload, baseCurrency, params.currency, ctx),
  ])

  return {
    settings,
    rules: getReservationRules(settings),
    baseCurrency,
    pickupAt,
    returnAt,
    now: ctx.now ?? new Date(),
    pickupLocation,
    returnLocation,
    seasons,
    transferFee,
    extraRules,
    selectedExtras,
    display,
  }
}

export function quoteForModel(env: QuoteEnvironment, model: VehicleModel): ModelQuote {
  let breakdown: PriceBreakdown
  try {
    breakdown = calculatePrice({
      pickupAt: env.pickupAt,
      returnAt: env.returnAt,
      timeZone: env.pickupLocation.timeZone,
      graceMinutes: env.rules.graceMinutes,
      currency: env.baseCurrency,
      categoryId: relationId(model.category),
      rateTiers: toRateTiers(model),
      seasons: env.seasons,
      extras: env.selectedExtras.map(({ extraId, quantity }) => ({ extra: env.extraRules.get(extraId)!, quantity })),
      transferFee: env.transferFee,
      deposit: model.deposit,
    })
  } catch (error) {
    if (error instanceof PricingError) throw new ServiceError('validation_error', error.message, { code: error.code })
    throw error
  }

  const violations = checkRentalRules({
    now: env.now,
    pickupAt: env.pickupAt,
    returnAt: env.returnAt,
    rentalDays: breakdown.rentalDays,
    seasonalMinRentalDays: breakdown.seasonalMinRentalDays,
    rules: env.rules,
    pickupLocation: { openingHours: toOpeningHours(env.pickupLocation), timeZone: env.pickupLocation.timeZone },
    returnLocation: { openingHours: toOpeningHours(env.returnLocation), timeZone: env.returnLocation.timeZone },
  })

  const quote: Quote = {
    vehicleModelId: model.id,
    rentalDays: breakdown.rentalDays,
    currency: breakdown.currency,
    dailyBreakdown: breakdown.dailyBreakdown,
    baseTotal: breakdown.baseTotal,
    extras: breakdown.extras,
    extrasTotal: breakdown.extrasTotal,
    transferFee: breakdown.transferFee,
    total: breakdown.total,
    deposit: breakdown.deposit,
    display: env.display
      ? { currency: env.display.currency, rate: env.display.rate, total: convertMinor(breakdown.total, env.display.rate) }
      : null,
  }
  return { quote, breakdown, violations }
}

export function assertNoViolations(violations: RuleViolation[]): void {
  if (violations.length > 0) {
    throw new ServiceError('rule_violation', 'The requested rental does not meet the booking rules', { violations })
  }
}

function mergeExtras(extras: { extraId: number; quantity: number }[]) {
  const merged = new Map<number, number>()
  for (const { extraId, quantity } of extras) merged.set(extraId, (merged.get(extraId) ?? 0) + quantity)
  return [...merged].map(([extraId, quantity]) => ({ extraId, quantity }))
}

async function resolveDisplay(
  payload: Payload,
  baseCurrency: Currency,
  currency: Currency | undefined,
  ctx: Ctx,
): Promise<QuoteEnvironment['display']> {
  if (!currency || currency === baseCurrency) return null
  const rate = await getExchangeRate(payload, baseCurrency, currency, ctx.req)
  return rate ? { currency, rate } : null
}
