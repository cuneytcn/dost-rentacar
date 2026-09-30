import { isOpenAt, WEEKDAYS, type OpeningHours, type Weekday } from '@rent/shared'

import type { ReservationRules } from './settings'

/** Pure checks for customer-facing bookings. Staff bookings in the admin panel skip these. */

export type { OpeningHours }

export type RuleViolation =
  | { code: 'lead_time'; minHours: number }
  | { code: 'too_far_ahead'; maxDays: number }
  | { code: 'min_rental_days'; minDays: number }
  | { code: 'max_rental_days'; maxDays: number }
  | { code: 'location_closed'; field: 'pickupAt' | 'returnAt' }
  | { code: 'driver_age'; minAge: number }
  | { code: 'license_years'; minYears: number }

const HOUR_MS = 3_600_000

function localWeekdayAndTime(instant: Date, timeZone: string): { day: Weekday; time: string } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant)
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
  const day = get('weekday').toLowerCase().slice(0, 3) as Weekday
  if (!WEEKDAYS.includes(day)) throw new Error(`Unexpected weekday "${day}"`)
  return { day, time: `${get('hour')}:${get('minute')}` }
}

/** Empty opening hours mean the location is always open. Closing time is inclusive. */
export function isWithinOpeningHours(openingHours: OpeningHours, instant: Date, timeZone: string): boolean {
  const { day, time } = localWeekdayAndTime(instant, timeZone)
  return isOpenAt(openingHours, day, time)
}

export function checkRentalRules(input: {
  now: Date
  pickupAt: Date
  returnAt: Date
  rentalDays: number
  seasonalMinRentalDays: number | null
  rules: ReservationRules
  pickupLocation: { openingHours: OpeningHours; timeZone: string }
  returnLocation: { openingHours: OpeningHours; timeZone: string }
}): RuleViolation[] {
  const { now, pickupAt, returnAt, rentalDays, rules } = input
  const violations: RuleViolation[] = []

  if (pickupAt.getTime() - now.getTime() < rules.minLeadTimeHours * HOUR_MS) {
    violations.push({ code: 'lead_time', minHours: rules.minLeadTimeHours })
  }
  if (pickupAt.getTime() - now.getTime() > rules.maxAdvanceDays * 24 * HOUR_MS) {
    violations.push({ code: 'too_far_ahead', maxDays: rules.maxAdvanceDays })
  }
  const minDays = Math.max(rules.minRentalDays, input.seasonalMinRentalDays ?? 0)
  if (rentalDays < minDays) violations.push({ code: 'min_rental_days', minDays })
  if (rentalDays > rules.maxRentalDays) violations.push({ code: 'max_rental_days', maxDays: rules.maxRentalDays })

  if (!isWithinOpeningHours(input.pickupLocation.openingHours, pickupAt, input.pickupLocation.timeZone)) {
    violations.push({ code: 'location_closed', field: 'pickupAt' })
  }
  if (!isWithinOpeningHours(input.returnLocation.openingHours, returnAt, input.returnLocation.timeZone)) {
    violations.push({ code: 'location_closed', field: 'returnAt' })
  }
  return violations
}

/** Full years between two YYYY-MM-DD dates. */
export function fullYearsBetween(from: string, to: string): number {
  const [fromYear, fromMonth, fromDay] = from.split('-').map(Number) as [number, number, number]
  const [toYear, toMonth, toDay] = to.split('-').map(Number) as [number, number, number]
  const beforeAnniversary = toMonth < fromMonth || (toMonth === fromMonth && toDay < fromDay)
  return toYear - fromYear - (beforeAnniversary ? 1 : 0)
}

export function checkDriverEligibility(input: {
  pickupDate: string
  birthDate: string
  licenseIssuedAt?: string | null
  minDriverAge: number
  minLicenseYears: number
}): RuleViolation[] {
  const violations: RuleViolation[] = []
  if (fullYearsBetween(input.birthDate, input.pickupDate) < input.minDriverAge) {
    violations.push({ code: 'driver_age', minAge: input.minDriverAge })
  }
  if (input.licenseIssuedAt && fullYearsBetween(input.licenseIssuedAt, input.pickupDate) < input.minLicenseYears) {
    violations.push({ code: 'license_years', minYears: input.minLicenseYears })
  }
  return violations
}
