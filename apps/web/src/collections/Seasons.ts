import type { CollectionConfig } from 'payload'

import { activeOrStaff, admins } from '@/access'
import { isActiveField } from '@/fields'
import { adminGroups, text } from '@/i18n/admin'

/** Date range that adjusts daily rates by a percentage (e.g. summer +30%). */
export const Seasons: CollectionConfig = {
  slug: 'seasons',
  labels: { singular: text('Season', 'Sezon'), plural: text('Seasons', 'Sezonlar') },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'startDate', 'endDate', 'adjustmentPercent', 'priority', 'isActive'],
    group: adminGroups.pricing,
    description: text(
      'When seasons overlap, the one with the highest priority wins for that day.',
      'Sezonlar çakışırsa o gün için önceliği en yüksek olan geçerli olur.',
    ),
  },
  access: {
    read: activeOrStaff,
    create: admins,
    update: admins,
    delete: admins,
  },
  defaultSort: '-startDate',
  fields: [
    { name: 'name', type: 'text', label: text('Name', 'Ad'), required: true },
    isActiveField,
    {
      type: 'row',
      fields: [
        {
          name: 'startDate',
          type: 'text',
          label: text('Start date', 'Başlangıç tarihi'),
          required: true,
          index: true,
          admin: { placeholder: 'YYYY-MM-DD' },
          validate: (value: string | null | undefined) => (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) || 'Use YYYY-MM-DD',
        },
        {
          name: 'endDate',
          type: 'text',
          label: text('End date (inclusive)', 'Bitiş tarihi (dahil)'),
          required: true,
          index: true,
          admin: { placeholder: 'YYYY-MM-DD' },
          validate: (value: string | null | undefined, { siblingData }: { siblingData: Partial<{ startDate: string }> }) => {
            if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Use YYYY-MM-DD'
            if (siblingData?.startDate && value < siblingData.startDate) return 'End date must not be before start date'
            return true
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'adjustmentPercent',
          type: 'number',
          label: text('Rate adjustment (%)', 'Fiyat değişimi (%)'),
          required: true,
          min: -90,
          max: 500,
          admin: { description: text('e.g. 30 = +30%, -15 = -15%', 'ör. 30 = %30 zam, -15 = %15 indirim') },
        },
        { name: 'priority', type: 'number', label: text('Priority', 'Öncelik'), required: true, defaultValue: 0 },
        { name: 'minRentalDays', type: 'number', label: text('Min. rental days', 'Min. kiralama günü'), min: 1 },
      ],
    },
    {
      name: 'vehicleCategories',
      type: 'relationship',
      label: text('Applies to categories', 'Geçerli sınıflar'),
      relationTo: 'vehicle-categories',
      hasMany: true,
      admin: { description: text('Empty = all categories.', 'Boş = tüm sınıflar.') },
    },
  ],
}
