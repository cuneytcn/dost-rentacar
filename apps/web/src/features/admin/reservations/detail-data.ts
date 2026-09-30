import 'server-only'

import { notFound } from 'next/navigation'

import { RESERVATION_STATUS_TRANSITIONS, type Currency, type ReservationStatus } from '@rent/shared'

import { getPayloadClient } from '@/lib/payload'
import { populated, relationId } from '@/lib/relations'
import type {
  Customer,
  Document,
  Handover,
  Location,
  Penalty,
  Reservation,
  User,
  Vehicle,
  VehicleCategory,
  VehicleModel,
} from '@/payload-types'
import { toLocalDate } from '@/services/pricing'
import { fullYearsBetween } from '@/services/rental-rules'

import type { SessionUser } from '../auth/session'
import { describeReservation, summarizePayment, type DeskStatus, type PaymentSummary } from './status'

export type HandoverView = {
  id: number
  type: Handover['type']
  performedAt: string
  mileageKm: number
  fuelLevel: Handover['fuelLevel']
  notes: string | null
  performedBy: string | null
  damages: { area: string; description: string; isNew: boolean; photoUrl: string | null }[]
  photos: { url: string; thumbnailUrl: string }[]
}

export type TimelineEvent = {
  at: string
  kind: 'created' | 'confirmed' | 'payment' | 'pickup' | 'return' | 'cancelled' | 'reminder'
  detail?: string
  amount?: number
}

export type ReservationDetail = {
  id: number
  code: string
  status: ReservationStatus
  paymentStatus: Reservation['paymentStatus']
  source: Reservation['source']
  locale: string
  preferredPaymentMethod: Reservation['preferredPaymentMethod']
  flightNumber: string | null
  customerNote: string | null
  internalNote: string | null
  cancelReason: string | null
  createdAt: string
  pickupAt: string
  returnAt: string
  timeZone: string
  customer: {
    id: number
    fullName: string
    email: string
    phone: string
    country: string | null
    birthDate: string | null
    age: number | null
    idDocumentType: Customer['idDocumentType'] | null
    idDocumentNumber: string | null
    licenseNumber: string | null
    licenseCountry: string | null
    licenseIssuedAt: string | null
    isBlacklisted: boolean
    blacklistReason: string | null
  }
  vehicleModel: { id: number; name: string; category: string | null; transmission: VehicleModel['transmission']; fuelType: VehicleModel['fuelType']; minDriverAge: number }
  vehicle: { id: number; plate: string; model: string; mileageKm: number; isUpgrade: boolean } | null
  pickupLocation: { id: number; name: string; address: string; phone: string }
  returnLocation: { id: number; name: string; address: string; phone: string }
  pricing: {
    currency: Currency
    rentalDays: number
    baseTotal: number
    extrasTotal: number
    transferFee: number
    discount: number
    total: number
    deposit: number
    dailyBreakdown: { date: string; amount: number }[]
  }
  extras: { name: string; quantity: number; unitPrice: number; chargedDays: number | null; total: number }[]
  display: { currency: Currency; rate: number; total: number } | null
  payments: { id: string; amount: number; method: NonNullable<Reservation['payments']>[number]['method']; paidAt: string; reference: string | null; proofUrl: string | null }[]
  paidTotal: number
  balance: number
  additionalDrivers: { fullName: string; licenseNumber: string | null; birthDate: string | null }[]
  handovers: HandoverView[]
  penalties: { id: number; type: Penalty['type']; status: Penalty['status']; amount: number; occurredAt: string }[]
  transitions: ReservationStatus[]
  timeline: TimelineEvent[]
  extrasSelection: { extraId: number; quantity: number }[]
  desk: DeskStatus
  paymentSummary: PaymentSummary
  now: string
  editOptions: {
    locations: { id: number; name: string }[]
    vehicleModels: { id: number; name: string }[]
    extras: { id: number; name: string; pricingType: 'per_day' | 'per_rental'; price: number; maxQuantity: number }[]
  }
}

const TIMELINE_ORDER: Record<TimelineEvent['kind'], number> = {
  created: 0,
  confirmed: 1,
  payment: 2,
  reminder: 3,
  pickup: 4,
  return: 5,
  cancelled: 6,
}

function documentUrls(value: number | Document | null | undefined) {
  const doc = populated<Document>(value)
  if (!doc?.url) return null
  return { url: doc.url, thumbnailUrl: doc.sizes?.thumbnail?.url ?? doc.url }
}

function toHandoverView(handover: Handover): HandoverView {
  return {
    id: handover.id,
    type: handover.type,
    performedAt: handover.performedAt,
    mileageKm: handover.mileageKm,
    fuelLevel: handover.fuelLevel,
    notes: handover.notes ?? null,
    performedBy: populated<User>(handover.performedBy)?.name ?? null,
    damages: (handover.damages ?? []).map((damage) => ({
      area: damage.area,
      description: damage.description,
      isNew: Boolean(damage.isNew),
      photoUrl: documentUrls(damage.photo)?.url ?? null,
    })),
    photos: (handover.photos ?? []).map((photo) => documentUrls(photo)).filter((photo): photo is NonNullable<typeof photo> => Boolean(photo)),
  }
}

export async function getReservationDetail(user: SessionUser, id: number): Promise<ReservationDetail> {
  const payload = await getPayloadClient()
  const scoped = { overrideAccess: false, user } as const

  const reservation = await payload.findByID({ collection: 'reservations', id, depth: 2, ...scoped }).catch(() => null)
  if (!reservation) notFound()

  const [handovers, penalties, locations, vehicleModels, extras] = await Promise.all([
    payload.find({ collection: 'handovers', where: { reservation: { equals: id } }, sort: 'performedAt', depth: 1, pagination: false, ...scoped }),
    payload.find({ collection: 'penalties', where: { reservation: { equals: id } }, sort: '-occurredAt', depth: 0, pagination: false, ...scoped }),
    payload.find({ collection: 'locations', where: { isActive: { equals: true } }, sort: 'sortOrder', depth: 0, pagination: false, ...scoped }),
    payload.find({ collection: 'vehicle-models', where: { isActive: { equals: true } }, sort: 'sortOrder', depth: 0, pagination: false, ...scoped }),
    payload.find({ collection: 'extras', where: { isActive: { equals: true } }, sort: 'sortOrder', depth: 0, pagination: false, ...scoped }),
  ])

  const customer = populated<Customer>(reservation.customer)!
  const model = populated<VehicleModel>(reservation.vehicleModel)!
  const vehicle = populated<Vehicle>(reservation.vehicle)
  const vehicleModel = populated<VehicleModel>(vehicle?.vehicleModel)
  const pickupLocation = populated<Location>(reservation.pickupLocation)!
  const returnLocation = populated<Location>(reservation.returnLocation)!
  const pickupDate = toLocalDate(new Date(reservation.pickupAt), pickupLocation.timeZone)
  const payments = (reservation.payments ?? []).map((payment) => ({
    id: payment.id ?? '',
    amount: payment.amount,
    method: payment.method,
    paidAt: payment.paidAt,
    reference: payment.reference ?? null,
    proofUrl: documentUrls(payment.proof)?.url ?? null,
  }))
  const handoverViews = handovers.docs.map(toHandoverView)
  const total = reservation.pricing?.total ?? 0
  const paidTotal = reservation.paidTotal ?? 0

  const timeline: TimelineEvent[] = [
    { at: reservation.createdAt, kind: 'created' as const, detail: reservation.source },
    ...(reservation.confirmedAt ? [{ at: reservation.confirmedAt, kind: 'confirmed' as const }] : []),
    ...payments.map((payment) => ({ at: payment.paidAt, kind: 'payment' as const, amount: payment.amount, detail: payment.method })),
    ...handoverViews.map((handover) => ({ at: handover.performedAt, kind: handover.type === 'pickup' ? ('pickup' as const) : ('return' as const), detail: handover.performedBy ?? undefined })),
    ...(reservation.reminderSentAt ? [{ at: reservation.reminderSentAt, kind: 'reminder' as const }] : []),
    ...(reservation.cancelledAt ? [{ at: reservation.cancelledAt, kind: 'cancelled' as const, detail: reservation.cancelReason ?? undefined }] : []),
  ].sort((a, b) => {
    // Events recorded within the same minute (e.g. created + confirmed by staff) keep their logical order.
    const diff = new Date(a.at).getTime() - new Date(b.at).getTime()
    return Math.abs(diff) < 60_000 ? TIMELINE_ORDER[a.kind] - TIMELINE_ORDER[b.kind] || diff : diff
  })

  return {
    id: reservation.id,
    code: reservation.code ?? '',
    status: reservation.status,
    paymentStatus: reservation.paymentStatus,
    source: reservation.source,
    locale: reservation.locale ?? 'tr',
    preferredPaymentMethod: reservation.preferredPaymentMethod,
    flightNumber: reservation.flightNumber ?? null,
    customerNote: reservation.customerNote ?? null,
    internalNote: reservation.internalNote ?? null,
    cancelReason: reservation.cancelReason ?? null,
    createdAt: reservation.createdAt,
    pickupAt: reservation.pickupAt,
    returnAt: reservation.returnAt,
    timeZone: pickupLocation.timeZone,
    customer: {
      id: customer.id,
      fullName: customer.fullName ?? `${customer.firstName} ${customer.lastName}`,
      email: customer.email,
      phone: customer.phone,
      country: customer.country ?? null,
      birthDate: customer.birthDate ?? null,
      age: customer.birthDate ? fullYearsBetween(customer.birthDate, pickupDate) : null,
      idDocumentType: customer.idDocumentType ?? null,
      idDocumentNumber: customer.idDocumentNumber ?? null,
      licenseNumber: customer.licenseNumber ?? null,
      licenseCountry: customer.licenseCountry ?? null,
      licenseIssuedAt: customer.licenseIssuedAt ?? null,
      isBlacklisted: Boolean(customer.isBlacklisted),
      blacklistReason: customer.blacklistReason ?? null,
    },
    vehicleModel: {
      id: model.id,
      name: model.name ?? `${model.brand} ${model.model}`,
      category: populated<VehicleCategory>(model.category)?.name ?? null,
      transmission: model.transmission,
      fuelType: model.fuelType,
      minDriverAge: model.minDriverAge,
    },
    vehicle: vehicle
      ? {
          id: vehicle.id,
          plate: vehicle.plate,
          model: vehicleModel?.name ?? '',
          mileageKm: vehicle.mileageKm ?? 0,
          isUpgrade: Boolean(vehicleModel && vehicleModel.id !== model.id),
        }
      : null,
    pickupLocation: { id: pickupLocation.id, name: pickupLocation.name, address: pickupLocation.address, phone: pickupLocation.phone },
    returnLocation: { id: returnLocation.id, name: returnLocation.name, address: returnLocation.address, phone: returnLocation.phone },
    pricing: {
      currency: reservation.pricing?.currency ?? 'TRY',
      rentalDays: reservation.pricing?.rentalDays ?? 0,
      baseTotal: reservation.pricing?.baseTotal ?? 0,
      extrasTotal: reservation.pricing?.extrasTotal ?? 0,
      transferFee: reservation.pricing?.transferFee ?? 0,
      discount: reservation.pricing?.discount ?? 0,
      total,
      deposit: reservation.pricing?.deposit ?? 0,
      dailyBreakdown: Array.isArray(reservation.pricing?.dailyBreakdown)
        ? (reservation.pricing.dailyBreakdown as { date: string; amount: number }[]).map(({ date, amount }) => ({ date, amount }))
        : [],
    },
    extras: (reservation.extras ?? []).map((row) => ({
      name: row.name ?? '',
      quantity: row.quantity,
      unitPrice: row.unitPrice ?? 0,
      chargedDays: row.chargedDays ?? null,
      total: row.total ?? 0,
    })),
    display:
      reservation.display?.currency && reservation.display.rate && reservation.display.total != null
        ? { currency: reservation.display.currency, rate: reservation.display.rate, total: reservation.display.total }
        : null,
    payments,
    paidTotal,
    balance: Math.max(0, total - paidTotal),
    additionalDrivers: (reservation.additionalDrivers ?? []).map((driver) => ({
      fullName: driver.fullName,
      licenseNumber: driver.licenseNumber ?? null,
      birthDate: driver.birthDate ?? null,
    })),
    handovers: handoverViews,
    penalties: penalties.docs.map((penalty) => ({
      id: penalty.id,
      type: penalty.type,
      status: penalty.status,
      amount: penalty.amount,
      occurredAt: penalty.occurredAt,
    })),
    transitions: [...RESERVATION_STATUS_TRANSITIONS[reservation.status]],
    timeline,
    now: new Date().toISOString(),
    desk: describeReservation(
      { status: reservation.status, hasVehicle: Boolean(reservation.vehicle), pickupAt: reservation.pickupAt, returnAt: reservation.returnAt, createdAt: reservation.createdAt },
      new Date(),
    ),
    paymentSummary: summarizePayment({ total, paidTotal, paymentStatus: reservation.paymentStatus, status: reservation.status }),
    extrasSelection: (reservation.extras ?? []).map((row) => ({ extraId: relationId(row.extra)!, quantity: row.quantity })),
    editOptions: {
      locations: locations.docs.map((location) => ({ id: location.id, name: location.name })),
      vehicleModels: vehicleModels.docs.map((vehicleModel) => ({ id: vehicleModel.id, name: vehicleModel.name ?? `${vehicleModel.brand} ${vehicleModel.model}` })),
      extras: extras.docs.map((extra) => ({ id: extra.id, name: extra.name, pricingType: extra.pricingType, price: extra.price, maxQuantity: extra.maxQuantity })),
    },
  }
}
