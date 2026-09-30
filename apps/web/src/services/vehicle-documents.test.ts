import { describe, expect, it } from 'vitest'

import { documentsDueForReminder, findExpiringDocuments, type ExpiringDocument } from './vehicle-documents'

describe('findExpiringDocuments', () => {
  it('returns expired and soon-expiring documents, soonest first, ignoring sold cars', () => {
    const result = findExpiringDocuments(
      [
        { id: 1, plate: '07 A 1', status: 'active', inspectionExpiresAt: '2026-10-15T00:00:00.000Z', insuranceExpiresAt: '2027-05-01T00:00:00.000Z' },
        { id: 2, plate: '07 A 2', status: 'maintenance', cascoExpiresAt: '2026-09-20T00:00:00.000Z' },
        { id: 3, plate: '07 A 3', status: 'sold', inspectionExpiresAt: '2026-09-01T00:00:00.000Z' },
        { id: 4, plate: '07 A 4', status: 'active', insuranceExpiresAt: null },
      ],
      '2026-09-30',
      30,
    )
    expect(result).toEqual([
      { vehicleId: 2, plate: '07 A 2', document: 'cascoExpiresAt', expiresOn: '2026-09-20', daysLeft: -10 },
      { vehicleId: 1, plate: '07 A 1', document: 'inspectionExpiresAt', expiresOn: '2026-10-15', daysLeft: 15 },
    ])
  })

  it('includes the boundary day', () => {
    expect(findExpiringDocuments([{ id: 1, plate: 'X', status: 'active', cascoExpiresAt: '2026-10-30' }], '2026-09-30', 30)).toHaveLength(1)
    expect(findExpiringDocuments([{ id: 1, plate: 'X', status: 'active', cascoExpiresAt: '2026-10-31' }], '2026-09-30', 30)).toHaveLength(0)
  })
})

describe('documentsDueForReminder', () => {
  it('keeps milestone days and expired documents only', () => {
    const item = (daysLeft: number): ExpiringDocument => ({ vehicleId: daysLeft, plate: 'X', document: 'cascoExpiresAt', expiresOn: '2026-10-01', daysLeft })
    expect(documentsDueForReminder([30, 29, 14, 8, 7, 2, 1, 0, -1, -40].map(item)).map((entry) => entry.daysLeft)).toEqual([30, 14, 7, 1, 0, -1, -40])
  })
})
