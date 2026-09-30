import { describe, expect, it } from 'vitest'

import { sitePath, switchLocalePath, toInternalSitePath } from './routes'

describe('site routes', () => {
  it('maps public URLs to route folders; Turkish has no prefix', () => {
    expect(toInternalSitePath('/')).toBe('/tr')
    expect(toInternalSitePath('/araclar/fiat-egea')).toBe('/tr/cars/fiat-egea')
    expect(toInternalSitePath('/tr/araclar')).toBe('/tr/cars')
    expect(toInternalSitePath('/en/my-booking')).toBe('/en/reservation')
    expect(toInternalSitePath('/de/kontakt')).toBe('/de/contact')
    expect(toInternalSitePath('/hakkimizda')).toBe('/tr/hakkimizda')
    expect(toInternalSitePath('/en')).toBe('/en')
  })

  it('builds public URLs', () => {
    expect(sitePath('tr')).toBe('/')
    expect(sitePath('tr', '/cars?pickup=1')).toBe('/araclar?pickup=1')
    expect(sitePath('ru', '/cars/fiat-egea')).toBe('/ru/avtomobili/fiat-egea')
    expect(sitePath('en', '/reservation')).toBe('/en/my-booking')
    expect(sitePath('en')).toBe('/en')
  })

  it('switches the language of the current page', () => {
    expect(switchLocalePath('/araclar?from=2026-10-05', 'de')).toBe('/de/fahrzeuge?from=2026-10-05')
    expect(switchLocalePath('/en/cars/fiat-egea', 'tr')).toBe('/araclar/fiat-egea')
    expect(switchLocalePath('/en', 'tr')).toBe('/')
  })
})
