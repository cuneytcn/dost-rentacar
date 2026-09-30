import 'server-only'

import { notFound } from 'next/navigation'
import type { Where } from 'payload'

import { getPayloadClient } from '@/lib/payload'
import { populated } from '@/lib/relations'
import type { Customer, Reservation, VehicleModel } from '@/payload-types'

import type { SessionUser } from '../auth/session'
import { describeReservation, summarizePayment, type DeskStatus, type PaymentSummary } from '../reservations/status'

const PAGE_SIZE = 25

export type CustomerRow = {
  id: number
  fullName: string
  email: string
  phone: string
  country: string | null
  isBlacklisted: boolean
  rentals: number
  lastRentalAt: string | null
  createdAt: string
}

export type CustomerListData = {
  rows: CustomerRow[]
  page: number
  totalPages: number
  totalDocs: number
  filter: 'all' | 'blacklisted'
}

export async function getCustomerList(user: SessionUser, params: { q?: string; filter?: string; page?: string }): Promise<CustomerListData> {
  const payload = await getPayloadClient()
  const scoped = { overrideAccess: false, user } as const
  const filter = params.filter === 'blacklisted' ? 'blacklisted' : 'all'
  const where: Where[] = []
  const q = params.q?.trim()
  if (q) {
    where.push({
      or: [
        { fullName: { like: q } },
        { email: { like: q.toLowerCase() } },
        { phone: { like: q } },
        { idDocumentNumber: { like: q } },
        { licenseNumber: { like: q } },
      ],
    })
  }
  if (filter === 'blacklisted') where.push({ isBlacklisted: { equals: true } })

  const result = await payload.find({
    collection: 'customers',
    where: { and: where },
    sort: '-createdAt',
    page: Math.max(1, Number(params.page) || 1),
    limit: PAGE_SIZE,
    depth: 0,
    ...scoped,
  })
  const ids = result.docs.map((customer) => customer.id)
  const reservations = ids.length
    ? await payload.find({
        collection: 'reservations',
        where: { customer: { in: ids } },
        select: { customer: true, pickupAt: true },
        sort: '-pickupAt',
        depth: 0,
        pagination: false,
        ...scoped,
      })
    : { docs: [] as Pick<Reservation, 'id' | 'customer' | 'pickupAt'>[] }

  return {
    filter,
    page: result.page ?? 1,
    totalPages: result.totalPages,
    totalDocs: result.totalDocs,
    rows: result.docs.map((customer) => {
      const own = reservations.docs.filter((reservation) => reservation.customer === customer.id)
      return {
        id: customer.id,
        fullName: customer.fullName ?? `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        phone: customer.phone,
        country: customer.country ?? null,
        isBlacklisted: Boolean(customer.isBlacklisted),
        rentals: own.length,
        lastRentalAt: own[0]?.pickupAt ?? null,
        createdAt: customer.createdAt,
      }
    }),
  }
}

export type CustomerDetail = {
  customer: Pick<
    Customer,
    | 'id'
    | 'firstName'
    | 'lastName'
    | 'email'
    | 'phone'
    | 'country'
    | 'birthDate'
    | 'preferredLocale'
    | 'idDocumentType'
    | 'idDocumentNumber'
    | 'licenseNumber'
    | 'licenseCountry'
    | 'licenseIssuedAt'
    | 'address'
    | 'isBlacklisted'
    | 'blacklistReason'
    | 'notes'
    | 'privacyAcceptedAt'
    | 'marketingConsent'
    | 'marketingConsentAt'
    | 'createdAt'
  >
  reservations: {
    id: number
    code: string
    status: Reservation['status']
    paymentStatus: Reservation['paymentStatus']
    vehicleModel: string
    pickupAt: string
    returnAt: string
    total: number
    currency: string
    desk: DeskStatus
    payment: PaymentSummary
  }[]
  now: string
  stats: { rentals: number; completed: number; revenue: number; currency: string; cancelled: number }
}

export async function getCustomerDetail(user: SessionUser, id: number): Promise<CustomerDetail> {
  const payload = await getPayloadClient()
  const scoped = { overrideAccess: false, user } as const
  const customer = await payload.findByID({ collection: 'customers', id, depth: 0, ...scoped }).catch(() => null)
  if (!customer) notFound()
  const reservations = await payload.find({
    collection: 'reservations',
    where: { customer: { equals: id } },
    sort: '-pickupAt',
    depth: 1,
    pagination: false,
    ...scoped,
  })
  const now = new Date()
  const rows = reservations.docs.map((reservation) => ({
    id: reservation.id,
    code: reservation.code ?? '',
    status: reservation.status,
    paymentStatus: reservation.paymentStatus,
    vehicleModel: populated<VehicleModel>(reservation.vehicleModel)?.name ?? '',
    pickupAt: reservation.pickupAt,
    returnAt: reservation.returnAt,
    total: reservation.pricing?.total ?? 0,
    currency: reservation.pricing?.currency ?? 'TRY',
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
  }))
  const completed = rows.filter((row) => row.status === 'completed')
  return {
    customer: {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      country: customer.country,
      birthDate: customer.birthDate,
      preferredLocale: customer.preferredLocale,
      idDocumentType: customer.idDocumentType,
      idDocumentNumber: customer.idDocumentNumber,
      licenseNumber: customer.licenseNumber,
      licenseCountry: customer.licenseCountry,
      licenseIssuedAt: customer.licenseIssuedAt,
      address: customer.address,
      isBlacklisted: customer.isBlacklisted,
      blacklistReason: customer.blacklistReason,
      notes: customer.notes,
      privacyAcceptedAt: customer.privacyAcceptedAt,
      marketingConsent: customer.marketingConsent,
      marketingConsentAt: customer.marketingConsentAt,
      createdAt: customer.createdAt,
    },
    reservations: rows,
    now: now.toISOString(),
    stats: {
      rentals: rows.length,
      completed: completed.length,
      cancelled: rows.filter((row) => row.status === 'cancelled' || row.status === 'no_show').length,
      revenue: completed.reduce((sum, row) => sum + row.total, 0),
      currency: rows[0]?.currency ?? 'TRY',
    },
  }
}
