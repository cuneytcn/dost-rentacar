import { DEFAULT_LOCALE, DEFAULT_TIME_ZONE, LOCALES, type Locale } from '@rent/shared'

import { getPath, setPath } from '@/lib/object-path'
import { toLocalDate } from '@/services/pricing'

import { fromDateTimeLocal, toDateTimeLocal } from '@/lib/local-datetime'
import type { FieldDef, SectionDef } from './types'

/** Pure conversion between Payload documents and panel form values. */

export type UploadPreview = { id: number; url: string; thumbnailUrl: string; filename: string }
export type FormValues = Record<string, unknown>
export type UploadPreviews = { media: Map<number, UploadPreview>; documents: Map<number, UploadPreview> }

export function allFields(sections: SectionDef[]): FieldDef[] {
  return sections.flatMap((section) => section.fields)
}

function isLocalized(field: FieldDef): boolean {
  return 'localized' in field && Boolean(field.localized)
}

function idOf(value: unknown): number | null {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object' && 'id' in value) return Number((value as { id: unknown }).id)
  return null
}

function emptyValue(field: FieldDef): unknown {
  switch (field.kind) {
    case 'switch':
      return false
    case 'number':
    case 'money':
      return null
    case 'relation':
      return field.hasMany ? [] : null
    case 'multiSelect':
    case 'images':
    case 'array':
    case 'openingHours':
      return []
    case 'file':
    case 'richText':
      return null
    default:
      return ''
  }
}

function fieldToForm(field: FieldDef, raw: unknown, uploads: UploadPreviews): unknown {
  if (raw === undefined || raw === null) {
    if (field.kind === 'array' || field.kind === 'openingHours' || field.kind === 'images' || field.kind === 'multiSelect') return []
    return emptyValue(field)
  }
  switch (field.kind) {
    case 'relation':
      return field.hasMany ? (Array.isArray(raw) ? raw.map(idOf).filter((id): id is number => id !== null) : []) : idOf(raw)
    case 'images':
      return (Array.isArray(raw) ? raw : [])
        .map((item) => uploads.media.get(idOf(item) ?? -1))
        .filter((item): item is UploadPreview => Boolean(item))
    case 'file':
      return uploads.documents.get(idOf(raw) ?? -1) ?? null
    case 'date':
      return field.storage === 'text' ? String(raw) : toLocalDate(new Date(String(raw)), DEFAULT_TIME_ZONE)
    case 'datetime':
      return toDateTimeLocal(String(raw))
    case 'array':
      return (Array.isArray(raw) ? raw : []).map((row: Record<string, unknown>) => ({
        id: row.id,
        ...Object.fromEntries(field.fields.map((sub) => [sub.name, fieldToForm(sub, getPath(row, sub.name), uploads)])),
      }))
    case 'openingHours':
      return (Array.isArray(raw) ? raw : []).map((row: Record<string, unknown>) => ({ day: row.day, opensAt: row.opensAt, closesAt: row.closesAt }))
    case 'password':
      return ''
    default:
      return raw
  }
}

/** Form values for a document read with `locale: 'all'` (localized fields are `{ tr, en, … }`). */
export function docToFormValues(fields: FieldDef[], doc: Record<string, unknown> | null, uploads: UploadPreviews): FormValues {
  const values: FormValues = {}
  for (const field of fields) {
    const raw = doc ? getPath(doc, field.name) : undefined
    if (isLocalized(field)) {
      const perLocale = raw && typeof raw === 'object' && !Array.isArray(raw) && LOCALES.some((locale) => locale in raw) ? (raw as Record<string, unknown>) : {}
      setPath(values, field.name, Object.fromEntries(LOCALES.map((locale) => [locale, fieldToForm(field, perLocale[locale], uploads)])))
    } else {
      setPath(values, field.name, fieldToForm(field, raw, uploads))
    }
  }
  return values
}

/** Upload ids referenced by a document, so previews can be loaded in one query. */
export function collectUploadIds(fields: FieldDef[], doc: Record<string, unknown> | null): { media: number[]; documents: number[] } {
  const ids = { media: new Set<number>(), documents: new Set<number>() }
  const visit = (list: FieldDef[], source: unknown) => {
    for (const field of list) {
      const raw = getPath(source, field.name)
      if (field.kind === 'images' && Array.isArray(raw)) raw.forEach((item) => idOf(item) && ids.media.add(idOf(item)!))
      if (field.kind === 'file' && idOf(raw)) ids.documents.add(idOf(raw)!)
      if (field.kind === 'array' && Array.isArray(raw)) raw.forEach((row) => visit(field.fields, row))
    }
  }
  if (doc) visit(fields, doc)
  return { media: [...ids.media], documents: [...ids.documents] }
}

function formToField(field: FieldDef, value: unknown): unknown {
  switch (field.kind) {
    case 'number':
    case 'money':
      return value === '' || value === null || value === undefined || Number.isNaN(Number(value)) ? null : Number(value)
    case 'select':
      return value === '' || value === undefined ? null : value
    case 'relation':
      return field.hasMany ? (Array.isArray(value) ? value : []) : (value ?? null)
    case 'images':
      return (Array.isArray(value) ? value : []).map((item) => idOf(item)).filter((id): id is number => id !== null)
    case 'file':
      return idOf(value)
    case 'date':
      if (!value) return null
      return field.storage === 'text' ? value : `${String(value)}T12:00:00.000Z`
    case 'datetime':
      return value ? fromDateTimeLocal(String(value)) : null
    case 'array':
      return (Array.isArray(value) ? value : []).map((row: Record<string, unknown>) => {
        const out: Record<string, unknown> = row.id ? { id: row.id } : {}
        for (const sub of field.fields) setPath(out, sub.name, formToField(sub, getPath(row, sub.name)))
        return out
      })
    case 'openingHours':
      return (Array.isArray(value) ? value : []).map(({ day, opensAt, closesAt }: Record<string, unknown>) => ({ day, opensAt, closesAt }))
    case 'text':
    case 'textarea':
    case 'email':
      return typeof value === 'string' ? (field.kind === 'text' && field.uppercase ? value.trim().toUpperCase() : value.trim()) || null : (value ?? null)
    default:
      return value ?? null
  }
}

function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)
}

/**
 * Payload data for one save call. The default locale carries every editable field; other
 * locales only carry localized fields. An empty translation of a required field is left out
 * so it falls back to the default locale instead of failing validation.
 */
export function formToPayloadData(fields: FieldDef[], values: FormValues, locale: Locale): Record<string, unknown> {
  const data: Record<string, unknown> = {}
  const isDefault = locale === DEFAULT_LOCALE
  for (const field of fields) {
    if (field.readOnly) continue
    if (field.kind === 'password') {
      const password = getPath(values, field.name)
      if (isDefault && typeof password === 'string' && password) setPath(data, field.name, password)
      continue
    }
    if (isLocalized(field)) {
      const value = formToField(field, (getPath(values, field.name) as Record<string, unknown> | undefined)?.[locale])
      if (isEmpty(value) && !isDefault && field.required) continue
      setPath(data, field.name, value)
    } else if (isDefault) {
      setPath(data, field.name, formToField(field, getPath(values, field.name)))
    }
  }
  return data
}

export function hasLocalizedFields(fields: FieldDef[]): boolean {
  return fields.some(isLocalized)
}
