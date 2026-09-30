import { describe, expect, it } from 'vitest'

import { text } from '@/i18n/admin'

import type { FieldDef } from './types'
import { collectUploadIds, docToFormValues, formToPayloadData, type UploadPreview, type UploadPreviews } from './values'

const label = text('x', 'x')
const fields: FieldDef[] = [
  { kind: 'text', name: 'name', label, localized: true, required: true },
  { kind: 'textarea', name: 'seo.description', label, localized: true },
  { kind: 'text', name: 'plate', label, uppercase: true },
  { kind: 'money', name: 'deposit', label },
  { kind: 'relation', name: 'category', label, relationTo: 'vehicle-categories' },
  { kind: 'relation', name: 'tags', label, relationTo: 'vehicle-categories', hasMany: true },
  { kind: 'images', name: 'images', label, relationTo: 'media' },
  { kind: 'date', name: 'inspectionExpiresAt', label, storage: 'timestamp' },
  { kind: 'date', name: 'startDate', label, storage: 'text' },
  { kind: 'datetime', name: 'startsAt', label },
  { kind: 'switch', name: 'isActive', label },
  { kind: 'text', name: 'source', label, readOnly: true },
  { kind: 'password', name: 'password', label },
  {
    kind: 'array',
    name: 'rateTiers',
    label,
    addLabel: label,
    fields: [
      { kind: 'number', name: 'minDays', label },
      { kind: 'money', name: 'dailyRate', label },
    ],
  },
]

const preview: UploadPreview = { id: 7, url: '/a.jpg', thumbnailUrl: '/a-t.jpg', filename: 'a.jpg' }
const uploads: UploadPreviews = { media: new Map([[7, preview]]), documents: new Map() }

const doc = {
  name: { tr: 'Merkez', en: 'Center' },
  seo: { description: { tr: 'Açıklama' } },
  plate: '07 ABC 1',
  deposit: 15000,
  category: 3,
  tags: [1, 2],
  images: [7, 99],
  inspectionExpiresAt: '2026-10-07T12:00:00.000Z',
  startDate: '2026-06-15',
  startsAt: '2026-10-22T08:00:00.000Z',
  isActive: true,
  source: 'xe.com',
  rateTiers: [{ id: 'row1', minDays: 1, dailyRate: 3500 }],
}

describe('docToFormValues', () => {
  it('converts a locale:all document into form values', () => {
    const values = docToFormValues(fields, doc, uploads)
    expect(values.name).toEqual({ tr: 'Merkez', en: 'Center', de: '', ru: '' })
    expect((values.seo as Record<string, unknown>).description).toEqual({ tr: 'Açıklama', en: '', de: '', ru: '' })
    expect(values.images).toEqual([preview])
    expect(values.inspectionExpiresAt).toBe('2026-10-07')
    expect(values.startDate).toBe('2026-06-15')
    expect(values.startsAt).toBe('2026-10-22T11:00')
    expect(values.tags).toEqual([1, 2])
    expect(values.password).toBe('')
    expect(values.rateTiers).toEqual([{ id: 'row1', minDays: 1, dailyRate: 3500 }])
  })

  it('fills defaults for a new document', () => {
    const values = docToFormValues(fields, null, uploads)
    expect(values).toMatchObject({ deposit: null, category: null, tags: [], images: [], isActive: false, rateTiers: [] })
  })
})

describe('formToPayloadData', () => {
  const values = {
    ...docToFormValues(fields, doc, uploads),
    plate: ' 07 abc 1 ',
    deposit: '',
    password: 'secret',
  }

  it('sends every editable field in the default locale', () => {
    const data = formToPayloadData(fields, values, 'tr')
    expect(data).toMatchObject({
      name: 'Merkez',
      seo: { description: 'Açıklama' },
      plate: '07 ABC 1',
      deposit: null,
      images: [7],
      inspectionExpiresAt: '2026-10-07T12:00:00.000Z',
      startsAt: '2026-10-22T08:00:00.000Z',
      password: 'secret',
      rateTiers: [{ id: 'row1', minDays: 1, dailyRate: 3500 }],
    })
    expect(data).not.toHaveProperty('source')
  })

  it('sends only localized fields for other locales and skips empty required ones', () => {
    expect(formToPayloadData(fields, values, 'en')).toEqual({ name: 'Center', seo: { description: null } })
    expect(formToPayloadData(fields, values, 'de')).toEqual({ seo: { description: null } })
  })
})

describe('collectUploadIds', () => {
  it('finds referenced uploads', () => {
    expect(collectUploadIds(fields, doc)).toEqual({ media: [7, 99], documents: [] })
  })
})
