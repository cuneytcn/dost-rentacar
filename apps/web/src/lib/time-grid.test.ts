import { describe, expect, it } from 'vitest'

import { addDays, barPosition, isValidDate, localMidnight, windowRange } from './time-grid'

describe('localMidnight', () => {
  it('returns the UTC instant of local midnight', () => {
    expect(localMidnight('2026-10-10', 'Europe/Istanbul').toISOString()).toBe('2026-10-09T21:00:00.000Z')
    expect(localMidnight('2026-07-01', 'Europe/Berlin').toISOString()).toBe('2026-06-30T22:00:00.000Z')
    expect(localMidnight('2026-12-01', 'Europe/Berlin').toISOString()).toBe('2026-11-30T23:00:00.000Z')
  })
})

describe('addDays / isValidDate', () => {
  it('works across month ends', () => {
    expect(addDays('2026-10-30', 3)).toBe('2026-11-02')
    expect(isValidDate('2026-10-30')).toBe(true)
    expect(isValidDate('2026-13-45')).toBe(false)
    expect(isValidDate(undefined)).toBe(false)
  })
})

describe('barPosition', () => {
  const window = windowRange({ startDate: '2026-10-10', days: 10, timeZone: 'Europe/Istanbul' })

  it('positions a range fully inside the window', () => {
    const position = barPosition(new Date('2026-10-11T09:00:00+03:00'), new Date('2026-10-13T09:00:00+03:00'), window)
    expect(position?.leftPercent).toBeCloseTo(13.75)
    expect(position?.widthPercent).toBeCloseTo(20)
    expect(position).toMatchObject({ startsBefore: false, endsAfter: false })
  })

  it('clips ranges crossing the edges and drops ranges outside', () => {
    const position = barPosition(new Date('2026-10-05T00:00:00+03:00'), new Date('2026-10-25T00:00:00+03:00'), window)
    expect(position).toEqual({ leftPercent: 0, widthPercent: 100, startsBefore: true, endsAfter: true })
    expect(barPosition(new Date('2026-10-01T00:00:00+03:00'), new Date('2026-10-10T00:00:00+03:00'), window)).toBeNull()
  })
})
