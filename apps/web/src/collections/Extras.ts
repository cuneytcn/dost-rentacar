import type { CollectionConfig } from 'payload'

import { EXTRA_PRICING_TYPES } from '@rent/shared'

import { activeOrStaff, admins } from '@/access'
import { isActiveField, moneyField, slugField, sortOrderField } from '@/fields'
import { adminGroups, optionLabels, options, text } from '@/i18n/admin'

/** Optional add-ons: child seat, additional driver, full insurance … */
export const Extras: CollectionConfig = {
  slug: 'extras',
  labels: { singular: text('Extra', 'Ek hizmet'), plural: text('Extras', 'Ek hizmetler') },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'pricingType', 'price', 'isActive'],
    group: adminGroups.pricing,
  },
  access: {
    read: activeOrStaff,
    create: admins,
    update: admins,
    delete: admins,
  },
  defaultSort: 'sortOrder',
  fields: [
    { name: 'name', type: 'text', label: text('Name', 'Ad'), required: true, localized: true },
    slugField(['name']),
    isActiveField,
    sortOrderField,
    { name: 'description', type: 'textarea', label: text('Description', 'Açıklama'), localized: true },
    {
      type: 'row',
      fields: [
        { name: 'pricingType', type: 'select', label: text('Pricing', 'Ücretlendirme'), required: true, defaultValue: 'per_day', options: options(EXTRA_PRICING_TYPES, optionLabels.extraPricingType) },
        moneyField({ name: 'price', label: text('Price', 'Fiyat'), required: true }),
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'maxQuantity', type: 'number', label: text('Max. quantity', 'Maks. adet'), required: true, min: 1, defaultValue: 1 },
        {
          name: 'maxChargeDays',
          type: 'number',
          label: text('Charge at most (days)', 'En fazla ücretlendirilen gün'),
          min: 1,
          admin: {
            condition: (_, siblingData) => siblingData?.pricingType === 'per_day',
            description: text('Empty = every day is charged.', 'Boş = her gün ücretlendirilir.'),
          },
        },
      ],
    },
  ],
}
