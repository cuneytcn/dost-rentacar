'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { DEFAULT_LOCALE, LOCALES } from '@rent/shared'

import { getPayloadClient } from '@/lib/payload'
import { ServiceError } from '@/services/errors'

import { requireStaff } from '../auth/session'
import { runAction, type ActionResult } from '../shared/action-result'

const collectionSchema = z.enum(['media', 'documents'])

export async function updateLibraryTextAction(input: {
  collection: 'media' | 'documents'
  id: number
  text: Record<string, string>
  credit?: string
  creditUrl?: string
}): Promise<ActionResult> {
  return runAction(async () => {
    const user = await requireStaff()
    const payload = await getPayloadClient()
    const collection = collectionSchema.parse(input.collection)
    const id = z.number().int().positive().parse(input.id)
    if (collection === 'documents') {
      await payload.update({ collection, id, data: { description: input.text[DEFAULT_LOCALE]?.trim() || null }, overrideAccess: false, user })
    } else {
      // Alt text is required in the default locale; other locales fall back when empty.
      for (const locale of LOCALES) {
        const alt = input.text[locale]?.trim()
        if (!alt && locale !== DEFAULT_LOCALE) continue
        await payload.update({ collection, id, data: { alt: alt ?? '' }, locale, overrideAccess: false, user })
      }
      await payload.update({
        collection,
        id,
        data: { credit: input.credit?.trim() || null, creditUrl: input.creditUrl?.trim() || null },
        overrideAccess: false,
        user,
      })
    }
    revalidatePath(`/admin/${collection}`)
  })
}

export async function deleteLibraryItemAction(input: { collection: 'media' | 'documents'; id: number }): Promise<ActionResult> {
  return runAction(async () => {
    const user = await requireStaff()
    const payload = await getPayloadClient()
    const collection = collectionSchema.parse(input.collection)
    const id = z.number().int().positive().parse(input.id)
    if (collection === 'media') {
      const { totalDocs } = await payload.count({ collection: 'vehicle-models', where: { images: { contains: id } }, overrideAccess: false, user })
      if (totalDocs > 0) throw new ServiceError('conflict', 'This record is used by other records (vehicle models). Remove it there first.')
    }
    await payload.delete({ collection, id, overrideAccess: false, user }).catch((error: unknown) => {
      const code = (error as { cause?: { code?: string } })?.cause?.code
      if (code === '23503') throw new ServiceError('conflict', 'This record is used by other records (e.g. reservations). Deactivate it instead of deleting.')
      throw error
    })
    revalidatePath(`/admin/${collection}`)
  })
}
