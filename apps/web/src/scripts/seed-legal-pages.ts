/**
 * Creates the legal pages (rental terms, privacy notice, cookie policy) in every site language.
 * Existing pages are left alone so staff edits survive; set SEED_FORCE=1 to overwrite them
 * (`payload run` does not forward CLI flags). Run with `pnpm seed:legal` or `SEED_FORCE=1 pnpm seed:legal`.
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import { DEFAULT_LOCALE, LOCALES } from '@rent/shared'

import { cookiePolicy } from './legal/cookie-policy'
import { privacyPolicy } from './legal/privacy-policy'
import { rentalTerms } from './legal/rental-terms'
import { markdownToLexical } from './lib/markdown-to-lexical'

const force = process.env.SEED_FORCE === '1'
const payload = await getPayload({ config })

for (const page of [rentalTerms, privacyPolicy, cookiePolicy]) {
  const localized = (locale: (typeof LOCALES)[number]) => ({
    title: page[locale].title,
    content: markdownToLexical(page[locale].body),
    seo: { title: page[locale].title, description: page[locale].description },
    _status: 'published' as const,
  })

  const { docs } = await payload.find({ collection: 'pages', where: { slug: { equals: page.slug } }, limit: 1, depth: 0 })
  const existing = docs[0]
  if (existing && !force) {
    payload.logger.info(`Skipped ${page.slug}: already exists (set SEED_FORCE=1 to overwrite)`)
    continue
  }

  const doc = existing
    ? await payload.update({ collection: 'pages', id: existing.id, locale: DEFAULT_LOCALE, data: localized(DEFAULT_LOCALE) as never })
    : await payload.create({ collection: 'pages', locale: DEFAULT_LOCALE, data: { slug: page.slug, ...localized(DEFAULT_LOCALE) } as never })
  for (const locale of LOCALES.filter((option) => option !== DEFAULT_LOCALE)) {
    await payload.update({ collection: 'pages', id: doc.id, locale, data: localized(locale) as never })
  }
  payload.logger.info(`${existing ? 'Updated' : 'Created'} ${page.slug}`)
}

process.exit(0)
