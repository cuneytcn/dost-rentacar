import { describe, expect, it } from 'vitest'

import { countAvailableUnits, expandRange, peakConcurrency, rangesOverlap } from './availability'

const range = (start: string, end: string) => ({ start: new Date(start), end: new Date(end) })
const window = range('2026-06-10T10:00:00Z', '2026-06-15T10:00:00Z')

describe('rangesOverlap', () => {
  it('treats touching ranges as non-overlapping', () => {
    expect(rangesOverlap(range('2026-06-01T00:00:00Z', '2026-06-10T10:00:00Z'), window)).toBe(false)
    expect(rangesOverlap(range('2026-06-01T00:00:00Z', '2026-06-10T10:01:00Z'), window)).toBe(true)
  })
})

describe('expandRange', () => {
  it('adds the buffer on both sides', () => {
    const expanded = expandRange(window, 60)
    expect(expanded.start.toISOString()).toBe('2026-06-10T09:00:00.000Z')
    expect(expanded.end.toISOString()).toBe('2026-06-15T11:00:00.000Z')
  })
})

describe('peakConcurrency', () => {
  it('counts only simultaneous overlaps', () => {
    const ranges = [
      range('2026-06-10T10:00:00Z', '2026-06-12T10:00:00Z'),
      range('2026-06-12T10:00:00Z', '2026-06-14T10:00:00Z'),
      range('2026-06-11T10:00:00Z', '2026-06-13T10:00:00Z'),
      range('2026-07-01T00:00:00Z', '2026-07-02T00:00:00Z'),
    ]
    expect(peakConcurrency(ranges, window)).toBe(2)
  })
})

describe('countAvailableUnits', () => {
  it('subtracts blocked, busy and peak unassigned demand', () => {
    expect(
      countAvailableUnits({
        vehicleIds: [1, 2, 3, 4],
        blockedVehicleIds: [1],
        busyVehicleIds: [2, 1],
        unassignedReservations: [range('2026-06-11T00:00:00Z', '2026-06-12T00:00:00Z')],
        window,
      }),
    ).toBe(1)
  })

  it('never goes below zero', () => {
    expect(
      countAvailableUnits({
        vehicleIds: [1],
        blockedVehicleIds: [],
        busyVehicleIds: [],
        unassignedReservations: [window, window],
        window,
      }),
    ).toBe(0)
  })
})
