import type { CollectionConfig } from 'payload'

import { FUEL_TYPES, TRANSMISSIONS, VEHICLE_FEATURES } from '@rent/shared'

import { activeOrStaff, admins } from '@/access'
import { isActiveField, moneyField, slugField, sortOrderField } from '@/fields'
import { adminGroups, optionLabels, options, text } from '@/i18n/admin'

/**
 * A rentable vehicle group as shown on the website (e.g. "Renault Clio or similar").
 * Prices are defined here in the base currency; physical cars live in `vehicles`.
 */
export const VehicleModels: CollectionConfig = {
  slug: 'vehicle-models',
  labels: { singular: text('Vehicle model', 'Araç modeli'), plural: text('Vehicle models', 'Araç modelleri') },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'transmission', 'fuelType', 'isActive'],
    group: adminGroups.fleet,
  },
  access: {
    read: activeOrStaff,
    create: admins,
    update: admins,
    delete: admins,
  },
  defaultSort: 'sortOrder',
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data && (data.brand || data.model)) {
          data.name = [data.brand, data.model].filter(Boolean).join(' ')
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: text('Name', 'Ad'),
      admin: { readOnly: true, description: text('Brand + model.', 'Marka + model.') },
    },
    slugField(['brand', 'model']),
    isActiveField,
    {
      name: 'isFeatured',
      type: 'checkbox',
      label: text('Featured on home page', 'Ana sayfada öne çıkar'),
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    sortOrderField,
    {
      type: 'tabs',
      tabs: [
        {
          label: text('General', 'Genel'),
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'brand', type: 'text', label: text('Brand', 'Marka'), required: true },
                { name: 'model', type: 'text', label: text('Model', 'Model'), required: true },
              ],
            },
            {
              name: 'category',
              type: 'relationship',
              label: text('Category', 'Sınıf'),
              relationTo: 'vehicle-categories',
              required: true,
              index: true,
            },
            {
              name: 'images',
              type: 'upload',
              label: text('Images', 'Görseller'),
              relationTo: 'media',
              hasMany: true,
              admin: { description: text('The first image is the cover.', 'İlk görsel kapak görselidir.') },
            },
            { name: 'description', type: 'textarea', label: text('Description', 'Açıklama'), localized: true },
          ],
        },
        {
          label: text('Specifications', 'Özellikler'),
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'transmission', type: 'select', label: text('Transmission', 'Vites'), required: true, options: options(TRANSMISSIONS, optionLabels.transmission) },
                { name: 'fuelType', type: 'select', label: text('Fuel', 'Yakıt'), required: true, options: options(FUEL_TYPES, optionLabels.fuelType) },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'seats', type: 'number', label: text('Seats', 'Koltuk'), required: true, min: 1, defaultValue: 5 },
                { name: 'doors', type: 'number', label: text('Doors', 'Kapı'), required: true, min: 2, defaultValue: 4 },
                { name: 'largeBags', type: 'number', label: text('Large bags', 'Büyük bavul'), required: true, min: 0, defaultValue: 1 },
                { name: 'smallBags', type: 'number', label: text('Small bags', 'Küçük bavul'), required: true, min: 0, defaultValue: 1 },
              ],
            },
            {
              name: 'features',
              type: 'select',
              label: text('Features', 'Donanım'),
              hasMany: true,
              options: options(VEHICLE_FEATURES, optionLabels.vehicleFeature),
            },
          ],
        },
        {
          label: text('Rental terms', 'Kiralama koşulları'),
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'minDriverAge', type: 'number', label: text('Min. driver age', 'Min. sürücü yaşı'), required: true, min: 18, defaultValue: 21 },
                { name: 'minLicenseYears', type: 'number', label: text('Min. license years', 'Min. ehliyet yılı'), required: true, min: 0, defaultValue: 2 },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'dailyKmLimit',
                  type: 'number',
                  label: text('Daily km limit', 'Günlük km limiti'),
                  min: 0,
                  admin: { description: text('Empty = unlimited.', 'Boş = sınırsız.') },
                },
                moneyField({ name: 'extraKmFee', label: text('Extra km fee', 'Fazla km ücreti') }),
              ],
            },
            moneyField({ name: 'deposit', label: text('Deposit', 'Depozito'), required: true, defaultValue: 0 }),
          ],
        },
        {
          label: text('Pricing', 'Fiyat'),
          fields: [
            {
              name: 'rateTiers',
              type: 'array',
              label: text('Daily rate tiers', 'Günlük fiyat kademeleri'),
              required: true,
              minRows: 1,
              admin: {
                description: text(
                  'The tier with the highest "from days" not exceeding the rental length applies to every day. A tier starting at 1 day is required. Seasons adjust these rates.',
                  'Kiralama süresini geçmeyen en yüksek "gün başlangıcı" kademesi tüm günlere uygulanır. 1 günden başlayan kademe zorunludur. Sezonlar bu fiyatları yüzde olarak değiştirir.',
                ),
              },
              validate: (value: unknown) => {
                const rows = Array.isArray(value) ? (value as { minDays?: number }[]) : []
                if (!rows.some((row) => row.minDays === 1)) return 'A tier starting at 1 day is required'
                const days = rows.map((row) => row.minDays)
                if (new Set(days).size !== days.length) return 'Tiers must have distinct "from days" values'
                return true
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'minDays', type: 'number', label: text('From days', 'Gün başlangıcı'), required: true, min: 1 },
                    moneyField({ name: 'dailyRate', label: text('Daily rate', 'Günlük fiyat'), required: true }),
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
