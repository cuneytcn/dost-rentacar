import 'server-only'

import { cookies } from 'next/headers'
import { cache } from 'react'

import { CURRENCIES, type Currency, type Locale } from '@rent/shared'

import type { Faq, Page } from '@/payload-types'
import { getPayloadClient } from '@/lib/payload'
import { ServiceError } from '@/services/errors'
import {
  getPublicSettings,
  getVehicleModelBySlug,
  listExtras,
  listLocations,
  listVehicleCategories,
  listVehicleModels,
  searchAvailability,
} from '@/services/public-catalog'

import { DEFAULT_DISPLAY_CURRENCY, SITE_CURRENCY_COOKIE } from './constants'
import type { DisplayCurrency } from './format'
import { toRentalWindow, type CarSearch } from './search'

/** Read models for the public site. They call the same services as the public API, cached per request. */

export const getSiteSettings = cache(async (locale: Locale) => getPublicSettings(await getPayloadClient(), locale))

export const getLocations = cache(async (locale: Locale) => listLocations(await getPayloadClient(), locale))

export const getCategories = cache(async (locale: Locale) => listVehicleCategories(await getPayloadClient(), locale))

export const getVehicleModels = cache(async (locale: Locale, featured = false) =>
  listVehicleModels(await getPayloadClient(), locale, featured ? { featured: true } : {}),
)

export const getVehicleModel = cache(async (locale: Locale, slug: string) => {
  try {
    return await getVehicleModelBySlug(await getPayloadClient(), slug, locale)
  } catch (error) {
    if (error instanceof ServiceError && error.code === 'not_found') return null
    throw error
  }
})

export const getExtras = cache(async (locale: Locale) => listExtras(await getPayloadClient(), locale))

/**
 * The visitor's display currency: their pick (cookie) or Turkish lira, limited to the currencies the
 * business shows and has a rate for. Prices themselves stay in the base currency.
 */
export const getDisplayCurrency = cache(async (locale: Locale): Promise<DisplayCurrency> => {
  const settings = await getSiteSettings(locale)
  const wanted = (await cookies()).get(SITE_CURRENCY_COOKIE)?.value ?? DEFAULT_DISPLAY_CURRENCY
  const base: DisplayCurrency = { currency: settings.baseCurrency, rate: 1 }
  if (!wanted || !(CURRENCIES as readonly string[]).includes(wanted) || wanted === settings.baseCurrency) return base
  const currency = wanted as Currency
  const rate = settings.exchangeRates.find((entry) => entry.currency === currency)?.rate
  return settings.displayCurrencies.includes(currency) && rate ? { currency, rate } : base
})

/** Currencies offered in the switcher: the configured ones that can actually be converted. */
export async function getSelectableCurrencies(locale: Locale): Promise<Currency[]> {
  const settings = await getSiteSettings(locale)
  return settings.displayCurrencies.filter(
    (currency) => currency === settings.baseCurrency || settings.exchangeRates.some((entry) => entry.currency === currency),
  )
}

export type CarSearchResult = { ok: true; items: Awaited<ReturnType<typeof searchAvailability>> } | { ok: false; code: string; details?: unknown }

export async function searchCars(locale: Locale, search: CarSearch): Promise<CarSearchResult> {
  const locations = await getLocations(locale)
  const window = toRentalWindow(search, locations)
  if (!window) return { ok: false, code: 'not_found' }
  try {
    return { ok: true, items: await searchAvailability(await getPayloadClient(), window, locale) }
  } catch (error) {
    if (error instanceof ServiceError) return { ok: false, code: error.code, details: error.details }
    throw error
  }
}

export const getFaqs = cache(async (locale: Locale): Promise<Faq[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'faqs',
    where: { isActive: { equals: true } },
    sort: 'sortOrder',
    depth: 0,
    pagination: false,
    locale,
  })
  return docs
})

export const getPages = cache(async (locale: Locale): Promise<Pick<Page, 'id' | 'slug' | 'title'>[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'pages',
    where: { _status: { equals: 'published' } },
    sort: 'title',
    depth: 0,
    pagination: false,
    locale,
    select: { slug: true, title: true },
  })
  return docs
})

export const getPage = cache(async (locale: Locale, slug: string): Promise<Page | null> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'pages',
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    depth: 1,
    limit: 1,
    locale,
  })
  return docs[0] ?? null
})

/** Slugs of the legal pages the booking forms link to (created by staff under Content → Pages). */
export const LEGAL_PAGE_SLUGS = { terms: 'rental-terms', privacy: 'privacy-policy', cookies: 'cookie-policy' } as const
