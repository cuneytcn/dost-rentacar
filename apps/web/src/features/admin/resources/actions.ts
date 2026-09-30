'use server'

import { revalidatePath } from 'next/cache'
import type { PayloadRequest } from 'payload'
import { z } from 'zod'

import { DEFAULT_LOCALE, LOCALES } from '@rent/shared'

import { isAdminUser } from '@/access'
import { withTransaction } from '@/lib/db'
import { getPayloadClient } from '@/lib/payload'
import { ServiceError } from '@/services/errors'

import { requireStaff } from '../auth/session'
import { runAction, type ActionResult } from '../shared/action-result'
import { getResource } from './registry'
import type { ResourceDef } from './types'
import { allFields, formToPayloadData, hasLocalizedFields, type FormValues, type UploadPreview } from './values'

async function resolve(path: string) {
  const user = await requireStaff()
  const resource = getResource(z.string().min(1).max(64).parse(path))
  if (!resource) throw new ServiceError('not_found', 'Unknown screen')
  if (resource.adminOnly && !isAdminUser(user)) throw new ServiceError('not_found', 'Unknown screen')
  return { user, resource }
}

function refresh(resource: ResourceDef, id?: number | string) {
  revalidatePath(`/admin/${resource.path}`)
  if (id) revalidatePath(`/admin/${resource.path}/${id}`)
}

/** Maps database constraint errors to messages staff can act on. */
function friendlyDatabaseError(error: unknown): never {
  const code = typeof error === 'object' && error && 'cause' in error ? (error.cause as { code?: string })?.code : (error as { code?: string })?.code
  if (code === '23503' || code === '23502') {
    throw new ServiceError('conflict', 'This record is used by other records (e.g. reservations). Deactivate it instead of deleting.')
  }
  if (code === '23505') throw new ServiceError('conflict', 'A record with the same unique value already exists.')
  throw error
}

export async function saveResourceAction(input: { path: string; id: number | null; values: FormValues }): Promise<ActionResult<{ id: number | null }>> {
  return runAction(async () => {
    const { user, resource } = await resolve(input.path)
    const payload = await getPayloadClient()
    const fields = allFields(resource.form.sections)
    const otherLocales = hasLocalizedFields(fields) ? LOCALES.filter((locale) => locale !== DEFAULT_LOCALE) : []

    const id = await withTransaction(payload, async (req) => {
      const options = { overrideAccess: false, user, req: req as Partial<PayloadRequest> } as const
      const base = formToPayloadData(fields, input.values, DEFAULT_LOCALE)

      if (resource.type === 'global') {
        await payload.updateGlobal({ slug: resource.slug, data: base as never, locale: DEFAULT_LOCALE, ...options })
        for (const locale of otherLocales) {
          await payload.updateGlobal({ slug: resource.slug, data: formToPayloadData(fields, input.values, locale) as never, locale, ...options })
        }
        return null
      }

      if (input.id === null && resource.canCreate === false) throw new ServiceError('validation_error', 'Records of this type cannot be created here')
      const doc =
        input.id === null
          ? await payload.create({ collection: resource.slug, data: base as never, locale: DEFAULT_LOCALE, ...options }).catch(friendlyDatabaseError)
          : await payload.update({ collection: resource.slug, id: input.id, data: base as never, locale: DEFAULT_LOCALE, ...options }).catch(friendlyDatabaseError)
      for (const locale of otherLocales) {
        const data = formToPayloadData(fields, input.values, locale)
        // Versioned collections: every locale save must carry the publish status, or it would revert to draft.
        if ('_status' in base) data._status = base._status
        if (Object.keys(data).length) await payload.update({ collection: resource.slug, id: doc.id, data: data as never, locale, ...options })
      }
      return doc.id as number
    })

    refresh(resource, id ?? undefined)
    return { id }
  })
}

export async function deleteResourceAction(input: { path: string; id: number }): Promise<ActionResult> {
  return runAction(async () => {
    const { user, resource } = await resolve(input.path)
    if (resource.type !== 'collection' || !resource.canDelete) throw new ServiceError('validation_error', 'Records of this type cannot be deleted')
    const payload = await getPayloadClient()
    await payload.delete({ collection: resource.slug, id: z.number().int().positive().parse(input.id), overrideAccess: false, user }).catch(friendlyDatabaseError)
    refresh(resource)
  })
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

/** Uploads an image to `media` (public) or a file to `documents` (private). */
export async function uploadFileAction(formData: FormData): Promise<ActionResult<UploadPreview>> {
  return runAction(async () => {
    const user = await requireStaff()
    const payload = await getPayloadClient()
    const collection = z.enum(['media', 'documents']).parse(formData.get('collection'))
    const file = formData.get('file')
    if (!(file instanceof File) || file.size === 0) throw new ServiceError('validation_error', 'Choose a file')
    if (file.size > MAX_UPLOAD_BYTES) throw new ServiceError('validation_error', 'File is larger than 10 MB')
    const allowed = collection === 'media' ? file.type.startsWith('image/') : file.type.startsWith('image/') || file.type === 'application/pdf'
    if (!allowed) throw new ServiceError('validation_error', collection === 'media' ? 'Only images are allowed' : 'Only images and PDFs are allowed')

    const label = String(formData.get('label') || file.name).slice(0, 200)
    const data = collection === 'media' ? { alt: label } : { description: label }
    const doc = await payload.create({
      collection,
      data,
      file: { data: Buffer.from(await file.arrayBuffer()), mimetype: file.type, name: file.name || 'upload', size: file.size },
      locale: DEFAULT_LOCALE,
      overrideAccess: false,
      user,
    })
    return {
      id: doc.id,
      url: doc.url ?? '',
      thumbnailUrl: doc.sizes?.thumbnail?.url ?? doc.url ?? '',
      filename: doc.filename ?? file.name,
    }
  })
}
