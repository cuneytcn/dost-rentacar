import type { Payload, PayloadRequest, Where } from 'payload'

import { CAPACITY_HOLDING_STATUSES } from '@rent/shared'

import { relationId } from '@/lib/relations'

import { countAvailableUnits, expandRange, type TimeRange } from './availability'
import { ServiceError } from './errors'

type Ctx = { req?: Partial<PayloadRequest> }

const overlapping = (startField: string, endField: string, window: TimeRange): Where[] => [
  { [startField]: { less_than: window.end.toISOString() } },
  { [endField]: { greater_than: window.start.toISOString() } },
]

/** Free units per vehicle model at a pickup location for the window. */
export async function getAvailableUnitsByModel(
  payload: Payload,
  params: {
    locationId: number
    window: TimeRange
    bufferMinutes: number
    vehicleModelIds?: number[]
    excludeReservationId?: number
  },
  ctx: Ctx = {},
): Promise<Map<number, number>> {
  const window = expandRange(params.window, params.bufferMinutes)
  const modelFilter: Where[] = params.vehicleModelIds ? [{ vehicleModel: { in: params.vehicleModelIds } }] : []

  const { docs: vehicles } = await payload.find({
    collection: 'vehicles',
    where: { and: [{ status: { equals: 'active' } }, { location: { equals: params.locationId } }, ...modelFilter] },
    select: { vehicleModel: true },
    depth: 0,
    pagination: false,
    overrideAccess: true,
    req: ctx.req,
  })
  const vehicleIds = vehicles.map((vehicle) => vehicle.id)

  const [blocks, reservations] = await Promise.all([
    vehicleIds.length
      ? payload.find({
          collection: 'vehicle-blocks',
          where: { and: [{ vehicle: { in: vehicleIds } }, ...overlapping('startsAt', 'endsAt', window)] },
          select: { vehicle: true },
          depth: 0,
          pagination: false,
          overrideAccess: true,
          req: ctx.req,
        })
      : { docs: [] },
    payload.find({
      collection: 'reservations',
      where: {
        and: [
          { status: { in: [...CAPACITY_HOLDING_STATUSES] } },
          ...overlapping('pickupAt', 'returnAt', window),
          ...(params.excludeReservationId ? [{ id: { not_equals: params.excludeReservationId } }] : []),
          {
            or: [
              ...(vehicleIds.length ? [{ vehicle: { in: vehicleIds } }] : []),
              {
                and: [{ vehicle: { exists: false } }, { pickupLocation: { equals: params.locationId } }, ...modelFilter],
              },
            ],
          },
        ],
      },
      select: { vehicle: true, vehicleModel: true, pickupAt: true, returnAt: true },
      depth: 0,
      pagination: false,
      overrideAccess: true,
      req: ctx.req,
    }),
  ])

  const blockedVehicleIds = blocks.docs.map((block) => relationId(block.vehicle)).filter(isNumber)
  const busyVehicleIds = reservations.docs.map((reservation) => relationId(reservation.vehicle)).filter(isNumber)

  const modelIds = params.vehicleModelIds ?? [...new Set(vehicles.map((vehicle) => relationId(vehicle.vehicleModel)).filter(isNumber))]
  const result = new Map<number, number>()
  for (const modelId of modelIds) {
    result.set(
      modelId,
      countAvailableUnits({
        vehicleIds: vehicles.filter((vehicle) => relationId(vehicle.vehicleModel) === modelId).map((vehicle) => vehicle.id),
        blockedVehicleIds,
        busyVehicleIds,
        unassignedReservations: reservations.docs
          .filter((reservation) => !reservation.vehicle && relationId(reservation.vehicleModel) === modelId)
          .map((reservation) => ({ start: new Date(reservation.pickupAt), end: new Date(reservation.returnAt) })),
        window,
      }),
    )
  }
  return result
}

/** Throws when the vehicle cannot take this rental (inactive, blocked or already booked incl. buffer). */
export async function assertVehicleAssignable(
  payload: Payload,
  params: { vehicleId: number; window: TimeRange; bufferMinutes: number; excludeReservationId?: number },
  ctx: Ctx = {},
): Promise<void> {
  const window = expandRange(params.window, params.bufferMinutes)
  const vehicle = await payload.findByID({
    collection: 'vehicles',
    id: params.vehicleId,
    depth: 0,
    overrideAccess: true,
    req: ctx.req,
  })
  if (vehicle.status !== 'active') {
    throw new ServiceError('conflict', `Vehicle ${vehicle.plate} is not active (status: ${vehicle.status})`)
  }

  const [blocks, reservations] = await Promise.all([
    payload.count({
      collection: 'vehicle-blocks',
      where: { and: [{ vehicle: { equals: params.vehicleId } }, ...overlapping('startsAt', 'endsAt', window)] },
      overrideAccess: true,
      req: ctx.req,
    }),
    payload.find({
      collection: 'reservations',
      where: {
        and: [
          { vehicle: { equals: params.vehicleId } },
          { status: { in: [...CAPACITY_HOLDING_STATUSES] } },
          ...overlapping('pickupAt', 'returnAt', window),
          ...(params.excludeReservationId ? [{ id: { not_equals: params.excludeReservationId } }] : []),
        ],
      },
      select: { code: true },
      depth: 0,
      limit: 1,
      overrideAccess: true,
      req: ctx.req,
    }),
  ])

  if (blocks.totalDocs > 0) {
    throw new ServiceError('conflict', `Vehicle ${vehicle.plate} is blocked (maintenance/repair) during this period`)
  }
  const clash = reservations.docs[0]
  if (clash) {
    throw new ServiceError('conflict', `Vehicle ${vehicle.plate} is already assigned to reservation ${clash.code} in this period`)
  }
}

function isNumber(value: number | null): value is number {
  return value !== null
}

export type VehicleAvailability = { status: 'free' } | { status: 'busy'; reservationCode: string } | { status: 'blocked' }

/** Availability of many vehicles for one window (incl. buffer), in two queries. */
export async function getVehicleAvailability(
  payload: Payload,
  params: { vehicleIds: number[]; window: TimeRange; bufferMinutes: number; excludeReservationId?: number },
  ctx: Ctx = {},
): Promise<Map<number, VehicleAvailability>> {
  const window = expandRange(params.window, params.bufferMinutes)
  const result = new Map<number, VehicleAvailability>(params.vehicleIds.map((id) => [id, { status: 'free' }]))
  if (params.vehicleIds.length === 0) return result

  const [blocks, reservations] = await Promise.all([
    payload.find({
      collection: 'vehicle-blocks',
      where: { and: [{ vehicle: { in: params.vehicleIds } }, ...overlapping('startsAt', 'endsAt', window)] },
      select: { vehicle: true },
      depth: 0,
      pagination: false,
      overrideAccess: true,
      req: ctx.req,
    }),
    payload.find({
      collection: 'reservations',
      where: {
        and: [
          { vehicle: { in: params.vehicleIds } },
          { status: { in: [...CAPACITY_HOLDING_STATUSES] } },
          ...overlapping('pickupAt', 'returnAt', window),
          ...(params.excludeReservationId ? [{ id: { not_equals: params.excludeReservationId } }] : []),
        ],
      },
      select: { vehicle: true, code: true },
      depth: 0,
      pagination: false,
      overrideAccess: true,
      req: ctx.req,
    }),
  ])

  for (const reservation of reservations.docs) {
    const id = relationId(reservation.vehicle)
    if (id) result.set(id, { status: 'busy', reservationCode: reservation.code ?? '' })
  }
  for (const block of blocks.docs) {
    const id = relationId(block.vehicle)
    if (id) result.set(id, { status: 'blocked' })
  }
  return result
}
