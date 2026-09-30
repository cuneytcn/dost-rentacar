import type { CollectionConfig } from 'payload'

import { PENALTY_STATUSES, PENALTY_TYPES } from '@rent/shared'

import { admins, staff } from '@/access'
import { moneyField } from '@/fields'
import { adminGroups, optionLabels, options, text } from '@/i18n/admin'

/** Charges that arrive after or during a rental: tolls, traffic fines, damage, fuel … */
export const Penalties: CollectionConfig = {
  slug: 'penalties',
  labels: { singular: text('Penalty / charge', 'Ceza / ek ücret'), plural: text('Penalties & charges', 'Cezalar ve ek ücretler') },
  admin: {
    defaultColumns: ['type', 'reservation', 'vehicle', 'amount', 'occurredAt', 'status'],
    group: adminGroups.operations,
  },
  access: {
    read: staff,
    create: staff,
    update: staff,
    delete: admins,
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'type', type: 'select', label: text('Type', 'Tür'), required: true, options: options(PENALTY_TYPES, optionLabels.penaltyType) },
        { name: 'status', type: 'select', label: text('Status', 'Durum'), required: true, defaultValue: 'open', index: true, options: options(PENALTY_STATUSES, optionLabels.penaltyStatus) },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'vehicle', type: 'relationship', label: text('Vehicle', 'Araç'), relationTo: 'vehicles', required: true, index: true },
        {
          name: 'reservation',
          type: 'relationship',
          label: text('Reservation', 'Rezervasyon'),
          relationTo: 'reservations',
          index: true,
          admin: { description: text('The rental during which it occurred.', 'Olayın gerçekleştiği kiralama.') },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        moneyField({ name: 'amount', label: text('Amount', 'Tutar'), required: true }),
        { name: 'occurredAt', type: 'date', label: text('Occurred at', 'Olay zamanı'), required: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
      ],
    },
    { name: 'document', type: 'upload', label: text('Notice / receipt', 'Tebligat / makbuz'), relationTo: 'documents' },
    { name: 'notes', type: 'textarea', label: text('Notes', 'Notlar') },
  ],
}
