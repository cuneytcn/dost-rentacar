import { describe, expect, it } from 'vitest'

import { isOpenAt, openTimes, snapToOpen, weekdayOf, type OpeningHours } from './opening-hours'

// Mon–Sat 08:00–20:00, Sunday closed.
const hours: OpeningHours = (['mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const).map((day) => ({ day, opensAt: '08:00', closesAt: '20:00' }))

describe('opening hours', () => {
  it('knows the weekday of a date and whether the office is open', () => {
    expect(weekdayOf('2026-10-04')).toBe('sun')
    expect(isOpenAt(hours, '2026-10-05', '08:00')).toBe(true)
    expect(isOpenAt(hours, '2026-10-05', '20:00')).toBe(true)
    expect(isOpenAt(hours, '2026-10-05', '20:30')).toBe(false)
    expect(isOpenAt(hours, '2026-10-04', '10:00')).toBe(false)
    expect(isOpenAt([], '2026-10-04', '03:00')).toBe(true)
  })

  it('lists open slots, not before the earliest bookable moment', () => {
    expect(openTimes(hours, '2026-10-05')).toHaveLength(25)
    expect(openTimes(hours, '2026-10-04')).toEqual([])
    expect(openTimes(hours, '2026-10-05', '2026-10-05T18:15')[0]).toBe('18:30')
  })

  it('snaps to the nearest bookable slot', () => {
    expect(snapToOpen('2026-10-05T10:00', hours)).toBe('2026-10-05T10:00')
    expect(snapToOpen('2026-10-05T22:00', hours)).toBe('2026-10-05T20:00')
    expect(snapToOpen('2026-10-04T10:00', hours)).toBe('2026-10-05T10:00')
    expect(snapToOpen('2026-10-05T09:00', hours, { earliest: '2026-10-05T19:40' })).toBe('2026-10-05T20:00')
    expect(snapToOpen('2026-10-05T09:00', hours, { earliest: '2026-10-05T20:10' })).toBe('2026-10-06T09:00')
    expect(snapToOpen('2026-10-05T10:00', [{ day: 'sun', opensAt: '09:00', closesAt: '17:00' }], { searchDays: 3 })).toBe(null)
  })
})
