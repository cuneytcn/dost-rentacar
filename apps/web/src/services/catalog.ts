import type { Payload, PayloadRequest } from 'payload'

import type { Currency, Locale, VehicleModelSummary } from '@rent/shared'

import { populated } from '@/lib/relations'
import type { Location, Media, VehicleCategory, VehicleModel } from '@/payload-types'

import { ServiceError } from './errors'
import { lowestDailyRate, type ExtraRule, type RateTier, type SeasonRule } from './pricing'
import type { OpeningHours } from './rental-rules'

type Ctx = { req?: Partial<PayloadRequest>; locale?: Locale }

export async function getActiveVehicleModel(payload: Payload, id: number, ctx: Ctx = {}): Promise<VehicleModel> {
  const model = await payload
    .findByID({ collection: 'vehicle-models', id, depth: 1, locale: ctx.locale, req: ctx.req })
    .catch(() => null)
  if (!model || !model.isActive) throw new ServiceError('not_found', `Vehicle model ${id} not found`)
  return model
}

export async function getActiveLocation(payload: Payload, id: number, ctx: Ctx = {}): Promise<Location> {
  const location = await payload
    .findByID({ collection: 'locations', id, depth: 0, locale: ctx.locale, req: ctx.req })
    .catch(() => null)
  if (!location || !location.isActive) throw new ServiceError('not_found', `Location ${id} not found`)
  return location
}

export function toOpeningHours(location: Location): OpeningHours {
  return (location.openingHours ?? []).map(({ day, opensAt, closesAt }) => ({ day, opensAt, closesAt }))
}

export function toRateTiers(model: VehicleModel): RateTier[] {
  return (model.rateTiers ?? []).map(({ minDays, dailyRate }) => ({ minDays, dailyRate }))
}

/** Active seasons that overlap the given local date range. */
export async function getSeasons(payload: Payload, fromDate: string, toDate: string, ctx: Ctx = {}): Promise<SeasonRule[]> {
  const { docs } = await payload.find({
    collection: 'seasons',
    where: {
      and: [{ isActive: { equals: true } }, { startDate: { less_than_equal: toDate } }, { endDate: { greater_than_equal: fromDate } }],
    },
    depth: 0,
    limit: 200,
    pagination: false,
    req: ctx.req,
  })
  return docs.map((season) => ({
    id: season.id,
    startDate: season.startDate,
    endDate: season.endDate,
    adjustmentPercent: season.adjustmentPercent,
    priority: season.priority,
    minRentalDays: season.minRentalDays ?? null,
    categoryIds: (season.vehicleCategories ?? []).map((category) => (typeof category === 'object' ? category.id : category)),
  }))
}

export async function getExtraRules(payload: Payload, ids: number[], ctx: Ctx = {}): Promise<Map<number, ExtraRule>> {
  if (ids.length === 0) return new Map()
  const { docs } = await payload.find({
    collection: 'extras',
    where: { and: [{ id: { in: ids } }, { isActive: { equals: true } }] },
    depth: 0,
    limit: ids.length,
    pagination: false,
    locale: ctx.locale,
    req: ctx.req,
  })
  const found = new Map(
    docs.map((extra) => [
      extra.id,
      {
        id: extra.id,
        name: extra.name,
        pricingType: extra.pricingType,
        price: extra.price,
        maxQuantity: extra.maxQuantity,
        maxChargeDays: extra.maxChargeDays ?? null,
      } satisfies ExtraRule,
    ]),
  )
  const missing = ids.filter((id) => !found.has(id))
  if (missing.length) throw new ServiceError('validation_error', `Unknown extras: ${missing.join(', ')}`, { missing })
  return found
}

export async function getTransferFee(
  payload: Payload,
  fromLocationId: number,
  toLocationId: number,
  ctx: Ctx = {},
): Promise<number> {
  if (fromLocationId === toLocationId) return 0
  const { docs } = await payload.find({
    collection: 'transfer-fees',
    where: {
      or: [
        { and: [{ fromLocation: { equals: fromLocationId } }, { toLocation: { equals: toLocationId } }] },
        {
          and: [
            { fromLocation: { equals: toLocationId } },
            { toLocation: { equals: fromLocationId } },
            { bidirectional: { equals: true } },
          ],
        },
      ],
    },
    depth: 0,
    limit: 2,
    req: ctx.req,
  })
  // A direct rule wins over the reverse bidirectional one.
  const direct = docs.find((fee) => fee.fromLocation === fromLocationId || populated(fee.fromLocation)?.id === fromLocationId)
  return (direct ?? docs[0])?.fee ?? 0
}

export function toVehicleModelSummary(model: VehicleModel, currency: Currency): VehicleModelSummary {
  const category = populated<VehicleCategory>(model.category)
  const images = (model.images ?? []).map((image) => populated<Media>(image)).filter((image): image is Media => Boolean(image))
  const photos = images.flatMap((image) => {
    const url = image.sizes?.card?.url ?? image.url
    return url ? [{ url, credit: image.credit ? { text: image.credit, url: image.creditUrl ?? null } : null }] : []
  })
  return {
    id: model.id,
    slug: model.slug ?? String(model.id),
    name: model.name ?? `${model.brand} ${model.model}`,
    brand: model.brand,
    category: category ? { id: category.id, slug: category.slug ?? '', name: category.name } : null,
    transmission: model.transmission,
    fuelType: model.fuelType,
    seats: model.seats,
    doors: model.doors,
    largeBags: model.largeBags,
    smallBags: model.smallBags,
    features: model.features ?? [],
    imageUrls: photos.map((photo) => photo.url),
    imageCredits: photos.map((photo) => photo.credit),
    minDriverAge: model.minDriverAge,
    minLicenseYears: model.minLicenseYears,
    dailyKmLimit: model.dailyKmLimit ?? null,
    fromDailyRate: { amount: lowestDailyRate(toRateTiers(model)), currency },
  }
}
