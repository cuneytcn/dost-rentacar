import type { CollectionAfterChangeHook } from 'payload'

import type { CorporateRequest, Reservation } from '@/payload-types'
import { QUEUE } from '@/jobs'

/**
 * Queues notification jobs. Passing `req` enqueues inside the same transaction, so a job
 * only exists if the change was committed. Admin-panel bookings (source phone/walk-in) don't
 * notify staff, only customers.
 */
export const queueReservationNotifications: CollectionAfterChangeHook<Reservation> = async ({
  doc,
  previousDoc,
  operation,
  req,
  context,
}) => {
  if (context.skipNotifications) return doc
  const queue = (audience: 'customer' | 'staff', event: 'created' | 'confirmed' | 'cancelled') =>
    req.payload.jobs.queue({
      task: 'sendReservationNotification',
      input: { reservationId: doc.id, audience, event },
      queue: QUEUE,
      req,
    })

  if (operation === 'create') {
    await queue('customer', doc.status === 'confirmed' ? 'confirmed' : 'created')
    if (doc.source === 'web' || doc.source === 'mobile') await queue('staff', 'created')
    return doc
  }
  if (doc.status !== previousDoc?.status && (doc.status === 'confirmed' || doc.status === 'cancelled')) {
    // Moving back from confirmed to pending and re-confirming re-sends; that's intended.
    await queue('customer', doc.status)
  }
  return doc
}

export const queueCorporateRequestNotification: CollectionAfterChangeHook<CorporateRequest> = async ({
  doc,
  operation,
  req,
}) => {
  if (operation === 'create') {
    await req.payload.jobs.queue({
      task: 'sendCorporateRequestNotification',
      input: { corporateRequestId: doc.id },
      queue: QUEUE,
      req,
    })
  }
  return doc
}
