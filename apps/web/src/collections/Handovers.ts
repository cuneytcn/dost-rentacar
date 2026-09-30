import type { CollectionConfig } from 'payload'

import { DAMAGE_AREAS, FUEL_LEVELS, HANDOVER_TYPES } from '@rent/shared'

import { admins, staff } from '@/access'
import { applyHandoverEffects, validateHandover } from '@/hooks/handovers'
import { adminGroups, optionLabels, options, text } from '@/i18n/admin'

/** Vehicle check at pickup and return: mileage, fuel, damages, photos. */
export const Handovers: CollectionConfig = {
  slug: 'handovers',
  labels: { singular: text('Handover', 'Teslim / iade'), plural: text('Handovers', 'Teslim / iade kayıtları') },
  admin: {
    defaultColumns: ['reservation', 'type', 'performedAt', 'mileageKm', 'fuelLevel', 'performedBy'],
    group: adminGroups.operations,
  },
  access: {
    read: staff,
    create: staff,
    update: staff,
    delete: admins,
  },
  hooks: {
    beforeChange: [validateHandover],
    afterChange: [applyHandoverEffects],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'reservation', type: 'relationship', label: text('Reservation', 'Rezervasyon'), relationTo: 'reservations', required: true, index: true },
        { name: 'type', type: 'select', label: text('Type', 'Tür'), required: true, options: options(HANDOVER_TYPES, optionLabels.handoverType) },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'performedAt', type: 'date', label: text('Date', 'Tarih'), required: true, defaultValue: () => new Date().toISOString(), admin: { date: { pickerAppearance: 'dayAndTime' } } },
        { name: 'mileageKm', type: 'number', label: text('Mileage (km)', 'Kilometre'), required: true, min: 0 },
        { name: 'fuelLevel', type: 'select', label: text('Fuel level', 'Yakıt seviyesi'), required: true, options: options(FUEL_LEVELS, optionLabels.fuelLevel) },
      ],
    },
    {
      name: 'damages',
      type: 'array',
      label: text('Damages', 'Hasarlar'),
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'area', type: 'select', label: text('Area', 'Bölge'), required: true, options: options(DAMAGE_AREAS, optionLabels.damageArea) },
            { name: 'description', type: 'text', label: text('Description', 'Açıklama'), required: true },
            { name: 'isNew', type: 'checkbox', label: text('New damage', 'Yeni hasar'), defaultValue: false },
          ],
        },
        { name: 'photo', type: 'upload', label: text('Photo', 'Fotoğraf'), relationTo: 'documents' },
      ],
    },
    { name: 'photos', type: 'upload', label: text('Photos', 'Fotoğraflar'), relationTo: 'documents', hasMany: true },
    { name: 'notes', type: 'textarea', label: text('Notes', 'Notlar') },
    {
      name: 'performedBy',
      type: 'relationship',
      label: text('Performed by', 'İşlemi yapan'),
      relationTo: 'users',
      admin: { readOnly: true, position: 'sidebar' },
    },
  ],
}
