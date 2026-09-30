import { describe, expect, it } from 'vitest'

import { fromDateTimeLocal, toDateTimeLocal } from './local-datetime'

describe('datetime-local helpers', () => {
  it('round-trips through the business time zone', () => {
    expect(toDateTimeLocal('2026-10-10T07:30:00.000Z')).toBe('2026-10-10T10:30')
    expect(fromDateTimeLocal('2026-10-10T10:30')).toBe('2026-10-10T07:30:00.000Z')
    expect(fromDateTimeLocal('2026-10-10T00:15')).toBe('2026-10-09T21:15:00.000Z')
  })
})
