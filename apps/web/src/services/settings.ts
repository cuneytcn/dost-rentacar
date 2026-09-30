import type { Payload, PayloadRequest } from 'payload'

import type { Currency } from '@rent/shared'

import type { Setting } from '@/payload-types'

export type ReservationRules = {
  minLeadTimeHours: number
  minRentalDays: number
  maxRentalDays: number
  maxAdvanceDays: number
  graceMinutes: number
  bufferMinutes: number
  selfCancelCutoffHours: number
}

export async function getSettings(payload: Payload, req?: Partial<PayloadRequest>): Promise<Setting> {
  return payload.findGlobal({ slug: 'settings', depth: 0, req })
}

export function getReservationRules(settings: Setting): ReservationRules {
  const rules = settings.reservationRules
  return {
    minLeadTimeHours: rules?.minLeadTimeHours ?? 2,
    minRentalDays: rules?.minRentalDays ?? 1,
    maxRentalDays: rules?.maxRentalDays ?? 60,
    maxAdvanceDays: rules?.maxAdvanceDays ?? 365,
    graceMinutes: rules?.graceMinutes ?? 60,
    bufferMinutes: rules?.bufferMinutes ?? 60,
    selfCancelCutoffHours: rules?.selfCancelCutoffHours ?? 24,
  }
}

export function getBaseCurrency(settings: Setting): Currency {
  return settings.baseCurrency ?? 'TRY'
}

/** Rate from the base currency to `target`, or null when unknown. */
export async function getExchangeRate(
  payload: Payload,
  baseCurrency: Currency,
  target: Currency,
  req?: Partial<PayloadRequest>,
): Promise<number | null> {
  if (target === baseCurrency) return 1
  const rates = await payload.findGlobal({ slug: 'exchange-rates', depth: 0, req })
  if (rates.baseCurrency && rates.baseCurrency !== baseCurrency) return null
  return rates.rates?.find((entry) => entry.currency === target)?.rate ?? null
}
