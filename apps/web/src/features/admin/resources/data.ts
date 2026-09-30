import 'server-only'

import { notFound, redirect } from 'next/navigation'
import type { CollectionSlug, Where } from 'payload'

import { DEFAULT_LOCALE } from '@rent/shared'

import { isAdminUser } from '@/access'
import { getPayloadClient } from '@/lib/payload'
import { getPath, setPath } from '@/lib/object-path'
import type { Document, Media } from '@/payload-types'
import { getBaseCurrency, getSettings } from '@/services/settings'

import type { SessionUser } from '../auth/session'
import { RELATION_TITLE_FIELDS, type CollectionResource, type ColumnDef, type ColumnKind, type FieldDef, type ResourceDef } from './types'
import { allFields, collectUploadIds, docToFormValues, type FormValues, type UploadPreview, type UploadPreviews } from './values'

const PAGE_SIZE = 25

export function assertResourceAccess(resource: ResourceDef | null, user: SessionUser): asserts resource is ResourceDef {
  if (!resource) notFound()
  if (resource.adminOnly && !isAdminUser(user)) redirect('/admin')
}

export type ResourcePermissions = { create: boolean; update: boolean; delete: boolean }

/** Evaluates the collection/global access functions for this user (a `Where` result counts as allowed). */
export async function getPermissions(user: SessionUser, resource: ResourceDef): Promise<ResourcePermissions> {
  const payload = await getPayloadClient()
  const req = { user, payload } as never
  const check = async (fn: unknown) => (typeof fn === 'function' ? Boolean(await fn({ req })) : true)
  if (resource.type === 'global') {
    const access: { update?: unknown } = payload.globals.config.find((global) => global.slug === resource.slug)?.access ?? {}
    return { create: false, update: await check(access.update), delete: false }
  }
  const access = payload.collections[resource.slug].config.access
  const [create, update, remove] = await Promise.all([check(access.create), check(access.update), check(access.delete)])
  return { create: create && resource.canCreate !== false, update, delete: remove && Boolean(resource.canDelete) }
}

export type CellValue = string | number | boolean | null

export type ResourceRow = { id: number | string; href: string | null; cells: Record<string, CellValue> }

export type ResourceListData = {
  rows: ResourceRow[]
  page: number
  totalPages: number
  totalDocs: number
  currency: string
  sort: string
  activeTab: 'all' | 'active' | 'inactive'
  permissions: ResourcePermissions
}

function relationLabel(value: unknown, relationTo?: CollectionSlug): string | null {
  const title = (item: unknown) => {
    if (!item || typeof item !== 'object') return null
    const field = relationTo ? RELATION_TITLE_FIELDS[relationTo] : undefined
    const record = item as Record<string, unknown>
    return String(record[field ?? ''] ?? record.name ?? record.title ?? record.code ?? record.plate ?? record.id ?? '')
  }
  if (Array.isArray(value)) return value.map(title).filter(Boolean).join(', ') || null
  return title(value)
}

function cellValue(doc: Record<string, unknown>, column: { path: string; kind: ColumnKind; aggregate?: { min: string } }): CellValue {
  const raw = getPath(doc, column.path)
  if (column.aggregate && Array.isArray(raw)) {
    const numbers = raw.map((row) => Number(getPath(row, column.aggregate!.min))).filter((value) => !Number.isNaN(value))
    return numbers.length ? Math.min(...numbers) : null
  }
  switch (column.kind) {
    case 'relation':
      return relationLabel(raw)
    case 'image': {
      const first = (Array.isArray(raw) ? raw[0] : raw) as Media | undefined
      return first && typeof first === 'object' ? (first.sizes?.thumbnail?.url ?? first.url ?? null) : null
    }
    default:
      return raw === undefined ? null : (raw as CellValue)
  }
}

export async function getResourceList(
  user: SessionUser,
  resource: CollectionResource,
  params: Record<string, string | undefined>,
): Promise<ResourceListData> {
  const payload = await getPayloadClient()
  const scoped = { overrideAccess: false, user } as const
  const where: Where[] = []
  const q = params.q?.trim()
  if (q && resource.list.searchFields.length) where.push({ or: resource.list.searchFields.map((field) => ({ [field]: { like: q } })) })
  for (const filter of resource.list.filters ?? []) {
    const value = params[filter.name]
    if (value && filter.options.some((option) => option.value === value)) where.push({ [filter.name]: { equals: value } })
  }
  const activeTab = params.active === 'active' || params.active === 'inactive' ? params.active : 'all'
  if (resource.list.activeTabs && activeTab !== 'all') where.push({ isActive: { equals: activeTab === 'active' } })

  const sortField = params.sort?.replace(/^-/, '')
  const sortable = resource.list.columns.map((column) => column.path)
  const sort = sortField && sortable.includes(sortField) ? params.sort! : resource.list.defaultSort

  const [result, settings, permissions] = await Promise.all([
    payload.find({
      collection: resource.slug,
      where: { and: where },
      sort,
      page: Math.max(1, Number(params.page) || 1),
      limit: PAGE_SIZE,
      depth: 1,
      locale: DEFAULT_LOCALE,
      ...scoped,
    }),
    getSettings(payload),
    getPermissions(user, resource),
  ])

  const columns: ColumnDef[] = resource.list.columns
  return {
    activeTab,
    sort,
    permissions,
    page: result.page ?? 1,
    totalPages: result.totalPages,
    totalDocs: result.totalDocs,
    currency: getBaseCurrency(settings),
    rows: result.docs.map((doc) => {
      const record = doc as unknown as Record<string, unknown>
      const cells: Record<string, CellValue> = {}
      for (const column of columns) {
        cells[column.path] = cellValue(record, column)
        if (column.secondary) cells[`${column.path}__secondary`] = cellValue(record, column.secondary)
      }
      const link = resource.list.rowLink
      const linkedId = link ? getPath(record, link.field) : null
      const linkedKey = linkedId && typeof linkedId === 'object' ? (linkedId as { id: unknown }).id : linkedId
      return {
        id: doc.id,
        href: link ? (linkedKey ? `${link.base}/${linkedKey}` : null) : `/admin/${resource.path}/${doc.id}`,
        cells,
      }
    }),
  }
}

export type RelationOptions = Record<string, { value: number; label: string }[]>

function relationFields(fields: FieldDef[]): Extract<FieldDef, { kind: 'relation' }>[] {
  return fields.flatMap((field) => (field.kind === 'relation' ? [field] : field.kind === 'array' ? relationFields(field.fields) : []))
}

async function loadRelationOptions(user: SessionUser, fields: FieldDef[]): Promise<RelationOptions> {
  const payload = await getPayloadClient()
  const slugs = [...new Set(relationFields(fields).map((field) => field.relationTo))]
  const entries = await Promise.all(
    slugs.map(async (slug) => {
      const titleField = RELATION_TITLE_FIELDS[slug] ?? 'id'
      const { docs } = await payload.find({
        collection: slug,
        sort: slug === 'reservations' ? '-createdAt' : titleField,
        limit: slug === 'reservations' ? 300 : 500,
        depth: 0,
        locale: DEFAULT_LOCALE,
        overrideAccess: false,
        user,
      })
      return [slug, docs.map((doc) => ({ value: doc.id as number, label: String((doc as unknown as Record<string, unknown>)[titleField] ?? doc.id) }))] as const
    }),
  )
  return Object.fromEntries(entries)
}

async function loadUploadPreviews(user: SessionUser, ids: { media: number[]; documents: number[] }): Promise<UploadPreviews> {
  const payload = await getPayloadClient()
  const toPreview = (doc: Media | Document): UploadPreview => ({
    id: doc.id,
    url: doc.url ?? '',
    thumbnailUrl: doc.sizes?.thumbnail?.url ?? doc.url ?? '',
    filename: doc.filename ?? '',
  })
  const [media, documents] = await Promise.all([
    ids.media.length
      ? payload.find({ collection: 'media', where: { id: { in: ids.media } }, depth: 0, pagination: false, overrideAccess: false, user })
      : { docs: [] as Media[] },
    ids.documents.length
      ? payload.find({ collection: 'documents', where: { id: { in: ids.documents } }, depth: 0, pagination: false, overrideAccess: false, user })
      : { docs: [] as Document[] },
  ])
  return {
    media: new Map(media.docs.map((doc) => [doc.id, toPreview(doc)])),
    documents: new Map(documents.docs.map((doc) => [doc.id, toPreview(doc)])),
  }
}

type PayloadFieldLike = { name?: string; type: string; defaultValue?: unknown; fields?: PayloadFieldLike[]; tabs?: { name?: string; fields: PayloadFieldLike[] }[] }

/** Default values declared in the Payload collection config, keyed by dotted path (rows/tabs/collapsibles are transparent). */
function payloadDefaults(fields: PayloadFieldLike[], prefix = ''): Record<string, unknown> {
  const defaults: Record<string, unknown> = {}
  for (const field of fields) {
    if (field.type === 'tabs') {
      for (const tab of field.tabs ?? []) Object.assign(defaults, payloadDefaults(tab.fields, tab.name ? `${prefix}${tab.name}.` : prefix))
    } else if (field.type === 'group' && field.name) {
      Object.assign(defaults, payloadDefaults(field.fields ?? [], `${prefix}${field.name}.`))
    } else if (!field.name && field.fields) {
      Object.assign(defaults, payloadDefaults(field.fields, prefix))
    } else if (field.name && field.defaultValue !== undefined && typeof field.defaultValue !== 'function') {
      defaults[`${prefix}${field.name}`] = field.defaultValue
    }
  }
  return defaults
}

export type ResourceFormData = {
  id: number | string | null
  title: string | null
  values: FormValues
  relationOptions: RelationOptions
  currency: string
  updatedAt: string | null
  permissions: ResourcePermissions
}

/** Form data for a collection document (`id`), a new document (`id` null) or a global. */
export async function getResourceForm(
  user: SessionUser,
  resource: ResourceDef,
  id: number | null,
  prefill: Record<string, string | undefined> = {},
): Promise<ResourceFormData> {
  const payload = await getPayloadClient()
  const scoped = { overrideAccess: false, user } as const
  const fields = allFields(resource.form.sections)

  let doc: Record<string, unknown> | null = null
  if (resource.type === 'global') {
    doc = (await payload.findGlobal({ slug: resource.slug, depth: 0, locale: 'all', ...scoped })) as unknown as Record<string, unknown>
  } else if (id !== null) {
    doc = (await payload.findByID({ collection: resource.slug, id, depth: 0, locale: 'all', ...scoped }).catch(() => null)) as Record<string, unknown> | null
    if (!doc) notFound()
  } else {
    // New document: start from the collection's declared defaults.
    doc = {}
    const defaults = payloadDefaults(payload.collections[resource.slug].config.fields as unknown as PayloadFieldLike[])
    for (const [path, value] of Object.entries(defaults)) setPath(doc, path, value)
    for (const field of fields) if (field.defaultValue !== undefined) setPath(doc, field.name, field.defaultValue)
    // Values passed in the URL (e.g. ?reservation=12&vehicle=3 from a reservation) for simple fields only.
    for (const field of fields) {
      const value = prefill[field.name]
      if (!value) continue
      if (field.kind === 'relation' && !field.hasMany && Number.isInteger(Number(value))) setPath(doc, field.name, Number(value))
      if (field.kind === 'select' && field.options.some((option) => option.value === value)) setPath(doc, field.name, value)
      if (field.kind === 'text') setPath(doc, field.name, value)
    }
    doc.updatedAt = null
  }

  const [previews, relationOptions, settings, permissions] = await Promise.all([
    loadUploadPreviews(user, collectUploadIds(fields, doc)),
    loadRelationOptions(user, fields),
    getSettings(payload),
    getPermissions(user, resource),
  ])

  const titleSource = resource.type === 'collection' && id !== null && doc ? getPath(doc, resource.titleField) : null
  const title =
    titleSource && typeof titleSource === 'object' ? String((titleSource as Record<string, unknown>)[DEFAULT_LOCALE] ?? '') : titleSource != null ? String(titleSource) : null

  return {
    id: resource.type === 'global' ? null : id,
    title,
    values: docToFormValues(fields, doc, previews),
    relationOptions,
    currency: getBaseCurrency(settings),
    updatedAt: doc?.updatedAt ? String(doc.updatedAt) : null,
    permissions,
  }
}
