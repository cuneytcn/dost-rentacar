import 'server-only'

import type { Where } from 'payload'

import { DEFAULT_TIME_ZONE, type ReservationStatus } from '@rent/shared'

import { getPayloadClient } from '@/lib/payload'
import { populated } from '@/lib/relations'
import { addDays, isValidDate, localMidnight } from '@/lib/time-grid'
import type { Customer, Location, Reservation, Vehicle, VehicleModel } from '@/payload-types'

import type { SessionUser } from '../auth/session'

import { RESERVATION_TABS, type ReservationTab } from './constants'
import { describeReservation, summarizePayment, type DeskStatus, type PaymentSummary } from './status'

const TAB_STATUSES: Record<ReservationTab, ReservationStatus[] | null> = {
  all: null,
  pending: ['pending'],
  confirmed: ['confirmed'],
  active: ['active'],
  completed: ['completed'],
  cancelled: ['cancelled', 'no_show'],
}

// Upcoming work first for open tabs, most recent first for history.
const DEFAULT_SORT: Record<ReservationTab, string> = {
  all: '-createdAt',
  pending: 'pickupAt',
  confirmed: 'pickupAt',
  active: 'returnAt',
  completed: '-returnAt',
  cancelled: '-updatedAt',
}

export const SORTABLE_FIELDS = ['pickupAt', 'returnAt', 'createdAt', 'pricing.total', 'code'] as const
const PAGE_SIZE = 20

export type ReservationListRow = {
  id: number
  code: string
  status: Reservation['status']
  paymentStatus: Reservation['paymentStatus']
  source: Reservation['source']
  customerName: string
  customerPhone: string
  vehicleModel: string
  plate: string | null
  pickupAt: string
  returnAt: string
  pickupLocation: string
  returnLocation: string
  rentalDays: number
  total: number
  paidTotal: number
  currency: string
  createdAt: string
  desk: DeskStatus
  payment: PaymentSummary
}

export type ReservationListParams = {
  tab?: string
  q?: string
  location?: string
  payment?: string
  from?: string
  to?: string
  page?: string
  sort?: string
}

export type ReservationListData = {
  tab: ReservationTab
  sort: string
  rows: ReservationListRow[]
  page: number
  totalPages: number
  totalDocs: number
  tabCounts: Record<ReservationTab, number>
  locations: { id: number; name: string }[]
  /** Server time used for "due tomorrow" / "2 hours late" so server and browser render the same text. */
  now: string
}

export async function getReservationList(user: SessionUser, params: ReservationListParams): Promise<ReservationListData> {
  const payload = await getPayloadClient()
  const scoped = { overrideAccess: false, user } as const
  const tab = (RESERVATION_TABS as readonly string[]).includes(params.tab ?? '') ? (params.tab as ReservationTab) : 'all'
  const sortField = params.sort?.replace(/^-/, '')
  const sort = sortField && (SORTABLE_FIELDS as readonly string[]).includes(sortField) ? params.sort! : DEFAULT_SORT[tab]
  const page = Math.max(1, Number(params.page) || 1)

  // Filters shared by the list and the tab counts (everything except the status tab).
  const filters: Where[] = []
  const q = params.q?.trim()
  if (q) {
    filters.push({
      or: [
        { code: { like: q.toUpperCase() } },
        { 'customer.fullName': { like: q } },
        { 'customer.phone': { like: q } },
        { 'customer.email': { like: q.toLowerCase() } },
        { 'vehicle.plate': { like: q.toUpperCase() } },
      ],
    })
  }
  const locationId = Number(params.location) || null
  if (locationId) filters.push({ or: [{ pickupLocation: { equals: locationId } }, { returnLocation: { equals: locationId } }] })
  if (params.payment && ['unpaid', 'partial', 'paid', 'refunded'].includes(params.payment)) {
    filters.push({ paymentStatus: { equals: params.payment } })
  }
  if (isValidDate(params.from)) filters.push({ pickupAt: { greater_than_equal: localMidnight(params.from, DEFAULT_TIME_ZONE).toISOString() } })
  if (isValidDate(params.to)) filters.push({ pickupAt: { less_than: localMidnight(addDays(params.to, 1), DEFAULT_TIME_ZONE).toISOString() } })

  const whereFor = (target: ReservationTab): Where => {
    const statuses = TAB_STATUSES[target]
    return { and: [...filters, ...(statuses ? [{ status: { in: statuses } }] : [])] }
  }

  const [result, locations, ...counts] = await Promise.all([
    payload.find({ collection: 'reservations', where: whereFor(tab), sort, page, limit: PAGE_SIZE, depth: 1, ...scoped }),
    payload.find({ collection: 'locations', sort: 'sortOrder', depth: 0, pagination: false, ...scoped }),
    ...RESERVATION_TABS.map((target) => payload.count({ collection: 'reservations', where: whereFor(target), ...scoped })),
  ])

  const now = new Date()
  return {
    now: now.toISOString(),
    tab,
    sort,
    page: result.page ?? 1,
    totalPages: result.totalPages,
    totalDocs: result.totalDocs,
    tabCounts: Object.fromEntries(RESERVATION_TABS.map((target, index) => [target, counts[index]!.totalDocs])) as Record<ReservationTab, number>,
    locations: locations.docs.map((location) => ({ id: location.id, name: location.name })),
    rows: result.docs.map((reservation) => {
      const customer = populated<Customer>(reservation.customer)
      return {
        id: reservation.id,
        code: reservation.code ?? '',
        status: reservation.status,
        paymentStatus: reservation.paymentStatus,
        source: reservation.source,
        customerName: customer?.fullName ?? '',
        customerPhone: customer?.phone ?? '',
        vehicleModel: populated<VehicleModel>(reservation.vehicleModel)?.name ?? '',
        plate: populated<Vehicle>(reservation.vehicle)?.plate ?? null,
        pickupAt: reservation.pickupAt,
        returnAt: reservation.returnAt,
        pickupLocation: populated<Location>(reservation.pickupLocation)?.name ?? '',
        returnLocation: populated<Location>(reservation.returnLocation)?.name ?? '',
        rentalDays: reservation.pricing?.rentalDays ?? 0,
        total: reservation.pricing?.total ?? 0,
        paidTotal: reservation.paidTotal ?? 0,
        currency: reservation.pricing?.currency ?? 'TRY',
        createdAt: reservation.createdAt,
        desk: describeReservation(
          { status: reservation.status, hasVehicle: Boolean(reservation.vehicle), pickupAt: reservation.pickupAt, returnAt: reservation.returnAt, createdAt: reservation.createdAt },
          now,
        ),
        payment: summarizePayment({
          total: reservation.pricing?.total ?? 0,
          paidTotal: reservation.paidTotal ?? 0,
          paymentStatus: reservation.paymentStatus,
          status: reservation.status,
        }),
      }
    }),
  }
}
