/**
 * Creates or updates the FAQ entries in `data/faqs.ts` in every site language, matched by the
 * Turkish question. Entries staff added themselves are left untouched. Run with `pnpm seed:faqs`.
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import { DEFAULT_LOCALE, LOCALES } from '@rent/shared'

import { FAQS } from './data/faqs'
import { markdownToLexical } from './lib/markdown-to-lexical'

const payload = await getPayload({ config })
let created = 0
let updated = 0

for (const [index, entry] of FAQS.entries()) {
  const { docs } = await payload.find({ collection: 'faqs', where: { question: { equals: entry[DEFAULT_LOCALE].q } }, locale: DEFAULT_LOCALE, limit: 1, depth: 0 })
  const base = { category: entry.category, sortOrder: index + 1, isActive: true }
  const localized = (locale: (typeof LOCALES)[number]) => ({ question: entry[locale].q, answer: markdownToLexical(entry[locale].a) })
  const doc = docs[0]
    ? await payload.update({ collection: 'faqs', id: docs[0].id, locale: DEFAULT_LOCALE, data: { ...base, ...localized(DEFAULT_LOCALE) } as never })
    : await payload.create({ collection: 'faqs', locale: DEFAULT_LOCALE, data: { ...base, ...localized(DEFAULT_LOCALE) } as never })
  for (const locale of LOCALES.filter((option) => option !== DEFAULT_LOCALE)) {
    await payload.update({ collection: 'faqs', id: doc.id, locale, data: localized(locale) as never })
  }
  if (docs[0]) updated++
  else created++
}

payload.logger.info(`FAQs: ${created} created, ${updated} updated`)
process.exit(0)
