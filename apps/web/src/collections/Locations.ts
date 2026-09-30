import type { CollectionConfig } from 'payload'

import { DEFAULT_TIME_ZONE, WEEKDAYS } from '@rent/shared'

import { activeOrStaff, admins } from '@/access'
import { isActiveField, slugField, sortOrderField, timeOfDayValidate } from '@/fields'
import { adminGroups, optionLabels, options, text } from '@/i18n/admin'

export const Locations: CollectionConfig = {
  slug: 'locations',
  labels: { singular: text('Location', 'Şube'), plural: text('Locations', 'Şubeler') },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'city', 'phone', 'isActive'],
    group: adminGroups.fleet,
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
    {
      type: 'row',
      fields: [
        { name: 'allowsPickup', type: 'checkbox', label: text('Pickup allowed', 'Teslim alınabilir'), defaultValue: true },
        { name: 'allowsReturn', type: 'checkbox', label: text('Return allowed', 'İade edilebilir'), defaultValue: true },
      ],
    },
    {
      type: 'collapsible',
      label: text('Contact & address', 'İletişim ve adres'),
      fields: [
        { name: 'address', type: 'textarea', label: text('Address', 'Adres'), required: true, localized: true },
        {
          type: 'row',
          fields: [
            { name: 'city', type: 'text', label: text('City', 'Şehir'), required: true },
            { name: 'country', type: 'text', label: text('Country code', 'Ülke kodu'), defaultValue: 'TR', maxLength: 2 },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'phone', type: 'text', label: text('Phone', 'Telefon'), required: true },
            { name: 'whatsapp', type: 'text', label: text('WhatsApp', 'WhatsApp') },
            { name: 'email', type: 'email', label: text('Email', 'E-posta') },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'latitude', type: 'number', label: text('Latitude', 'Enlem') },
            { name: 'longitude', type: 'number', label: text('Longitude', 'Boylam') },
          ],
        },
        {
          name: 'timeZone',
          type: 'text',
          label: text('Time zone', 'Saat dilimi'),
          defaultValue: DEFAULT_TIME_ZONE,
          required: true,
        },
      ],
    },
    {
      name: 'openingHours',
      type: 'array',
      label: text('Opening hours', 'Çalışma saatleri'),
      admin: {
        description: text(
          'One row per weekday. Missing days are treated as closed.',
          'Her gün için bir satır. Eklenmeyen günler kapalı kabul edilir.',
        ),
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'day', type: 'select', label: text('Day', 'Gün'), required: true, options: options(WEEKDAYS, optionLabels.weekday) },
            { name: 'opensAt', type: 'text', label: text('Opens', 'Açılış'), required: true, validate: timeOfDayValidate, admin: { placeholder: '08:00' } },
            { name: 'closesAt', type: 'text', label: text('Closes', 'Kapanış'), required: true, validate: timeOfDayValidate, admin: { placeholder: '20:00' } },
          ],
        },
      ],
    },
  ],
}
