import type { CollectionConfig } from 'payload'

import { admins, anyone } from '@/access'
import { moneyField } from '@/fields'
import { adminGroups, text } from '@/i18n/admin'

/** One-way fee when a car is returned to a different location. */
export const TransferFees: CollectionConfig = {
  slug: 'transfer-fees',
  labels: { singular: text('One-way fee', 'Farklı şube ücreti'), plural: text('One-way fees', 'Farklı şube ücretleri') },
  admin: {
    defaultColumns: ['fromLocation', 'toLocation', 'fee', 'bidirectional'],
    group: adminGroups.pricing,
  },
  access: {
    read: anyone,
    create: admins,
    update: admins,
    delete: admins,
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'fromLocation', type: 'relationship', label: text('From', 'Alış şubesi'), relationTo: 'locations', required: true, index: true },
        { name: 'toLocation', type: 'relationship', label: text('To', 'İade şubesi'), relationTo: 'locations', required: true, index: true },
      ],
    },
    moneyField({ name: 'fee', label: text('Fee', 'Ücret'), required: true }),
    {
      name: 'bidirectional',
      type: 'checkbox',
      label: text('Applies in both directions', 'Her iki yönde geçerli'),
      defaultValue: true,
    },
  ],
}
