import type { ReservationStatus } from '@rent/shared'

/**
 * What a reservation means for the desk right now: the next step and the moment that matters.
 * Pure, so the list, dashboard and detail page describe reservations the same way.
 */

export type DeskState = 'awaiting_confirmation' | 'needs_vehicle' | 'awaiting_pickup' | 'with_customer' | 'returned' | 'cancelled' | 'no_show'

export type DeskMoment =
  | { kind: 'requested'; at: string }
  | { kind: 'pickup'; at: string; overdue: boolean }
  | { kind: 'return'; at: string; overdue: boolean }
  | { kind: 'returned'; at: string }
  | null

export type DeskTone = 'warning' | 'info' | 'success' | 'neutral' | 'danger'

export type DeskStatus = { state: DeskState; moment: DeskMoment; tone: DeskTone; urgent: boolean }

export function describeReservation(
  reservation: { status: ReservationStatus; hasVehicle: boolean; pickupAt: string; returnAt: string; createdAt: string },
  now: Date,
): DeskStatus {
  const pickupOverdue = new Date(reservation.pickupAt).getTime() < now.getTime()
  const returnOverdue = new Date(reservation.returnAt).getTime() < now.getTime()
  switch (reservation.status) {
    case 'pending':
      return { state: 'awaiting_confirmation', moment: { kind: 'requested', at: reservation.createdAt }, tone: 'warning', urgent: pickupOverdue }
    case 'confirmed':
      return {
        state: reservation.hasVehicle ? 'awaiting_pickup' : 'needs_vehicle',
        moment: { kind: 'pickup', at: reservation.pickupAt, overdue: pickupOverdue },
        tone: reservation.hasVehicle ? 'info' : 'warning',
        urgent: pickupOverdue,
      }
    case 'active':
      return { state: 'with_customer', moment: { kind: 'return', at: reservation.returnAt, overdue: returnOverdue }, tone: 'success', urgent: returnOverdue }
    case 'completed':
      return { state: 'returned', moment: { kind: 'returned', at: reservation.returnAt }, tone: 'neutral', urgent: false }
    case 'cancelled':
      return { state: 'cancelled', moment: null, tone: 'danger', urgent: false }
    case 'no_show':
      return { state: 'no_show', moment: null, tone: 'danger', urgent: false }
  }
}

export type PaymentSummary = { kind: 'paid' } | { kind: 'due'; amount: number } | { kind: 'refunded' } | { kind: 'none' }

/** Money language instead of status words: what is still owed. */
export function summarizePayment(input: { total: number; paidTotal: number; paymentStatus: string; status: ReservationStatus }): PaymentSummary {
  if (input.paymentStatus === 'refunded') return { kind: 'refunded' }
  if (input.status === 'cancelled' || input.status === 'no_show') return input.paidTotal > 0 ? { kind: 'due', amount: 0 } : { kind: 'none' }
  const due = Math.max(0, input.total - input.paidTotal)
  return due === 0 ? { kind: 'paid' } : { kind: 'due', amount: due }
}
