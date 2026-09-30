import type { Payload } from 'payload'

import type {
  AvailabilityItem,
  AvailabilityQuery,
  ExtraDto,
  Locale,
  LocationDto,
  PublicSettings,
  VehicleCategoryDto,
  VehicleModelDetail,
  VehicleModelSummary,
} from '@rent/shared'

import type { Location } from '@/payload-types'

import { toOpeningHours, toRateTiers, toVehicleModelSummary } from './catalog'
import { ServiceError } from './errors'
import { getAvailableUnitsByModel } from './inventory'
import { loadQuoteEnvironment, quoteForModel } from './quote'
import { getBaseCurrency, getReservationRules, getSettings } from './settings'

/** Read models for the public API. The Local API bypasses access control, so every query filters active documents explicitly. */

export async function listLocations(payload: Payload, locale: Locale): Promise<LocationDto[]> {
  const { docs } = await payload.find({
    collection: 'locations',
    where: { isActive: { equals: true } },
    sort: 'sortOrder',
    depth: 0,
    pagination: false,
    locale,
  })
  return docs.map(toLocationDto)
}

export async function listVehicleCategories(payload: Payload, locale: Locale): Promise<VehicleCategoryDto[]> {
  const { docs } = await payload.find({
    collection: 'vehicle-categories',
    where: { isActive: { equals: true } },
    sort: 'sortOrder',
    depth: 0,
    pagination: false,
    locale,
  })
  return docs.map((category) => ({
    id: category.id,
    slug: category.slug ?? String(category.id),
    name: category.name,
    description: category.description ?? null,
  }))
}

export async function listVehicleModels(
  payload: Payload,
  locale: Locale,
  filters: { category?: string; featured?: boolean } = {},
): Promise<VehicleModelSummary[]> {
  const settings = await getSettings(payload)
  const { docs } = await payload.find({
    collection: 'vehicle-models',
    where: {
      and: [
        { isActive: { equals: true } },
        ...(filters.category ? [{ 'category.slug': { equals: filters.category } }] : []),
        ...(filters.featured ? [{ isFeatured: { equals: true } }] : []),
      ],
    },
    sort: 'sortOrder',
    depth: 1,
    pagination: false,
    locale,
  })
  return docs.map((model) => toVehicleModelSummary(model, getBaseCurrency(settings)))
}

export async function getVehicleModelBySlug(payload: Payload, slug: string, locale: Locale): Promise<VehicleModelDetail> {
  const settings = await getSettings(payload)
  const currency = getBaseCurrency(settings)
  const { docs } = await payload.find({
    collection: 'vehicle-models',
    where: { and: [{ slug: { equals: slug } }, { isActive: { equals: true } }] },
    depth: 1,
    limit: 1,
    locale,
  })
  const model = docs[0]
  if (!model) throw new ServiceError('not_found', `Vehicle model "${slug}" not found`)
  return {
    ...toVehicleModelSummary(model, currency),
    description: model.description ?? null,
    deposit: { amount: model.deposit, currency },
    extraKmFee: model.extraKmFee != null ? { amount: model.extraKmFee, currency } : null,
    rateTiers: toRateTiers(model)
      .sort((a, b) => a.minDays - b.minDays)
      .map((tier) => ({ minDays: tier.minDays, dailyRate: { amount: tier.dailyRate, currency } })),
  }
}

export async function listExtras(payload: Payload, locale: Locale): Promise<ExtraDto[]> {
  const settings = await getSettings(payload)
  const currency = getBaseCurrency(settings)
  const { docs } = await payload.find({
    collection: 'extras',
    where: { isActive: { equals: true } },
    sort: 'sortOrder',
    depth: 0,
    pagination: false,
    locale,
  })
  return docs.map((extra) => ({
    id: extra.id,
    slug: extra.slug ?? String(extra.id),
    name: extra.name,
    description: extra.description ?? null,
    pricingType: extra.pricingType,
    price: { amount: extra.price, currency },
    maxQuantity: extra.maxQuantity,
    maxChargeDays: extra.maxChargeDays ?? null,
  }))
}

export async function getPublicSettings(payload: Payload, locale: Locale): Promise<PublicSettings> {
  const [settings, rates] = await Promise.all([
    payload.findGlobal({ slug: 'settings', depth: 0, locale }),
    payload.findGlobal({ slug: 'exchange-rates', depth: 0 }),
  ])
  const rules = getReservationRules(settings)
  const baseCurrency = getBaseCurrency(settings)
  return {
    companyName: settings.companyName,
    legalName: settings.legalName ?? null,
    authorizationNumber: settings.authorizationNumber ?? null,
    taxOffice: settings.taxOffice ?? null,
    taxNumber: settings.taxNumber ?? null,
    mersisNumber: settings.mersisNumber ?? null,
    phone: settings.phone ?? null,
    whatsapp: settings.whatsapp ?? null,
    email: settings.email ?? null,
    address: settings.address ?? null,
    baseCurrency,
    displayCurrencies: settings.displayCurrencies ?? [baseCurrency],
    exchangeRates: rates.baseCurrency === baseCurrency ? (rates.rates ?? []).map(({ currency, rate }) => ({ currency, rate })) : [],
    bankAccounts: (settings.bankAccounts ?? []).map(({ bankName, accountHolder, iban, currency }) => ({
      bankName,
      accountHolder,
      iban,
      currency,
    })),
    reservationRules: {
      minLeadTimeHours: rules.minLeadTimeHours,
      minRentalDays: rules.minRentalDays,
      maxRentalDays: rules.maxRentalDays,
      maxAdvanceDays: rules.maxAdvanceDays,
      selfCancelCutoffHours: rules.selfCancelCutoffHours,
      graceMinutes: rules.graceMinutes,
    },
    cancellationPolicy: settings.cancellationPolicy ?? null,
    socialLinks: Object.fromEntries(
      Object.entries(settings.socialLinks ?? {}).filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].length > 0),
    ),
  }
}

/** Every active model with availability and a price for the requested window. */
export async function searchAvailability(
  payload: Payload,
  query: AvailabilityQuery,
  locale: Locale,
): Promise<AvailabilityItem[]> {
  const env = await loadQuoteEnvironment(payload, query, { locale })
  const { docs: models } = await payload.find({
    collection: 'vehicle-models',
    where: { isActive: { equals: true } },
    sort: 'sortOrder',
    depth: 1,
    pagination: false,
    locale,
  })
  const units = await getAvailableUnitsByModel(payload, {
    locationId: query.pickupLocationId,
    window: { start: env.pickupAt, end: env.returnAt },
    bufferMinutes: env.rules.bufferMinutes,
    vehicleModelIds: models.map((model) => model.id),
  })

  const items = models.map((model): AvailabilityItem => {
    const summary = toVehicleModelSummary(model, env.baseCurrency)
    try {
      const { quote, violations } = quoteForModel(env, model)
      const hasUnits = (units.get(model.id) ?? 0) > 0
      return {
        vehicleModel: summary,
        available: hasUnits && violations.length === 0,
        quote,
        unavailableReason: violations[0]?.code ?? (hasUnits ? null : 'sold_out'),
      }
    } catch (error) {
      if (!(error instanceof ServiceError)) throw error
      return { vehicleModel: summary, available: false, quote: null, unavailableReason: 'not_priced' }
    }
  })

  return items.sort(
    (a, b) => Number(b.available) - Number(a.available) || (a.quote?.total ?? Infinity) - (b.quote?.total ?? Infinity),
  )
}

function toLocationDto(location: Location): LocationDto {
  return {
    id: location.id,
    slug: location.slug ?? String(location.id),
    name: location.name,
    address: location.address,
    city: location.city,
    country: location.country ?? null,
    phone: location.phone,
    whatsapp: location.whatsapp ?? null,
    email: location.email ?? null,
    latitude: location.latitude ?? null,
    longitude: location.longitude ?? null,
    timeZone: location.timeZone,
    allowsPickup: location.allowsPickup ?? true,
    allowsReturn: location.allowsReturn ?? true,
    openingHours: toOpeningHours(location),
  }
}
