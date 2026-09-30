import type { CollectionConfig } from 'payload'

import { VEHICLE_STATUSES } from '@rent/shared'

import { admins, staff } from '@/access'
import { adminGroups, optionLabels, options, text } from '@/i18n/admin'

/** A physical car identified by its plate. */
export const Vehicles: CollectionConfig = {
  slug: 'vehicles',
  labels: { singular: text('Vehicle', 'Araç'), plural: text('Vehicles (fleet)', 'Araçlar (filo)') },
  admin: {
    useAsTitle: 'plate',
    defaultColumns: ['plate', 'vehicleModel', 'location', 'status', 'mileageKm', 'inspectionExpiresAt'],
    group: adminGroups.fleet,
  },
  access: {
    read: staff,
    create: admins,
    update: staff,
    delete: admins,
  },
  fields: [
    {
      name: 'plate',
      type: 'text',
      label: text('Plate', 'Plaka'),
      required: true,
      unique: true,
      hooks: {
        beforeValidate: [({ value }) => (typeof value === 'string' ? value.toUpperCase().replace(/\s+/g, ' ').trim() : value)],
      },
    },
    {
      type: 'row',
      fields: [
        { name: 'vehicleModel', type: 'relationship', label: text('Model', 'Model'), relationTo: 'vehicle-models', required: true, index: true },
        {
          name: 'location',
          type: 'relationship',
          label: text('Current location', 'Bulunduğu şube'),
          relationTo: 'locations',
          required: true,
          index: true,
          admin: { description: text('Updated automatically on return.', 'İadede otomatik güncellenir.') },
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      label: text('Status', 'Durum'),
      required: true,
      defaultValue: 'active',
      index: true,
      options: options(VEHICLE_STATUSES, optionLabels.vehicleStatus),
      admin: { position: 'sidebar' },
    },
    {
      type: 'row',
      fields: [
        { name: 'year', type: 'number', label: text('Year', 'Model yılı'), min: 1990 },
        { name: 'color', type: 'text', label: text('Color', 'Renk') },
        { name: 'vin', type: 'text', label: text('VIN', 'Şasi no') },
        { name: 'mileageKm', type: 'number', label: text('Mileage (km)', 'Kilometre'), min: 0, defaultValue: 0 },
      ],
    },
    {
      type: 'collapsible',
      label: text('Documents & expiry dates', 'Belgeler ve bitiş tarihleri'),
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'insuranceExpiresAt', type: 'date', label: text('Traffic insurance expires', 'Trafik sigortası bitişi'), admin: { date: { pickerAppearance: 'dayOnly' } } },
            { name: 'cascoExpiresAt', type: 'date', label: text('Casco expires', 'Kasko bitişi'), admin: { date: { pickerAppearance: 'dayOnly' } } },
            { name: 'inspectionExpiresAt', type: 'date', label: text('Inspection expires', 'Muayene bitişi'), admin: { date: { pickerAppearance: 'dayOnly' } } },
          ],
        },
      ],
    },
    { name: 'notes', type: 'textarea', label: text('Notes', 'Notlar') },
  ],
}
