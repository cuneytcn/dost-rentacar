import { describe, expect, it } from 'vitest'

import { describeReservation, summarizePayment } from './status'

const now = new Date('2026-10-05T12:00:00Z')
const base = { hasVehicle: false, pickupAt: '2026-10-06T07:00:00Z', returnAt: '2026-10-09T07:00:00Z', createdAt: '2026-10-05T09:00:00Z' }

describe('describeReservation', () => {
  it('tells what the desk has to do next', () => {
    expect(describeReservation({ ...base, status: 'pending' }, now)).toMatchObject({ state: 'awaiting_confirmation', moment: { kind: 'requested' } })
    expect(describeReservation({ ...base, status: 'confirmed' }, now)).toMatchObject({ state: 'needs_vehicle', tone: 'warning', urgent: false })
    expect(describeReservation({ ...base, status: 'confirmed', hasVehicle: true }, now)).toMatchObject({ state: 'awaiting_pickup', moment: { kind: 'pickup', overdue: false } })
    expect(describeReservation({ ...base, status: 'active', hasVehicle: true }, now)).toMatchObject({ state: 'with_customer', moment: { kind: 'return', overdue: false } })
    expect(describeReservation({ ...base, status: 'completed' }, now)).toMatchObject({ state: 'returned' })
    expect(describeReservation({ ...base, status: 'no_show' }, now)).toMatchObject({ state: 'no_show', moment: null })
  })

  it('flags late pickups and overdue returns', () => {
    const late = { ...base, pickupAt: '2026-10-05T08:00:00Z', returnAt: '2026-10-05T10:00:00Z' }
    expect(describeReservation({ ...late, status: 'confirmed', hasVehicle: true }, now)).toMatchObject({ urgent: true, moment: { overdue: true } })
    expect(describeReservation({ ...late, status: 'active', hasVehicle: true }, now)).toMatchObject({ urgent: true, moment: { kind: 'return', overdue: true } })
  })
})

describe('summarizePayment', () => {
  it('speaks in amounts', () => {
    expect(summarizePayment({ total: 22000, paidTotal: 5000, paymentStatus: 'partial', status: 'confirmed' })).toEqual({ kind: 'due', amount: 17000 })
    expect(summarizePayment({ total: 22000, paidTotal: 22000, paymentStatus: 'paid', status: 'active' })).toEqual({ kind: 'paid' })
    expect(summarizePayment({ total: 22000, paidTotal: 0, paymentStatus: 'unpaid', status: 'cancelled' })).toEqual({ kind: 'none' })
    expect(summarizePayment({ total: 22000, paidTotal: 0, paymentStatus: 'refunded', status: 'cancelled' })).toEqual({ kind: 'refunded' })
  })
})
