import type { Payload, PayloadRequest } from 'payload'

import type {
  CreateReservationRequest,
  CustomerInput,
  Locale,
  ReservationCancelRequest,
  ReservationLookupRequest,
  ReservationSource,
  ReservationSummary,
} from '@rent/shared'

import { acquireTransactionLock, withTransaction } from '@/lib/db'
import { populated } from '@/lib/relations'
import type { Customer, Location, Reservation, VehicleModel } from '@/payload-types'

import { getActiveVehicleModel } from './catalog'
import { ServiceError } from './errors'
import { getAvailableUnitsByModel } from './inventory'
import { toLocalDate } from './pricing'
import { assertNoViolations, loadQuoteEnvironment, quoteForModel } from './quote'
import { checkDriverEligibility } from './rental-rules'
import { getReservationRules, getSettings, type ReservationRules } from './settings'

const HOUR_MS = 3_600_000
const SELF_CANCELLABLE_STATUSES: Reservation['status'][] = ['pending', 'confirmed']

type Ctx = { req?: Partial<PayloadRequest>; locale?: Locale }

/** Customer-facing booking (website / mobile). Runs in a transaction, serialized per model and location. */
export async function createReservation(
  payload: Payload,
  input: CreateReservationRequest,
  options: { source: Extract<ReservationSource, 'web' | 'mobile'>; now?: Date },
): Promise<ReservationSummary> {
  const now = options.now ?? new Date()

  return withTransaction(payload, async (req) => {
    await acquireTransactionLock(payload, req, `booking:${input.vehicleModelId}:${input.pickupLocationId}`)
    const ctx = { req, locale: input.locale, now }

    const env = await loadQuoteEnvironment(payload, input, ctx)
    const model = await getActiveVehicleModel(payload, input.vehicleModelId, ctx)
    const { quote, breakdown, violations } = quoteForModel(env, model)
    assertNoViolations([
      ...violations,
      ...checkDriverEligibility({
        pickupDate: toLocalDate(env.pickupAt, env.pickupLocation.timeZone),
        birthDate: input.customer.birthDate,
        licenseIssuedAt: input.customer.licenseIssuedAt,
        minDriverAge: model.minDriverAge,
        minLicenseYears: model.minLicenseYears,
      }),
    ])

    const units = await getAvailableUnitsByModel(
      payload,
      {
        locationId: input.pickupLocationId,
        window: { start: env.pickupAt, end: env.returnAt },
        bufferMinutes: env.rules.bufferMinutes,
        vehicleModelIds: [model.id],
      },
      { req },
    )
    if ((units.get(model.id) ?? 0) < 1) {
      throw new ServiceError('not_available', 'This vehicle is no longer available for the selected dates')
    }

    const customer = await upsertCustomer(payload, input.customer, {
      req,
      locale: input.locale,
      now,
      marketingConsent: input.marketingConsent,
    })
    if (customer.isBlacklisted) {
      // Deliberately generic: don't reveal the blacklist to the requester.
      throw new ServiceError('not_available', 'This vehicle is no longer available for the selected dates')
    }

    const reservation = await payload.create({
      collection: 'reservations',
      data: {
        status: 'pending',
        paymentStatus: 'unpaid',
        source: options.source,
        locale: input.locale,
        customer: customer.id,
        vehicleModel: model.id,
        pickupLocation: input.pickupLocationId,
        returnLocation: input.returnLocationId,
        pickupAt: env.pickupAt.toISOString(),
        returnAt: env.returnAt.toISOString(),
        flightNumber: input.flightNumber,
        customerNote: input.customerNote,
        preferredPaymentMethod: input.preferredPaymentMethod,
        extras: breakdown.extras.map((line) => ({
          extra: line.extraId,
          quantity: line.quantity,
          name: line.name,
          unitPrice: line.unitPrice,
          chargedDays: line.chargedDays,
          total: line.total,
        })),
        pricing: {
          currency: breakdown.currency,
          rentalDays: breakdown.rentalDays,
          baseTotal: breakdown.baseTotal,
          extrasTotal: breakdown.extrasTotal,
          transferFee: breakdown.transferFee,
          discount: 0,
          total: breakdown.total,
          deposit: breakdown.deposit,
          dailyBreakdown: breakdown.dailyBreakdown,
        },
        display: quote.display ?? undefined,
      },
      depth: 1,
      locale: input.locale,
      overrideAccess: true,
      req,
      context: { priceCalculated: true },
    })

    return toReservationSummary(reservation, env.rules, now)
  })
}

export async function lookupReservation(
  payload: Payload,
  input: ReservationLookupRequest,
  ctx: Ctx & { now?: Date } = {},
): Promise<ReservationSummary> {
  const reservation = await findOwnedReservation(payload, input, ctx)
  const rules = getReservationRules(await getSettings(payload, ctx.req))
  return toReservationSummary(reservation, rules, ctx.now ?? new Date())
}

export async function cancelReservation(
  payload: Payload,
  input: ReservationCancelRequest,
  ctx: Ctx & { now?: Date } = {},
): Promise<ReservationSummary> {
  const now = ctx.now ?? new Date()
  const reservation = await findOwnedReservation(payload, input, ctx)
  const rules = getReservationRules(await getSettings(payload, ctx.req))
  if (!SELF_CANCELLABLE_STATUSES.includes(reservation.status)) {
    throw new ServiceError('rule_violation', `A ${reservation.status} reservation cannot be cancelled`, {
      violations: [{ code: 'status_not_cancellable', status: reservation.status }],
    })
  }
  if (!canSelfCancel(reservation, rules, now)) {
    throw new ServiceError('rule_violation', 'This reservation can no longer be cancelled online', {
      violations: [{ code: 'cancel_cutoff', hours: rules.selfCancelCutoffHours }],
    })
  }
  const updated = await payload.update({
    collection: 'reservations',
    id: reservation.id,
    data: { status: 'cancelled', cancelReason: input.reason ?? 'Cancelled by customer online' },
    depth: 1,
    locale: ctx.locale,
    overrideAccess: true,
    req: ctx.req,
  })
  return toReservationSummary(updated, rules, now)
}

async function findOwnedReservation(
  payload: Payload,
  input: ReservationLookupRequest,
  ctx: Ctx,
): Promise<Reservation> {
  const { docs } = await payload.find({
    collection: 'reservations',
    where: { code: { equals: input.code } },
    depth: 1,
    limit: 1,
    locale: ctx.locale,
    overrideAccess: true,
    req: ctx.req,
  })
  const reservation = docs[0]
  const customer = populated<Customer>(reservation?.customer)
  // Same error for wrong code and wrong email so codes can't be probed.
  if (!reservation || !customer || customer.email !== input.email) {
    throw new ServiceError('not_found', 'Reservation not found')
  }
  return reservation
}

/**
 * Existing customers are matched by email. An anonymous form can't prove ownership of an
 * email, so existing values are never overwritten; only empty fields are filled.
 */
async function upsertCustomer(
  payload: Payload,
  input: CustomerInput,
  ctx: { req: Partial<PayloadRequest>; locale: Locale; now: Date; marketingConsent: boolean },
): Promise<Customer> {
  const submitted = {
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone,
    country: input.country,
    birthDate: input.birthDate,
    idDocumentType: input.idDocumentType,
    idDocumentNumber: input.idDocumentNumber,
    licenseNumber: input.licenseNumber,
    licenseCountry: input.licenseCountry,
    licenseIssuedAt: input.licenseIssuedAt,
  }
  const consent = ctx.marketingConsent ? { marketingConsent: true, marketingConsentAt: ctx.now.toISOString() } : {}

  const { docs } = await payload.find({
    collection: 'customers',
    where: { email: { equals: input.email } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req: ctx.req,
  })
  const existing = docs[0]

  if (!existing) {
    return payload.create({
      collection: 'customers',
      data: {
        ...submitted,
        email: input.email,
        preferredLocale: ctx.locale,
        privacyAcceptedAt: ctx.now.toISOString(),
        ...consent,
      },
      overrideAccess: true,
      req: ctx.req,
    })
  }

  const missing = Object.fromEntries(
    Object.entries(submitted).filter(([key, value]) => value != null && !existing[key as keyof Customer]),
  )
  return payload.update({
    collection: 'customers',
    id: existing.id,
    data: { ...missing, privacyAcceptedAt: ctx.now.toISOString(), ...consent },
    overrideAccess: true,
    req: ctx.req,
  })
}

function canSelfCancel(reservation: Reservation, rules: ReservationRules, now: Date): boolean {
  return (
    SELF_CANCELLABLE_STATUSES.includes(reservation.status) &&
    new Date(reservation.pickupAt).getTime() - now.getTime() >= rules.selfCancelCutoffHours * HOUR_MS
  )
}

export function toReservationSummary(reservation: Reservation, rules: ReservationRules, now: Date): ReservationSummary {
  const pickupLocation = populated<Location>(reservation.pickupLocation)
  const returnLocation = populated<Location>(reservation.returnLocation)
  const vehicleModel = populated<VehicleModel>(reservation.vehicleModel)
  const customer = populated<Customer>(reservation.customer)
  if (!pickupLocation || !returnLocation || !vehicleModel || !customer) {
    throw new Error('toReservationSummary expects a reservation fetched with depth >= 1')
  }
  return {
    code: reservation.code ?? '',
    status: reservation.status,
    paymentStatus: reservation.paymentStatus,
    preferredPaymentMethod: reservation.preferredPaymentMethod,
    pickupAt: new Date(reservation.pickupAt).toISOString(),
    returnAt: new Date(reservation.returnAt).toISOString(),
    pickupLocation: { id: pickupLocation.id, name: pickupLocation.name },
    returnLocation: { id: returnLocation.id, name: returnLocation.name },
    vehicleModel: { id: vehicleModel.id, name: vehicleModel.name ?? `${vehicleModel.brand} ${vehicleModel.model}` },
    customerName: customer.fullName ?? `${customer.firstName} ${customer.lastName}`,
    rentalDays: reservation.pricing?.rentalDays ?? 0,
    currency: reservation.pricing?.currency ?? 'TRY',
    total: reservation.pricing?.total ?? 0,
    paidTotal: reservation.paidTotal ?? 0,
    canCancel: canSelfCancel(reservation, rules, now),
  }
}
