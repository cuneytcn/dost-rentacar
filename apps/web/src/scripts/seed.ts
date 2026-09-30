/**
 * Development seed data. Idempotent: does nothing if locations already exist.
 * Run with `pnpm seed`, then `pnpm seed:legal`, `pnpm seed:faqs` and `pnpm vehicle-photos`. Admin credentials come from
 * SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD.
 */
import { randomBytes } from 'crypto'
import config from '@payload-config'
import { getPayload } from 'payload'

import { COMPANY } from './data/company'

const payload = await getPayload({ config })

const existing = await payload.count({ collection: 'locations' })
if (existing.totalDocs > 0) {
  payload.logger.info('Seed skipped: data already exists')
  process.exit(0)
}

const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com'
const adminPassword = process.env.SEED_ADMIN_PASSWORD || randomBytes(9).toString('base64url')

await payload.create({
  collection: 'users',
  data: { name: 'Admin', email: adminEmail, password: adminPassword, role: 'admin' },
})

await payload.updateGlobal({
  slug: 'settings',
  data: {
    ...COMPANY.settings,
    baseCurrency: 'TRY',
    displayCurrencies: ['TRY', 'EUR', 'USD', 'GBP'],
  },
})

await payload.updateGlobal({
  slug: 'exchange-rates',
  data: {
    baseCurrency: 'TRY',
    rates: [
      { currency: 'EUR', rate: 0.0206186 },
      { currency: 'USD', rate: 0.0241237 },
      { currency: 'GBP', rate: 0.0179381 },
    ],
    source: 'seed',
    fetchedAt: new Date().toISOString(),
  },
})

type Localized = { tr: string; en: string; de: string; ru: string }

/** Creates a document in the default locale, then fills the other locales. */
async function createLocalized<T extends { id: number }>(
  collection: 'locations' | 'vehicle-categories' | 'extras',
  base: Record<string, unknown>,
  localized: Record<string, Localized>,
): Promise<T> {
  const pick = (locale: keyof Localized) => Object.fromEntries(Object.entries(localized).map(([key, value]) => [key, value[locale]]))
  const doc = (await payload.create({ collection, data: { ...base, ...pick('tr') } as never, locale: 'tr' })) as unknown as T
  for (const locale of ['en', 'de', 'ru'] as const) {
    await payload.update({ collection, id: doc.id, data: pick(locale) as never, locale })
  }
  return doc
}

const { name: officeName, address: officeAddress, ...officeFields } = COMPANY.office
const center = await createLocalized<{ id: number }>('locations', { ...officeFields, sortOrder: 1 }, { name: officeName, address: officeAddress })


const categories = {
  economy: await createLocalized<{ id: number }>('vehicle-categories', { slug: 'economy', sortOrder: 1 }, {
    name: { tr: 'Ekonomik', en: 'Economy', de: 'Economy', ru: 'Эконом' },
  }),
  compact: await createLocalized<{ id: number }>('vehicle-categories', { slug: 'compact', sortOrder: 2 }, {
    name: { tr: 'Orta sınıf', en: 'Compact', de: 'Kompaktklasse', ru: 'Компакт' },
  }),
  suv: await createLocalized<{ id: number }>('vehicle-categories', { slug: 'suv', sortOrder: 3 }, {
    name: { tr: 'SUV', en: 'SUV', de: 'SUV', ru: 'Внедорожник' },
  }),
}

const models = [
  { brand: 'Fiat', model: 'Egea', category: categories.economy.id, transmission: 'manual', fuelType: 'diesel', seats: 5, doors: 4, largeBags: 2, smallBags: 1, deposit: 750000, dailyKmLimit: 300, extraKmFee: 1000, rates: [170000, 155000, 135000], plates: ['07 ABC 101', '07 ABC 102', '07 ABC 103'] },
  { brand: 'Renault', model: 'Clio', category: categories.economy.id, transmission: 'automatic', fuelType: 'petrol', seats: 5, doors: 5, largeBags: 1, smallBags: 1, deposit: 750000, dailyKmLimit: 300, extraKmFee: 1000, rates: [195000, 180000, 160000], plates: ['07 ABC 201', '07 ABC 202'] },
  { brand: 'Toyota', model: 'Corolla', category: categories.compact.id, transmission: 'automatic', fuelType: 'hybrid', seats: 5, doors: 4, largeBags: 2, smallBags: 2, deposit: 950000, dailyKmLimit: null, extraKmFee: null, rates: [270000, 245000, 220000], plates: ['07 ABC 301', '07 ABC 302'] },
  { brand: 'Peugeot', model: '3008', category: categories.suv.id, transmission: 'automatic', fuelType: 'diesel', seats: 5, doors: 5, largeBags: 3, smallBags: 2, deposit: 1450000, dailyKmLimit: null, extraKmFee: null, rates: [365000, 340000, 300000], plates: ['07 ABC 401'] },
] as const

for (const [index, spec] of models.entries()) {
  const model = await payload.create({
    collection: 'vehicle-models',
    locale: 'tr',
    data: {
      brand: spec.brand,
      model: spec.model,
      category: spec.category,
      transmission: spec.transmission,
      fuelType: spec.fuelType,
      seats: spec.seats,
      doors: spec.doors,
      largeBags: spec.largeBags,
      smallBags: spec.smallBags,
      features: ['air_conditioning', 'bluetooth', 'usb'],
      minDriverAge: spec.category === categories.suv.id ? 25 : 21,
      minLicenseYears: spec.category === categories.suv.id ? 3 : 2,
      deposit: spec.deposit,
      dailyKmLimit: spec.dailyKmLimit,
      extraKmFee: spec.extraKmFee,
      isFeatured: index < 3,
      sortOrder: index,
      rateTiers: [
        { minDays: 1, dailyRate: spec.rates[0] },
        { minDays: 3, dailyRate: spec.rates[1] },
        { minDays: 7, dailyRate: spec.rates[2] },
      ],
    },
  })
  for (const plate of spec.plates) {
    await payload.create({
      collection: 'vehicles',
      data: { plate, vehicleModel: model.id, location: center.id, year: 2025, status: 'active' },
    })
  }
}

await createLocalized('extras', { slug: 'child-seat', pricingType: 'per_day', price: 25000, maxQuantity: 2, maxChargeDays: 10, sortOrder: 1 }, {
  name: { tr: 'Çocuk koltuğu', en: 'Child seat', de: 'Kindersitz', ru: 'Детское кресло' },
})
await createLocalized('extras', { slug: 'additional-driver', pricingType: 'per_rental', price: 95000, maxQuantity: 2, sortOrder: 2 }, {
  name: { tr: 'Ek sürücü', en: 'Additional driver', de: 'Zusatzfahrer', ru: 'Дополнительный водитель' },
})
await createLocalized('extras', { slug: 'full-coverage', pricingType: 'per_day', price: 60000, maxQuantity: 1, sortOrder: 3 }, {
  name: { tr: 'Tam kasko (muafiyetsiz)', en: 'Full coverage (no excess)', de: 'Vollkasko ohne Selbstbeteiligung', ru: 'Полное страхование без франшизы' },
})

const year = new Date().getFullYear() + (new Date().getMonth() > 7 ? 1 : 0)
await payload.create({
  collection: 'seasons',
  data: { name: `Summer ${year}`, startDate: `${year}-06-15`, endDate: `${year}-09-15`, adjustmentPercent: 35, priority: 1, minRentalDays: 3 },
})

payload.logger.info(`Seed complete. Admin login: ${adminEmail} / ${adminPassword}`)
process.exit(0)
