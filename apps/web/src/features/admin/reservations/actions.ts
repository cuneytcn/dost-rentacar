'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { DAMAGE_AREAS, FUEL_LEVELS, PAYMENT_METHODS } from '@rent/shared'

import { getPayloadClient } from '@/lib/payload'
import { populated, relationId } from '@/lib/relations'
import type { Location, VehicleModel } from '@/payload-types'
import { ServiceError } from '@/services/errors'
import { getAvailableUnitsByModel, getVehicleAvailability, type VehicleAvailability } from '@/services/inventory'
import { getReservationRules, getSettings } from '@/services/settings'

import { requireStaff } from '../auth/session'
import { runAction, type ActionResult } from '../shared/action-result'

const idSchema = z.number().int().positive()

function refresh(id: number) {
  revalidatePath(`/admin/reservations/${id}`)
  revalidatePath('/admin/reservations')
  revalidatePath('/admin')
  revalidatePath('/admin/calendar')
}

async function context() {
  const user = await requireStaff()
  const payload = await getPayloadClient()
  return { user, payload, scoped: { overrideAccess: false, user } as const }
}

export type VehicleOption = {
  id: number
  plate: string
  model: string
  location: string
  mileageKm: number
  sameModel: boolean
  atPickupLocation: boolean
  availability: VehicleAvailability
}

/** Vehicles that could take this reservation, same model first, with their availability for its period. */
export async function getVehicleOptionsAction(reservationId: number): Promise<ActionResult<VehicleOption[]>> {
  return runAction(async () => {
    const { payload, scoped } = await context()
    const reservation = await payload.findByID({ collection: 'reservations', id: idSchema.parse(reservationId), depth: 0, ...scoped })
    const [vehicles, settings] = await Promise.all([
      payload.find({ collection: 'vehicles', where: { status: { equals: 'active' } }, depth: 1, pagination: false, sort: 'plate', ...scoped }),
      getSettings(payload),
    ])
    const availability = await getVehicleAvailability(payload, {
      vehicleIds: vehicles.docs.map((vehicle) => vehicle.id),
      window: { start: new Date(reservation.pickupAt), end: new Date(reservation.returnAt) },
      bufferMinutes: getReservationRules(settings).bufferMinutes,
      excludeReservationId: reservation.id,
    })
    const modelId = relationId(reservation.vehicleModel)
    const pickupLocationId = relationId(reservation.pickupLocation)
    return vehicles.docs
      .map((vehicle) => ({
        id: vehicle.id,
        plate: vehicle.plate,
        model: populated<VehicleModel>(vehicle.vehicleModel)?.name ?? '',
        location: populated<Location>(vehicle.location)?.name ?? '',
        mileageKm: vehicle.mileageKm ?? 0,
        sameModel: relationId(vehicle.vehicleModel) === modelId,
        atPickupLocation: relationId(vehicle.location) === pickupLocationId,
        availability: availability.get(vehicle.id) ?? { status: 'free' as const },
      }))
      .sort(
        (a, b) =>
          Number(b.sameModel) - Number(a.sameModel) ||
          Number(b.availability.status === 'free') - Number(a.availability.status === 'free') ||
          Number(b.atPickupLocation) - Number(a.atPickupLocation) ||
          a.plate.localeCompare(b.plate),
      )
  })
}

export async function confirmReservationAction(input: { id: number; vehicleId: number | null }): Promise<ActionResult> {
  return runAction(async () => {
    const { payload, scoped } = await context()
    const { id, vehicleId } = z.object({ id: idSchema, vehicleId: idSchema.nullable() }).parse(input)
    await payload.update({
      collection: 'reservations',
      id,
      data: { status: 'confirmed', ...(vehicleId ? { vehicle: vehicleId } : {}) },
      ...scoped,
    })
    refresh(id)
  })
}

export async function assignVehicleAction(input: { id: number; vehicleId: number | null }): Promise<ActionResult> {
  return runAction(async () => {
    const { payload, scoped } = await context()
    const { id, vehicleId } = z.object({ id: idSchema, vehicleId: idSchema.nullable() }).parse(input)
    await payload.update({ collection: 'reservations', id, data: { vehicle: vehicleId }, ...scoped })
    refresh(id)
  })
}

export async function changeStatusAction(input: {
  id: number
  status: 'cancelled' | 'no_show' | 'pending'
  reason?: string
}): Promise<ActionResult> {
  return runAction(async () => {
    const { payload, scoped } = await context()
    const { id, status, reason } = z
      .object({ id: idSchema, status: z.enum(['cancelled', 'no_show', 'pending']), reason: z.string().trim().max(500).optional() })
      .parse(input)
    await payload.update({
      collection: 'reservations',
      id,
      data: { status, ...(status === 'cancelled' ? { cancelReason: reason || null } : {}) },
      ...scoped,
    })
    refresh(id)
  })
}

const paymentSchema = z.object({
  id: idSchema,
  amount: z.number().int().positive(),
  method: z.enum(PAYMENT_METHODS),
  paidAt: z.iso.datetime({ offset: true }),
  reference: z.string().trim().max(120).optional(),
  proofId: idSchema.optional(),
})

export async function addPaymentAction(input: z.input<typeof paymentSchema>): Promise<ActionResult> {
  return runAction(async () => {
    const { payload, scoped } = await context()
    const { id, proofId, ...payment } = paymentSchema.parse(input)
    const reservation = await payload.findByID({ collection: 'reservations', id, depth: 0, ...scoped })
    await payload.update({
      collection: 'reservations',
      id,
      data: {
        payments: [
          ...(reservation.payments ?? []).map((existing) => ({ ...existing, proof: relationId(existing.proof) })),
          { ...payment, reference: payment.reference || null, proof: proofId ?? null },
        ],
      },
      ...scoped,
    })
    refresh(id)
  })
}

export async function removePaymentAction(input: { id: number; paymentId: string }): Promise<ActionResult> {
  return runAction(async () => {
    const { payload, scoped } = await context()
    const { id, paymentId } = z.object({ id: idSchema, paymentId: z.string().min(1) }).parse(input)
    const reservation = await payload.findByID({ collection: 'reservations', id, depth: 0, ...scoped })
    await payload.update({
      collection: 'reservations',
      id,
      data: {
        payments: (reservation.payments ?? [])
          .filter((payment) => payment.id !== paymentId)
          .map((payment) => ({ ...payment, proof: relationId(payment.proof) })),
      },
      ...scoped,
    })
    refresh(id)
  })
}

export async function updateInternalNoteAction(input: { id: number; note: string }): Promise<ActionResult> {
  return runAction(async () => {
    const { payload, scoped } = await context()
    const { id, note } = z.object({ id: idSchema, note: z.string().max(5000) }).parse(input)
    await payload.update({ collection: 'reservations', id, data: { internalNote: note || null }, ...scoped })
    refresh(id)
  })
}

export async function updateDiscountAction(input: { id: number; discount: number }): Promise<ActionResult> {
  return runAction(async () => {
    const { payload, scoped } = await context()
    const { id, discount } = z.object({ id: idSchema, discount: z.number().int().min(0) }).parse(input)
    const reservation = await payload.findByID({ collection: 'reservations', id, depth: 0, ...scoped })
    await payload.update({ collection: 'reservations', id, data: { pricing: { ...reservation.pricing, discount } }, ...scoped })
    refresh(id)
  })
}

export async function recalculatePriceAction(id: number): Promise<ActionResult> {
  return runAction(async () => {
    const { payload, scoped } = await context()
    await payload.update({ collection: 'reservations', id: idSchema.parse(id), data: { recalculatePrice: true }, ...scoped })
    refresh(id)
  })
}

const MAX_PHOTO_BYTES = 8 * 1024 * 1024

async function uploadDocument(file: File, description: string, scoped: Awaited<ReturnType<typeof context>>) {
  if (!file.type.startsWith('image/')) throw new z.ZodError([{ code: 'custom', path: ['photos'], message: 'Only images are allowed', input: file.type }])
  if (file.size > MAX_PHOTO_BYTES) throw new z.ZodError([{ code: 'custom', path: ['photos'], message: 'Photo is too large', input: file.size }])
  const doc = await scoped.payload.create({
    collection: 'documents',
    data: { description },
    file: { data: Buffer.from(await file.arrayBuffer()), mimetype: file.type, name: file.name || 'photo.jpg', size: file.size },
    ...scoped.scoped,
  })
  return doc.id
}

const handoverSchema = z.object({
  reservationId: z.coerce.number().int().positive(),
  type: z.enum(['pickup', 'return']),
  mileageKm: z.coerce.number().int().min(0),
  fuelLevel: z.enum(FUEL_LEVELS),
  performedAt: z.iso.datetime({ offset: true }),
  notes: z.string().trim().max(2000).optional(),
  damages: z
    .string()
    .transform((value) => JSON.parse(value || '[]') as unknown)
    .pipe(z.array(z.object({ area: z.enum(DAMAGE_AREAS), description: z.string().trim().min(1).max(300), isNew: z.boolean() })).max(30)),
})

/** Records a pickup or return with photos. The Payload hooks move the reservation and vehicle forward. */
export async function recordHandoverAction(formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const ctx = await context()
    const input = handoverSchema.parse({
      reservationId: formData.get('reservationId'),
      type: formData.get('type'),
      mileageKm: formData.get('mileageKm'),
      fuelLevel: formData.get('fuelLevel'),
      performedAt: formData.get('performedAt'),
      notes: formData.get('notes') || undefined,
      damages: formData.get('damages') ?? '[]',
    })
    const reservation = await ctx.payload.findByID({ collection: 'reservations', id: input.reservationId, depth: 0, ...ctx.scoped })
    const photos = formData.getAll('photos').filter((value): value is File => value instanceof File && value.size > 0)
    if (photos.length > 20) throw new z.ZodError([{ code: 'custom', path: ['photos'], message: 'At most 20 photos', input: photos.length }])
    const photoIds: number[] = []
    for (const photo of photos) {
      photoIds.push(await uploadDocument(photo, `${reservation.code} · ${input.type}`, ctx))
    }

    await ctx.payload.create({
      collection: 'handovers',
      data: {
        reservation: input.reservationId,
        type: input.type,
        performedAt: input.performedAt,
        mileageKm: input.mileageKm,
        fuelLevel: input.fuelLevel,
        notes: input.notes,
        damages: input.damages,
        photos: photoIds,
      },
      ...ctx.scoped,
    })
    refresh(input.reservationId)
  })
}

const editSchema = z.object({
  id: idSchema,
  pickupLocationId: idSchema,
  returnLocationId: idSchema,
  pickupAt: z.iso.datetime({ offset: true }),
  returnAt: z.iso.datetime({ offset: true }),
  vehicleModelId: idSchema,
  extras: z.array(z.object({ extraId: idSchema, quantity: z.number().int().min(1).max(10) })).max(20),
  additionalDrivers: z
    .array(
      z.object({
        fullName: z.string().trim().min(1).max(120),
        licenseNumber: z.string().trim().max(40).optional(),
        birthDate: z.string().trim().max(10).optional(),
      }),
    )
    .max(5),
  flightNumber: z.string().trim().max(20).optional(),
  preferredPaymentMethod: z.enum(['office', 'bank_transfer']),
})

export type EditReservationInput = z.input<typeof editSchema>

const sameExtras = (a: { extraId: number; quantity: number }[], b: { extraId: number; quantity: number }[]) =>
  JSON.stringify([...a].sort((x, y) => x.extraId - y.extraId)) === JSON.stringify([...b].sort((x, y) => x.extraId - y.extraId))

/**
 * Changes dates, locations, model, extras or drivers of an open reservation (incl. extending an
 * active rental). Pricing-relevant changes trigger a recalculation by the reservation hooks.
 */
export async function updateReservationAction(input: EditReservationInput): Promise<ActionResult<{ total: number; recalculated: boolean }>> {
  return runAction(async () => {
    const { payload, scoped } = await context()
    const data = editSchema.parse(input)
    if (new Date(data.returnAt) <= new Date(data.pickupAt)) throw new ServiceError('validation_error', 'Return must be after pickup')
    const current = await payload.findByID({ collection: 'reservations', id: data.id, depth: 0, ...scoped })
    if (!['pending', 'confirmed', 'active'].includes(current.status)) throw new ServiceError('rule_violation', 'Only open reservations can be changed')

    // After pickup the start of the rental is history; only the return side can move.
    const pickupLocked = current.status === 'active'
    const pickupLocationId = pickupLocked ? relationId(current.pickupLocation)! : data.pickupLocationId
    const pickupAt = pickupLocked ? current.pickupAt : data.pickupAt
    const vehicleModelId = pickupLocked ? relationId(current.vehicleModel)! : data.vehicleModelId

    const currentExtras = (current.extras ?? []).map((row) => ({ extraId: relationId(row.extra)!, quantity: row.quantity }))
    const pricingChanged =
      pickupLocationId !== relationId(current.pickupLocation) ||
      data.returnLocationId !== relationId(current.returnLocation) ||
      new Date(pickupAt).getTime() !== new Date(current.pickupAt).getTime() ||
      new Date(data.returnAt).getTime() !== new Date(current.returnAt).getTime() ||
      vehicleModelId !== relationId(current.vehicleModel) ||
      !sameExtras(currentExtras, data.extras)

    if (pricingChanged && !current.vehicle) {
      const rules = getReservationRules(await getSettings(payload))
      const units = await getAvailableUnitsByModel(payload, {
        locationId: pickupLocationId,
        window: { start: new Date(pickupAt), end: new Date(data.returnAt) },
        bufferMinutes: rules.bufferMinutes,
        vehicleModelIds: [vehicleModelId],
        excludeReservationId: current.id,
      })
      if ((units.get(vehicleModelId) ?? 0) < 1) throw new ServiceError('not_available', 'No free car of this model for these dates')
    }

    const updated = await payload.update({
      collection: 'reservations',
      id: current.id,
      data: {
        pickupLocation: pickupLocationId,
        returnLocation: data.returnLocationId,
        pickupAt,
        returnAt: data.returnAt,
        vehicleModel: vehicleModelId,
        extras: data.extras.map((row) => ({ extra: row.extraId, quantity: row.quantity })),
        additionalDrivers: data.additionalDrivers.map((driver) => ({
          fullName: driver.fullName,
          licenseNumber: driver.licenseNumber || null,
          birthDate: driver.birthDate || null,
        })),
        flightNumber: data.flightNumber || null,
        preferredPaymentMethod: data.preferredPaymentMethod,
        recalculatePrice: pricingChanged,
      },
      ...scoped,
    })
    refresh(current.id)
    return { total: updated.pricing?.total ?? 0, recalculated: pricingChanged }
  })
}
