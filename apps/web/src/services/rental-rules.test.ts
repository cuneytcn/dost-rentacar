import { describe, expect, it } from 'vitest'

import { checkDriverEligibility, checkRentalRules, fullYearsBetween, isWithinOpeningHours, type OpeningHours } from './rental-rules'
import type { ReservationRules } from './settings'

const TZ = 'Europe/Istanbul'
const weekdays: OpeningHours = (['mon', 'tue', 'wed', 'thu', 'fri'] as const).map((day) => ({
  day,
  opensAt: '08:00',
  closesAt: '20:00',
}))

const rules: ReservationRules = {
  minLeadTimeHours: 2,
  minRentalDays: 1,
  maxRentalDays: 30,
  maxAdvanceDays: 365,
  graceMinutes: 60,
  bufferMinutes: 60,
  selfCancelCutoffHours: 24,
}

describe('isWithinOpeningHours', () => {
  it('uses local time of the location', () => {
    // 2026-06-10 is a Wednesday. 05:30Z = 08:30 in Istanbul.
    expect(isWithinOpeningHours(weekdays, new Date('2026-06-10T05:30:00Z'), TZ)).toBe(true)
    expect(isWithinOpeningHours(weekdays, new Date('2026-06-10T04:30:00Z'), TZ)).toBe(false)
  })

  it('treats missing days as closed and empty hours as always open', () => {
    expect(isWithinOpeningHours(weekdays, new Date('2026-06-13T10:00:00Z'), TZ)).toBe(false) // Saturday
    expect(isWithinOpeningHours([], new Date('2026-06-13T02:00:00Z'), TZ)).toBe(true)
  })
})

describe('checkRentalRules', () => {
  const location = { openingHours: [] as OpeningHours, timeZone: TZ }
  const base = {
    now: new Date('2026-06-01T10:00:00Z'),
    pickupAt: new Date('2026-06-10T10:00:00Z'),
    returnAt: new Date('2026-06-12T10:00:00Z'),
    rentalDays: 2,
    seasonalMinRentalDays: null,
    rules,
    pickupLocation: location,
    returnLocation: location,
  }

  it('passes a valid booking', () => {
    expect(checkRentalRules(base)).toEqual([])
  })

  it('reports lead time, seasonal minimum and closed locations', () => {
    const violations = checkRentalRules({
      ...base,
      now: new Date('2026-06-10T09:00:00Z'),
      seasonalMinRentalDays: 3,
      pickupLocation: { openingHours: weekdays, timeZone: TZ },
      pickupAt: new Date('2026-06-13T09:30:00Z'),
    })
    expect(violations.map((violation) => violation.code).sort()).toEqual(['location_closed', 'min_rental_days'])
  })

  it('reports max rental length and too-early pickup', () => {
    const violations = checkRentalRules({ ...base, now: new Date('2026-06-10T09:00:00Z'), rentalDays: 31 })
    expect(violations).toContainEqual({ code: 'lead_time', minHours: 2 })
    expect(violations).toContainEqual({ code: 'max_rental_days', maxDays: 30 })
  })
})

describe('fullYearsBetween', () => {
  it('counts completed years only', () => {
    expect(fullYearsBetween('2000-06-10', '2026-06-09')).toBe(25)
    expect(fullYearsBetween('2000-06-10', '2026-06-10')).toBe(26)
  })
})

describe('checkDriverEligibility', () => {
  it('checks age and license years at pickup date', () => {
    expect(
      checkDriverEligibility({ pickupDate: '2026-06-10', birthDate: '2005-06-11', licenseIssuedAt: '2025-01-01', minDriverAge: 21, minLicenseYears: 2 }),
    ).toEqual([
      { code: 'driver_age', minAge: 21 },
      { code: 'license_years', minYears: 2 },
    ])
    expect(checkDriverEligibility({ pickupDate: '2026-06-10', birthDate: '1990-01-01', minDriverAge: 21, minLicenseYears: 2 })).toEqual([])
  })
})
