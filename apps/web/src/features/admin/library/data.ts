import 'server-only'

import type { Where } from 'payload'

import { LOCALES, type Locale } from '@rent/shared'

import { getPayloadClient } from '@/lib/payload'

import type { SessionUser } from '../auth/session'

const PAGE_SIZE = 48

export type LibraryItem = {
  id: number
  url: string
  thumbnailUrl: string
  filename: string
  mimeType: string
  filesize: number
  width: number | null
  height: number | null
  createdAt: string
  /** media: alt text per locale; documents: description in `tr`. */
  text: Record<Locale, string>
  /** media only: photo credit and its link. */
  credit: string
  creditUrl: string
}

export type LibraryData = { items: LibraryItem[]; page: number; totalPages: number; totalDocs: number }

export async function getLibrary(user: SessionUser, collection: 'media' | 'documents', params: { q?: string; page?: string }): Promise<LibraryData> {
  const payload = await getPayloadClient()
  const q = params.q?.trim()
  const where: Where = q
    ? { or: [{ filename: { like: q } }, collection === 'media' ? { alt: { like: q } } : { description: { like: q } }] }
    : {}
  const result = await payload.find({
    collection,
    where,
    sort: '-createdAt',
    page: Math.max(1, Number(params.page) || 1),
    limit: PAGE_SIZE,
    depth: 0,
    locale: collection === 'media' ? 'all' : undefined,
    overrideAccess: false,
    user,
  })
  return {
    page: result.page ?? 1,
    totalPages: result.totalPages,
    totalDocs: result.totalDocs,
    items: result.docs.map((doc) => {
      const raw = collection === 'media' ? (doc as { alt?: unknown }).alt : (doc as { description?: unknown }).description
      const perLocale = raw && typeof raw === 'object' ? (raw as Record<string, string>) : { tr: typeof raw === 'string' ? raw : '' }
      return {
        id: doc.id,
        url: doc.url ?? '',
        thumbnailUrl: doc.sizes?.thumbnail?.url ?? doc.url ?? '',
        filename: doc.filename ?? '',
        mimeType: doc.mimeType ?? '',
        filesize: doc.filesize ?? 0,
        width: doc.width ?? null,
        height: doc.height ?? null,
        createdAt: doc.createdAt,
        text: Object.fromEntries(LOCALES.map((locale) => [locale, perLocale[locale] ?? ''])) as Record<Locale, string>,
        credit: (doc as { credit?: string | null }).credit ?? '',
        creditUrl: (doc as { creditUrl?: string | null }).creditUrl ?? '',
      }
    }),
  }
}
