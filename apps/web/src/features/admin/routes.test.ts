import { describe, expect, it } from 'vitest'

import { toInternalAdminPath, toLocalizedAdminPath } from './routes'

describe('admin routes', () => {
  it('localizes and internalizes paths', () => {
    expect(toLocalizedAdminPath('/admin/reservations/new', 'tr')).toBe('/admin/rezervasyonlar/yeni')
    expect(toLocalizedAdminPath('/admin/vehicle-models/3', 'tr')).toBe('/admin/arac-modelleri/3')
    expect(toLocalizedAdminPath('/admin/rezervasyonlar/7', 'en')).toBe('/admin/reservations/7')
    expect(toLocalizedAdminPath('/admin/penalties/new?reservation=3&vehicle=8', 'tr')).toBe('/admin/cezalar/yeni?reservation=3&vehicle=8')
    expect(toInternalAdminPath('/admin/musteriler/1')).toBe('/admin/customers/1')
    expect(toInternalAdminPath('/admin')).toBe('/admin')
  })

  it('leaves non-panel and unknown paths alone', () => {
    expect(toInternalAdminPath('/api/v1/locations')).toBe('/api/v1/locations')
    expect(toLocalizedAdminPath('/administrator', 'tr')).toBe('/administrator')
    expect(toLocalizedAdminPath('/admin/unknown-thing', 'tr')).toBe('/admin/unknown-thing')
  })
})
