import 'server-only'

import type { Where } from 'payload'

import { DEFAULT_TIME_ZONE, type ReservationStatus } from '@rent/shared'

import { getUserLocationIds, isAdminUser } from '@/access'
import { getPayloadClient } from '@/lib/payload'
import { populated, relationId } from '@/lib/relations'
import { isValidDate, windowRange } from '@/lib/time-grid'
import type { Customer, Location, VehicleModel } from '@/payload-types'
import { toLocalDate } from '@/services/pricing'

import type { SessionUser } from '../auth/session'

import { DAY_OPTIONS_CLIENT as DAY_OPTIONS } from './constants'
const VISIBLE_STATUSES: ReservationStatus[] = ['pending', 'confirmed', 'active', 'completed']

export type CalendarBooking = {
  id: number
  code: string
  status: ReservationStatus
  customerName: string
  vehicleModel: string
  pickupLocation: string
  pickupAt: string
  returnAt: string
}

export type CalendarBlock = { id: number; reason: string; startsAt: string; endsAt: string; notes: string | null }

export type CalendarRow = {
  id: number
  plate: string
  model: string
  status: string
  bookings: CalendarBooking[]
  blocks: CalendarBlock[]
}

export type CalendarData = {
  startDate: string
  days: number
  today: string
  timeZone: string
  windowStart: string
  windowEnd: string
  locationId: number | null
  locations: { id: number; name: string }[]
  rows: CalendarRow[]
  unassigned: CalendarBooking[]
}

export async function getCalendarData(
  user: SessionUser,
  params: { start?: string; days?: string; location?: string },
): Promise<CalendarData> {
  const payload = await getPayloadClient()
  const scoped = { overrideAccess: false, user } as const
  const timeZone = DEFAULT_TIME_ZONE
  const today = toLocalDate(new Date(), timeZone)
  const startDate = isValidDate(params.start) ? params.start : today
  const days = (DAY_OPTIONS as readonly number[]).includes(Number(params.days)) ? Number(params.days) : 14
  const allowed = isAdminUser(user) ? null : getUserLocationIds(user)
  const requested = Number(params.location) || null
  const locationId = requested && (!allowed || allowed.includes(requested)) ? requested : null
  const window = windowRange({ startDate, days, timeZone })

  const vehicleLocation: Where[] = locationId
    ? [{ location: { equals: locationId } }]
    : allowed
      ? [{ location: { in: allowed } }]
      : []
  const overlapping = (start: string, end: string): Where[] => [
    { [start]: { less_than: window.end.toISOString() } },
    { [end]: { greater_than: window.start.toISOString() } },
  ]

  const [locations, vehicles, reservations, blocks] = await Promise.all([
    payload.find({ collection: 'locations', where: allowed ? { id: { in: allowed } } : {}, sort: 'sortOrder', depth: 0, pagination: false, ...scoped }),
    payload.find({
      collection: 'vehicles',
      where: { and: [{ status: { not_equals: 'sold' } }, ...vehicleLocation] },
      sort: 'plate',
      depth: 1,
      pagination: false,
      ...scoped,
    }),
    payload.find({
      collection: 'reservations',
      where: { and: [{ status: { in: VISIBLE_STATUSES } }, ...overlapping('pickupAt', 'returnAt')] },
      sort: 'pickupAt',
      depth: 1,
      pagination: false,
      ...scoped,
    }),
    payload.find({ collection: 'vehicle-blocks', where: { and: overlapping('startsAt', 'endsAt') }, depth: 0, pagination: false, ...scoped }),
  ])

  const toBooking = (reservation: (typeof reservations.docs)[number]): CalendarBooking => ({
    id: reservation.id,
    code: reservation.code ?? '',
    status: reservation.status,
    customerName: populated<Customer>(reservation.customer)?.fullName ?? '',
    vehicleModel: populated<VehicleModel>(reservation.vehicleModel)?.name ?? '',
    pickupLocation: populated<Location>(reservation.pickupLocation)?.name ?? '',
    pickupAt: reservation.pickupAt,
    returnAt: reservation.returnAt,
  })

  return {
    startDate,
    days,
    today,
    timeZone,
    windowStart: window.start.toISOString(),
    windowEnd: window.end.toISOString(),
    locationId,
    locations: locations.docs.map((location) => ({ id: location.id, name: location.name })),
    rows: vehicles.docs.map((vehicle) => ({
      id: vehicle.id,
      plate: vehicle.plate,
      model: populated<VehicleModel>(vehicle.vehicleModel)?.name ?? '',
      status: vehicle.status,
      bookings: reservations.docs.filter((reservation) => relationId(reservation.vehicle) === vehicle.id).map(toBooking),
      blocks: blocks.docs
        .filter((block) => relationId(block.vehicle) === vehicle.id)
        .map((block) => ({ id: block.id, reason: block.reason, startsAt: block.startsAt, endsAt: block.endsAt, notes: block.notes ?? null })),
    })),
    unassigned: reservations.docs
      .filter(
        (reservation) =>
          !reservation.vehicle &&
          reservation.status !== 'completed' &&
          (!locationId || relationId(reservation.pickupLocation) === locationId),
      )
      .map(toBooking),
  }
}

