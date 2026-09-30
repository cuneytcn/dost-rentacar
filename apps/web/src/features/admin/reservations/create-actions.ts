'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { customerInputSchema, ID_DOCUMENT_TYPES, PREFERRED_PAYMENT_METHODS, type Quote } from '@rent/shared'

import { getPayloadClient } from '@/lib/payload'
import { populated } from '@/lib/relations'
import type { Media, VehicleCategory } from '@/payload-types'
import { ServiceError } from '@/services/errors'
import { getAvailableUnitsByModel } from '@/services/inventory'
import { loadQuoteEnvironment, quoteForModel } from '@/services/quote'
import type { RuleViolation } from '@/services/rental-rules'
import { getReservationRules, getSettings } from '@/services/settings'

import { requireStaff } from '../auth/session'
import { runAction, type ActionResult } from '../shared/action-result'

export type CustomerHit = { id: number; fullName: string; email: string; phone: string; isBlacklisted: boolean; reservations: number }

export async function searchCustomersAction(query: string): Promise<ActionResult<CustomerHit[]>> {
  return runAction(async () => {
    const user = await requireStaff()
    const payload = await getPayloadClient()
    const q = z.string().trim().min(2).max(80).parse(query)
    const { docs } = await payload.find({
      collection: 'customers',
      where: { or: [{ fullName: { like: q } }, { email: { like: q.toLowerCase() } }, { phone: { like: q } }] },
      limit: 8,
      depth: 0,
      overrideAccess: false,
      user,
    })
    const counts = await Promise.all(
      docs.map((customer) => payload.count({ collection: 'reservations', where: { customer: { equals: customer.id } }, overrideAccess: false, user })),
    )
    return docs.map((customer, index) => ({
      id: customer.id,
      fullName: customer.fullName ?? `${customer.firstName} ${customer.lastName}`,
      email: customer.email,
      phone: customer.phone,
      isBlacklisted: Boolean(customer.isBlacklisted),
      reservations: counts[index]!.totalDocs,
    }))
  })
}

const windowSchema = z
  .object({
    pickupLocationId: z.number().int().positive(),
    returnLocationId: z.number().int().positive(),
    pickupAt: z.iso.datetime({ offset: true }),
    returnAt: z.iso.datetime({ offset: true }),
    extras: z.array(z.object({ extraId: z.number().int().positive(), quantity: z.number().int().min(1).max(10) })).max(20).default([]),
  })
  .refine((value) => new Date(value.returnAt) > new Date(value.pickupAt), { path: ['returnAt'], message: 'Return must be after pickup' })

export type ModelOption = {
  id: number
  name: string
  category: string | null
  imageUrl: string | null
  availableUnits: number
  quote: Quote | null
  violations: RuleViolation['code'][]
}

/**
 * Every active model with free units and a price for the window. Customer-facing rules
 * (lead time, opening hours …) are reported as warnings; staff may still book.
 */
export async function getModelOptionsAction(input: z.input<typeof windowSchema>): Promise<ActionResult<ModelOption[]>> {
  return runAction(async () => {
    const user = await requireStaff()
    const payload = await getPayloadClient()
    const params = windowSchema.parse(input)
    const env = await loadQuoteEnvironment(payload, params)
    const { docs: models } = await payload.find({
      collection: 'vehicle-models',
      where: { isActive: { equals: true } },
      sort: 'sortOrder',
      depth: 1,
      pagination: false,
      overrideAccess: false,
      user,
    })
    const units = await getAvailableUnitsByModel(payload, {
      locationId: params.pickupLocationId,
      window: { start: env.pickupAt, end: env.returnAt },
      bufferMinutes: env.rules.bufferMinutes,
      vehicleModelIds: models.map((model) => model.id),
    })
    return models.map((model) => {
      const image = populated<Media>(model.images?.[0])
      let quote: Quote | null = null
      let violations: RuleViolation['code'][] = []
      try {
        const result = quoteForModel(env, model)
        quote = result.quote
        violations = result.violations.map((violation) => violation.code)
      } catch (error) {
        if (!(error instanceof ServiceError)) throw error
      }
      return {
        id: model.id,
        name: model.name ?? `${model.brand} ${model.model}`,
        category: populated<VehicleCategory>(model.category)?.name ?? null,
        imageUrl: image?.sizes?.thumbnail?.url ?? image?.url ?? null,
        availableUnits: units.get(model.id) ?? 0,
        quote,
        violations,
      }
    })
  })
}

const createSchema = z.object({
  customerId: z.number().int().positive().nullable(),
  newCustomer: customerInputSchema
    .extend({
      birthDate: z.iso.date().optional(),
      idDocumentType: z.enum(ID_DOCUMENT_TYPES).optional(),
    })
    .nullable(),
  vehicleModelId: z.number().int().positive(),
  window: windowSchema,
  source: z.enum(['phone', 'walk_in', 'corporate']),
  status: z.enum(['pending', 'confirmed']),
  preferredPaymentMethod: z.enum(PREFERRED_PAYMENT_METHODS),
  flightNumber: z.string().trim().max(20).optional(),
  internalNote: z.string().trim().max(2000).optional(),
  locale: z.enum(['tr', 'en', 'de', 'ru']),
})

export type CreateReservationInput = z.input<typeof createSchema>

/** Staff booking. Price is calculated by the reservation hooks; capacity is still enforced. */
export async function createReservationAction(input: CreateReservationInput): Promise<ActionResult<{ id: number }>> {
  return runAction(async () => {
    const user = await requireStaff()
    const payload = await getPayloadClient()
    const data = createSchema.parse(input)
    const scoped = { overrideAccess: false, user } as const
    if (!data.customerId && !data.newCustomer) throw new ServiceError('validation_error', 'Choose or add a customer')

    const units = await getAvailableUnitsByModel(payload, {
      locationId: data.window.pickupLocationId,
      window: { start: new Date(data.window.pickupAt), end: new Date(data.window.returnAt) },
      bufferMinutes: getReservationRules(await getSettings(payload)).bufferMinutes,
      vehicleModelIds: [data.vehicleModelId],
    })
    if ((units.get(data.vehicleModelId) ?? 0) < 1) throw new ServiceError('not_available', 'No free car of this model for these dates')

    let customerId = data.customerId
    if (!customerId && data.newCustomer) {
      const existing = await payload.find({ collection: 'customers', where: { email: { equals: data.newCustomer.email } }, limit: 1, depth: 0, ...scoped })
      customerId =
        existing.docs[0]?.id ??
        (
          await payload.create({
            collection: 'customers',
            data: { ...data.newCustomer, preferredLocale: data.locale },
            ...scoped,
          })
        ).id
    }

    const reservation = await payload.create({
      collection: 'reservations',
      data: {
        status: data.status,
        paymentStatus: 'unpaid',
        confirmedAt: data.status === 'confirmed' ? new Date().toISOString() : undefined,
        source: data.source,
        locale: data.locale,
        customer: customerId!,
        vehicleModel: data.vehicleModelId,
        pickupLocation: data.window.pickupLocationId,
        returnLocation: data.window.returnLocationId,
        pickupAt: data.window.pickupAt,
        returnAt: data.window.returnAt,
        extras: data.window.extras.map((row) => ({ extra: row.extraId, quantity: row.quantity })),
        preferredPaymentMethod: data.preferredPaymentMethod,
        flightNumber: data.flightNumber || undefined,
        internalNote: data.internalNote || undefined,
      },
      ...scoped,
    })
    revalidatePath('/admin/reservations')
    revalidatePath('/admin')
    return { id: reservation.id }
  })
}
