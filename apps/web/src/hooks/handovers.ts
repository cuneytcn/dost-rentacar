import { APIError, type CollectionAfterChangeHook, type CollectionBeforeChangeHook } from 'payload'

import { relationId } from '@/lib/relations'
import type { Handover } from '@/payload-types'

export const validateHandover: CollectionBeforeChangeHook<Handover> = async ({ data, originalDoc, operation, req }) => {
  if (operation === 'create' && req.user) data.performedBy = req.user.id

  const reservationId = relationId(data.reservation ?? originalDoc?.reservation)
  const type = data.type ?? originalDoc?.type
  if (!reservationId || !type) return data

  const reservation = await req.payload.findByID({ collection: 'reservations', id: reservationId, depth: 0, req })
  const existing = await req.payload.find({
    collection: 'handovers',
    where: { reservation: { equals: reservationId } },
    depth: 0,
    pagination: false,
    req,
  })
  const others = existing.docs.filter((handover) => handover.id !== originalDoc?.id)

  if (others.some((handover) => handover.type === type)) {
    throw new APIError(`A ${type} record already exists for this reservation`, 400, undefined, true)
  }
  if (type === 'pickup' && !reservation.vehicle) {
    throw new APIError('Assign a vehicle to the reservation before pickup', 400, undefined, true)
  }
  if (type === 'pickup' && operation === 'create' && reservation.status !== 'confirmed') {
    throw new APIError('Only confirmed reservations can be picked up', 400, undefined, true)
  }
  if (type === 'return') {
    const pickup = others.find((handover) => handover.type === 'pickup')
    if (!pickup) throw new APIError('Record the pickup before the return', 400, undefined, true)
    const mileage = data.mileageKm ?? originalDoc?.mileageKm ?? 0
    if (mileage < pickup.mileageKm) {
      throw new APIError(`Return mileage must be at least ${pickup.mileageKm} km`, 400, undefined, true)
    }
  }
  return data
}

/** Pickup starts the rental; return completes it and moves the car to the return location. */
export const applyHandoverEffects: CollectionAfterChangeHook<Handover> = async ({ doc, operation, req }) => {
  if (operation !== 'create') return doc
  const reservation = await req.payload.findByID({
    collection: 'reservations',
    id: relationId(doc.reservation)!,
    depth: 0,
    req,
  })
  const vehicleId = relationId(reservation.vehicle)
  if (!vehicleId) return doc

  if (doc.type === 'pickup') {
    if (reservation.status === 'confirmed') {
      await req.payload.update({ collection: 'reservations', id: reservation.id, data: { status: 'active' }, req })
    }
    await req.payload.update({ collection: 'vehicles', id: vehicleId, data: { mileageKm: doc.mileageKm }, req })
  } else {
    if (reservation.status === 'active') {
      await req.payload.update({ collection: 'reservations', id: reservation.id, data: { status: 'completed' }, req })
    }
    await req.payload.update({
      collection: 'vehicles',
      id: vehicleId,
      data: { mileageKm: doc.mileageKm, location: relationId(reservation.returnLocation)! },
      req,
    })
  }
  return doc
}
