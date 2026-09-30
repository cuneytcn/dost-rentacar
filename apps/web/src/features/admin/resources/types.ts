import type { CollectionSlug, GlobalSlug } from 'payload'

import type { AdminText } from '@/i18n/admin'

/**
 * Declarative description of a panel screen (list + form) for one Payload collection or global.
 * Definitions are plain data so both server loaders and client components can import them.
 */

export type Option = { value: string; label: AdminText }

/** Column span inside a 12-column form grid. */
export type FieldWidth = 'full' | 'half' | 'third' | 'quarter'

type BaseField = {
  /** Dotted path into the document, e.g. `seo.title`. */
  name: string
  label: AdminText
  description?: AdminText
  required?: boolean
  readOnly?: boolean
  width?: FieldWidth
  /** Show only when another field has one of the given values. */
  condition?: { field: string; in: (string | boolean)[] }
  /** Initial value for new documents; overrides the Payload collection default. */
  defaultValue?: unknown
}

export type FieldDef =
  | (BaseField & { kind: 'text'; localized?: boolean; placeholder?: string; mono?: boolean; uppercase?: boolean; maxLength?: number })
  | (BaseField & { kind: 'email' })
  | (BaseField & { kind: 'password' })
  | (BaseField & { kind: 'textarea'; localized?: boolean; rows?: number; maxLength?: number })
  | (BaseField & { kind: 'richText'; localized?: boolean })
  | (BaseField & { kind: 'number'; min?: number; max?: number; step?: number; suffix?: string; placeholder?: string })
  | (BaseField & { kind: 'money' })
  | (BaseField & { kind: 'select'; options: Option[]; allowEmpty?: boolean })
  | (BaseField & { kind: 'multiSelect'; options: Option[] })
  | (BaseField & { kind: 'switch' })
  /** `storage: 'text'` = YYYY-MM-DD text field, `'timestamp'` = Payload date field. */
  | (BaseField & { kind: 'date'; storage: 'text' | 'timestamp' })
  | (BaseField & { kind: 'datetime' })
  | (BaseField & { kind: 'time' })
  | (BaseField & { kind: 'relation'; relationTo: CollectionSlug; hasMany?: boolean; allowEmpty?: boolean })
  | (BaseField & { kind: 'images'; relationTo: 'media' })
  | (BaseField & { kind: 'file'; relationTo: 'documents' })
  | (BaseField & { kind: 'array'; fields: FieldDef[]; addLabel: AdminText; minRows?: number })
  | (BaseField & { kind: 'openingHours' })

export type SectionDef = {
  title: AdminText
  description?: AdminText
  fields: FieldDef[]
  /** Render in the narrow right column. */
  aside?: boolean
}

export type ColumnKind = 'text' | 'mono' | 'number' | 'money' | 'percent' | 'badge' | 'boolean' | 'date' | 'datetime' | 'relation' | 'image' | 'localized'

export type ColumnDef = {
  path: string
  label: AdminText
  kind: ColumnKind
  /** Labels for badge values. */
  options?: Record<string, AdminText>
  /** For array values: show the minimum of this sub-field (e.g. lowest daily rate). */
  aggregate?: { min: string }
  /** Muted second line under the main value, aligned the same way. */
  secondary?: { path: string; kind: ColumnKind; options?: Record<string, AdminText> }
}

export type ListFilter = { name: string; label: AdminText; options: Option[] }

type BaseResource = {
  /** URL segment under /admin. */
  path: string
  labels: { singular: AdminText; plural: AdminText }
  description?: AdminText
  /** Only administrators may open this screen. */
  adminOnly?: boolean
  form: { sections: SectionDef[] }
}

export type CollectionResource = BaseResource & {
  type: 'collection'
  slug: CollectionSlug
  titleField: string
  list: {
    columns: ColumnDef[]
    searchFields: string[]
    defaultSort: string
    filters?: ListFilter[]
    /** Adds Active / Inactive tabs based on `isActive`. */
    activeTabs?: boolean
    /** Rows open another screen instead of the edit form, e.g. a handover opens its reservation. */
    rowLink?: { field: string; base: string }
  }
  canCreate?: boolean
  canDelete?: boolean
}

export type GlobalResource = BaseResource & { type: 'global'; slug: GlobalSlug }

export type ResourceDef = CollectionResource | GlobalResource

/** Collection used as label source for relation fields and relation columns. */
export const RELATION_TITLE_FIELDS: Partial<Record<CollectionSlug, string>> = {
  'vehicle-models': 'name',
  'vehicle-categories': 'name',
  vehicles: 'plate',
  locations: 'name',
  extras: 'name',
  reservations: 'code',
  customers: 'fullName',
  users: 'name',
}
