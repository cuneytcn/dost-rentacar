/**
 * Applies the business details in `data/company.ts` to an existing database: brand and contact
 * settings, and the first office. Placeholder values from development (example legal name, email,
 * bank account) are cleared so they never reach the live site. Run with `pnpm company-profile`.
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import { DEFAULT_LOCALE, LOCALES } from '@rent/shared'

import { COMPANY } from './data/company'

const payload = await getPayload({ config })
const settings = await payload.findGlobal({ slug: 'settings', depth: 0 })

const placeholder = (value: string | null | undefined) => Boolean(value && /örnek|example|rent a car ltd/i.test(value))
await payload.updateGlobal({
  slug: 'settings',
  data: {
    ...COMPANY.settings,
    socialLinks: { ...settings.socialLinks, ...COMPANY.settings.socialLinks },
    legalName: placeholder(settings.legalName) ? null : settings.legalName,
    email: placeholder(settings.email) ? null : settings.email,
    bankAccounts: (settings.bankAccounts ?? []).filter((account) => !placeholder(account.bankName) && !/^TR00[\s0]*$/.test(account.iban)),
  },
})

// The first office becomes the real one; other development offices are switched off (not deleted: reservations refer to them).
const { docs: offices } = await payload.find({ collection: 'locations', sort: 'sortOrder', depth: 0, pagination: false })
const [office, ...others] = offices
const { name, address, ...fields } = COMPANY.office
const data = { ...fields, isActive: true, allowsPickup: true, allowsReturn: true, sortOrder: 1, latitude: null, longitude: null, email: null }
const target = office
  ? await payload.update({ collection: 'locations', id: office.id, locale: DEFAULT_LOCALE, data: { ...data, name: name.tr, address: address.tr } })
  : await payload.create({ collection: 'locations', locale: DEFAULT_LOCALE, data: { ...data, name: name.tr, address: address.tr } })
for (const locale of LOCALES.filter((option) => option !== DEFAULT_LOCALE)) {
  await payload.update({ collection: 'locations', id: target.id, locale, data: { name: name[locale], address: address[locale] } })
}
for (const other of others) {
  await payload.update({ collection: 'locations', id: other.id, data: { isActive: false } })
  // Cars based at a switched-off office move to the real one so they stay bookable.
  const { docs: cars } = await payload.find({ collection: 'vehicles', where: { location: { equals: other.id } }, depth: 0, pagination: false })
  for (const car of cars) await payload.update({ collection: 'vehicles', id: car.id, data: { location: target.id } })
}

payload.logger.info(`Company profile applied: ${COMPANY.settings.companyName}, office #${target.id}; ${others.length} other office(s) deactivated`)
process.exit(0)
