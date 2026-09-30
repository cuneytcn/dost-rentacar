import type { LocationDto } from '@rent/shared'

import { addDays } from '@/lib/time-grid'
import { fromDateTimeLocal, toDateTimeLocal } from '@/lib/local-datetime'

import { DEFAULT_PICKUP_TIME } from './constants'

/**
 * A car search as it lives in the URL: office ids and local wall-clock times at the pick-up office
 * (`?pickup=1&return=1&from=2026-10-05T10:00&to=2026-10-08T10:00`), so links are readable and shareable.
 */
export type CarSearch = { pickup: number; return: number; from: string; to: string }

type RawParams = Record<string, string | string[] | undefined>

const LOCAL_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export function parseCarSearch(params: RawParams): CarSearch | null {
  const pickup = Number(first(params.pickup))
  const returnId = Number(first(params.return) ?? pickup)
  const from = first(params.from)
  const to = first(params.to)
  if (!Number.isInteger(pickup) || pickup <= 0 || !Number.isInteger(returnId) || returnId <= 0) return null
  if (!from || !to || !LOCAL_DATE_TIME.test(from) || !LOCAL_DATE_TIME.test(to) || to <= from) return null
  return { pickup, return: returnId, from, to }
}

export function carSearchQuery(search: CarSearch): string {
  return new URLSearchParams({ pickup: String(search.pickup), return: String(search.return), from: search.from, to: search.to }).toString()
}

/** Suggested dates for an empty search form: the first full day after the minimum notice, for three days. */
export function defaultSearchDates(now: Date, timeZone: string, minLeadTimeHours: number): { from: string; to: string } {
  const earliest = toDateTimeLocal(new Date(now.getTime() + minLeadTimeHours * 3_600_000), timeZone)
  const day = addDays(earliest.slice(0, 10), 1)
  return { from: `${day}T${DEFAULT_PICKUP_TIME}`, to: `${addDays(day, 3)}T${DEFAULT_PICKUP_TIME}` }
}

/** API query for a search; times are interpreted in the pick-up office's time zone. */
export function toRentalWindow(search: CarSearch, locations: LocationDto[]) {
  const timeZone = locations.find((location) => location.id === search.pickup)?.timeZone
  if (!timeZone) return null
  return {
    pickupLocationId: search.pickup,
    returnLocationId: search.return,
    pickupAt: fromDateTimeLocal(search.from, timeZone),
    returnAt: fromDateTimeLocal(search.to, timeZone),
  }
}
