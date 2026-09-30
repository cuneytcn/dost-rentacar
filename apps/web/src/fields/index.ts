import type { Field, FieldHook, NumberField, TextField } from 'payload'

import { text } from '@/i18n/admin'

export function slugify(value: string): string {
  return value
    .toLocaleLowerCase('en')
    .normalize('NFKD')
    .replace(/ı/g, 'i')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Unique slug, generated from `sourceFields` joined with a space when left empty. */
export function slugField(sourceFields: string[]): TextField {
  const generate: FieldHook = ({ value, data, originalDoc }) => {
    if (typeof value === 'string' && value.trim()) return slugify(value)
    const source = sourceFields
      .map((name) => data?.[name] ?? originalDoc?.[name])
      .map((part) => (part && typeof part === 'object' ? Object.values(part)[0] : part))
      .filter((part): part is string => typeof part === 'string' && part.length > 0)
      .join(' ')
    return source ? slugify(source) : value
  }

  return {
    name: 'slug',
    type: 'text',
    label: text('Slug', 'URL kısaltması'),
    unique: true,
    index: true,
    admin: {
      position: 'sidebar',
      description: text('Generated automatically when left empty.', 'Boş bırakılırsa otomatik oluşturulur.'),
    },
    hooks: { beforeValidate: [generate] },
  }
}

/** Integer amount in minor units (cents/kuruş) of the base currency. The panel shows decimals. */
export function moneyField(overrides: Partial<NumberField> & Pick<NumberField, 'name' | 'label'>): NumberField {
  return {
    type: 'number',
    min: 0,
    validate: (value: number | number[] | null | undefined) =>
      value == null || (typeof value === 'number' && Number.isInteger(value)) || 'Must be an integer amount',
    ...overrides,
  } as NumberField
}

export const isActiveField: Field = {
  name: 'isActive',
  type: 'checkbox',
  label: text('Active', 'Aktif'),
  defaultValue: true,
  index: true,
  admin: { position: 'sidebar' },
}

export const sortOrderField: Field = {
  name: 'sortOrder',
  type: 'number',
  label: text('Sort order', 'Sıralama'),
  defaultValue: 0,
  admin: { position: 'sidebar' },
}

/** Local time of day in HH:mm (24h). */
export const timeOfDayValidate = (value: string | null | undefined) =>
  !value || /^([01]\d|2[0-3]):[0-5]\d$/.test(value) || 'Use HH:mm format'
