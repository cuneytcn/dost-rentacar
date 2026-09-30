import { APIError, type CollectionBeforeChangeHook, type CollectionBeforeValidateHook } from 'payload'

import { CAPACITY_HOLDING_STATUSES, RESERVATION_STATUS_TRANSITIONS, type ReservationStatus } from '@rent/shared'

import { relationId } from '@/lib/relations'
import type { Reservation } from '@/payload-types'
import { getActiveVehicleModel } from '@/services/catalog'
import { ServiceError } from '@/services/errors'
import { assertVehicleAssignable } from '@/services/inventory'
import { loadQuoteEnvironment, quoteForModel } from '@/services/quote'
import { generateReservationCode } from '@/services/reservation-code'
import { getReservationRules, getSettings } from '@/services/settings'

type Data = Partial<Reservation>

const toApiError = (error: unknown): never => {
  if (error instanceof ServiceError) throw new APIError(error.message, error.status, error.details as object | undefined, true)
  throw error
}

export const assignReservationCode: CollectionBeforeValidateHook<Reservation> = ({ data, operation }) => {
  if (operation === 'create' && data && !data.code) data.code = generateReservationCode()
  return data
}

export const enforceStatusTransition: CollectionBeforeChangeHook<Reservation> = ({ data, originalDoc, operation }) => {
  const next = (data.status ?? originalDoc?.status) as ReservationStatus
  const previous = originalDoc?.status as ReservationStatus | undefined

  if (operation === 'update' && previous && next !== previous) {
    if (!RESERVATION_STATUS_TRANSITIONS[previous].includes(next)) {
      throw new APIError(`Status cannot change from "${previous}" to "${next}"`, 400, undefined, true)
    }
    if (next === 'confirmed' && !originalDoc?.confirmedAt) data.confirmedAt = new Date().toISOString()
    if (next === 'cancelled') data.cancelledAt = new Date().toISOString()
  }
  if (next === 'active' && !(data.vehicle ?? originalDoc?.vehicle)) {
    throw new APIError('Assign a vehicle before starting the rental', 400, undefined, true)
  }
  return data
}

/**
 * Staff bookings from the admin panel get priced automatically on create, and again when
 * "recalculate price" is ticked. Public bookings are priced by the reservation service.
 */
export const calculateReservationPrice: CollectionBeforeChangeHook<Reservation> = async ({
  data,
  originalDoc,
  operation,
  req,
  context,
}) => {
  const shouldCalculate =
    !context.priceCalculated && ((operation === 'create' && data.pricing?.total == null) || data.recalculatePrice)
  data.recalculatePrice = false

  if (shouldCalculate) {
    const merged = { ...originalDoc, ...data } as Data
    try {
      const env = await loadQuoteEnvironment(
        req.payload,
        {
          pickupLocationId: relationId(merged.pickupLocation)!,
          returnLocationId: relationId(merged.returnLocation)!,
          pickupAt: merged.pickupAt!,
          returnAt: merged.returnAt!,
          extras: (merged.extras ?? []).map((row) => ({ extraId: relationId(row.extra)!, quantity: row.quantity })),
        },
        { req },
      )
      const model = await getActiveVehicleModel(req.payload, relationId(merged.vehicleModel)!, { req })
      // Staff may override customer-facing rules (lead time, opening hours …), so violations are ignored here.
      const { breakdown } = quoteForModel(env, model)
      const discount = merged.pricing?.discount ?? 0

      data.extras = breakdown.extras.map((line) => ({
        extra: line.extraId,
        quantity: line.quantity,
        name: line.name,
        unitPrice: line.unitPrice,
        chargedDays: line.chargedDays,
        total: line.total,
      }))
      data.pricing = {
        currency: breakdown.currency,
        rentalDays: breakdown.rentalDays,
        baseTotal: breakdown.baseTotal,
        extrasTotal: breakdown.extrasTotal,
        transferFee: breakdown.transferFee,
        discount,
        total: Math.max(0, breakdown.total - discount),
        deposit: breakdown.deposit,
        dailyBreakdown: breakdown.dailyBreakdown,
      }
    } catch (error) {
      toApiError(error)
    }
  } else if (operation === 'update' && data.pricing && originalDoc?.pricing) {
    // Only the discount is editable; keep the total consistent with it.
    const previous = originalDoc.pricing
    const discount = data.pricing.discount ?? previous.discount ?? 0
    const gross = (previous.baseTotal ?? 0) + (previous.extrasTotal ?? 0) + (previous.transferFee ?? 0)
    data.pricing = { ...previous, ...data.pricing, discount, total: Math.max(0, gross - discount) }
  }
  return data
}

export const syncPaymentStatus: CollectionBeforeChangeHook<Reservation> = ({ data, originalDoc }) => {
  const payments = data.payments ?? originalDoc?.payments ?? []
  const paidTotal = payments.reduce((total, payment) => total + (payment.amount ?? 0), 0)
  data.paidTotal = paidTotal

  const currentStatus = data.paymentStatus ?? originalDoc?.paymentStatus
  if (currentStatus !== 'refunded') {
    const total = data.pricing?.total ?? originalDoc?.pricing?.total ?? 0
    data.paymentStatus = paidTotal <= 0 ? 'unpaid' : paidTotal >= total ? 'paid' : 'partial'
  }
  return data
}

/** Checks a newly assigned vehicle (or changed dates) against blocks and other rentals, incl. buffer. */
export const validateVehicleAssignment: CollectionBeforeChangeHook<Reservation> = async ({
  data,
  originalDoc,
  req,
}) => {
  const merged = { ...originalDoc, ...data } as Data
  const vehicleId = relationId(merged.vehicle)
  const status = merged.status as ReservationStatus
  if (!vehicleId || !(CAPACITY_HOLDING_STATUSES as readonly string[]).includes(status)) return data

  const changed =
    vehicleId !== relationId(originalDoc?.vehicle) ||
    merged.pickupAt !== originalDoc?.pickupAt ||
    merged.returnAt !== originalDoc?.returnAt ||
    status !== originalDoc?.status
  if (!changed) return data

  const rules = getReservationRules(await getSettings(req.payload, req))
  try {
    await assertVehicleAssignable(
      req.payload,
      {
        vehicleId,
        window: { start: new Date(merged.pickupAt!), end: new Date(merged.returnAt!) },
        bufferMinutes: rules.bufferMinutes,
        excludeReservationId: originalDoc?.id,
      },
      { req },
    )
  } catch (error) {
    toApiError(error)
  }
  return data
}
