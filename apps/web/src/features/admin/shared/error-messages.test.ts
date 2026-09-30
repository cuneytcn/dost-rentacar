import { describe, expect, it } from 'vitest'

import { localizeError } from './error-messages'

describe('localizeError', () => {
  it('translates known messages including variables', () => {
    expect(localizeError('Vehicle 07 ABC 401 is already assigned to reservation R9VDQA48 in this period', 'tr')).toBe(
      '07 ABC 401 plakalı araç bu tarihlerde R9VDQA48 rezervasyonuna atanmış.',
    )
    expect(localizeError('Return mileage must be at least 12000 km', 'tr')).toBe('İade kilometresi en az 12000 km olmalı.')
  })

  it('keeps English for English UI and unknown messages', () => {
    expect(localizeError('Return mileage must be at least 12000 km', 'en')).toBe('Return mileage must be at least 12000 km')
    expect(localizeError('Some new message', 'tr')).toBe('Some new message')
  })
})
