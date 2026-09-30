import 'server-only'

import type { Where } from 'payload'

import { DEFAULT_TIME_ZONE } from '@rent/shared'

import { addDays, localMidnight } from '@/lib/time-grid'
import { getPayloadClient } from '@/lib/payload'
import { populated } from '@/lib/relations'
import type { Customer, Location, Reservation, Vehicle, VehicleModel } from '@/payload-types'
import { toLocalDate } from '@/services/pricing'
import { findExpiringDocuments, type ExpiringDocument } from '@/services/vehicle-documents'

import type { SessionUser } from '../auth/session'

export const EXPIRY_WINDOW_DAYS = 30

export type DashboardReservation = {
  id: number
  code: string
  status: Reservation['status']
  customerName: string
  customerPhone: string
  vehicleModel: string
  plate: string | null
  pickupAt: string
  returnAt: string
  pickupLocation: string
  returnLocation: string
  total: number
  currency: string
}

export type DashboardData = {
  counts: { pending: number; unassigned: number; pickupsToday: number; returnsToday: number; activeRentals: number; newCorporate: number }
  pickupsToday: DashboardReservation[]
  returnsToday: DashboardReservation[]
  pending: DashboardReservation[]
  expiringDocuments: ExpiringDocument[]
}

function toRow(reservation: Reservation): DashboardReservation {
  const customer = populated<Customer>(reservation.customer)
  const model = populated<VehicleModel>(reservation.vehicleModel)
  const vehicle = populated<Vehicle>(reservation.vehicle)
  return {
    id: reservation.id,
    code: reservation.code ?? '',
    status: reservation.status,
    customerName: customer?.fullName ?? '',
    customerPhone: customer?.phone ?? '',
    vehicleModel: model?.name ?? '',
    plate: vehicle?.plate ?? null,
    pickupAt: reservation.pickupAt,
    returnAt: reservation.returnAt,
    pickupLocation: populated<Location>(reservation.pickupLocation)?.name ?? '',
    returnLocation: populated<Location>(reservation.returnLocation)?.name ?? '',
    total: reservation.pricing?.total ?? 0,
    currency: reservation.pricing?.currency ?? 'TRY',
  }
}

export async function getDashboardData(user: SessionUser): Promise<DashboardData> {
  const payload = await getPayloadClient()
  const scoped = { overrideAccess: false, user } as const
  const today = toLocalDate(new Date(), DEFAULT_TIME_ZONE)
  const dayStart = localMidnight(today, DEFAULT_TIME_ZONE).toISOString()
  const dayEnd = localMidnight(addDays(today, 1), DEFAULT_TIME_ZONE).toISOString()

  const where: Record<'pending' | 'unassigned' | 'pickupsToday' | 'returnsToday' | 'active', Where> = {
    pending: { status: { equals: 'pending' } },
    unassigned: { and: [{ status: { equals: 'confirmed' } }, { vehicle: { exists: false } }] },
    pickupsToday: {
      and: [{ status: { in: ['confirmed', 'active'] } }, { pickupAt: { greater_than_equal: dayStart } }, { pickupAt: { less_than: dayEnd } }],
    },
    returnsToday: {
      and: [{ status: { in: ['active', 'completed'] } }, { returnAt: { greater_than_equal: dayStart } }, { returnAt: { less_than: dayEnd } }],
    },
    active: { status: { equals: 'active' } },
  }

  const list = (filter: Where, sort: string, limit = 50) =>
    payload.find({ collection: 'reservations', where: filter, sort, depth: 1, limit, ...scoped })

  const [pending, unassigned, pickups, returns, active, corporate, vehicles] = await Promise.all([
    list(where.pending, 'pickupAt', 6),
    payload.count({ collection: 'reservations', where: where.unassigned, ...scoped }),
    list(where.pickupsToday, 'pickupAt'),
    list(where.returnsToday, 'returnAt'),
    payload.count({ collection: 'reservations', where: where.active, ...scoped }),
    payload.count({ collection: 'corporate-requests', where: { status: { equals: 'new' } }, ...scoped }),
    payload.find({
      collection: 'vehicles',
      where: { status: { not_equals: 'sold' } },
      select: { plate: true, status: true, insuranceExpiresAt: true, cascoExpiresAt: true, inspectionExpiresAt: true },
      depth: 0,
      pagination: false,
      ...scoped,
    }),
  ])

  return {
    counts: {
      pending: pending.totalDocs,
      unassigned: unassigned.totalDocs,
      pickupsToday: pickups.totalDocs,
      returnsToday: returns.totalDocs,
      activeRentals: active.totalDocs,
      newCorporate: corporate.totalDocs,
    },
    pickupsToday: pickups.docs.map(toRow),
    returnsToday: returns.docs.map(toRow),
    pending: pending.docs.map(toRow),
    expiringDocuments: findExpiringDocuments(vehicles.docs, today, EXPIRY_WINDOW_DAYS),
  }
}
