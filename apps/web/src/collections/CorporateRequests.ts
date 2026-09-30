import type { CollectionConfig } from 'payload'

import { CORPORATE_REQUEST_STATUSES } from '@rent/shared'

import { admins, staff } from '@/access'
import { queueCorporateRequestNotification } from '@/hooks/notifications'
import { adminGroups, optionLabels, options, text } from '@/i18n/admin'

/** Long-term / corporate rental leads from the website. Priced manually. */
export const CorporateRequests: CollectionConfig = {
  slug: 'corporate-requests',
  labels: { singular: text('Corporate request', 'Kurumsal talep'), plural: text('Corporate requests', 'Kurumsal talepler') },
  admin: {
    useAsTitle: 'companyName',
    defaultColumns: ['companyName', 'contactName', 'vehicleCount', 'startDate', 'status', 'createdAt'],
    group: adminGroups.operations,
  },
  access: {
    read: staff,
    create: staff,
    update: staff,
    delete: admins,
  },
  defaultSort: '-createdAt',
  hooks: { afterChange: [queueCorporateRequestNotification] },
  fields: [
    {
      name: 'status',
      type: 'select',
      label: text('Status', 'Durum'),
      required: true,
      defaultValue: 'new',
      index: true,
      options: options(CORPORATE_REQUEST_STATUSES, optionLabels.corporateRequestStatus),
      admin: { position: 'sidebar' },
    },
    { name: 'locale', type: 'text', label: text('Language', 'Dil'), admin: { position: 'sidebar', readOnly: true } },
    {
      type: 'row',
      fields: [
        { name: 'companyName', type: 'text', label: text('Company', 'Firma'), required: true },
        { name: 'taxNumber', type: 'text', label: text('Tax number', 'Vergi no') },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'contactName', type: 'text', label: text('Contact person', 'Yetkili'), required: true },
        { name: 'email', type: 'email', label: text('Email', 'E-posta'), required: true },
        { name: 'phone', type: 'text', label: text('Phone', 'Telefon'), required: true },
        { name: 'country', type: 'text', label: text('Country code', 'Ülke kodu'), maxLength: 2 },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'vehicleCount', type: 'number', label: text('Vehicles', 'Araç adedi'), required: true, min: 1 },
        { name: 'startDate', type: 'text', label: text('Start date', 'Başlangıç tarihi'), required: true, admin: { placeholder: 'YYYY-MM-DD' } },
        { name: 'durationMonths', type: 'number', label: text('Duration (months)', 'Süre (ay)'), required: true, min: 1 },
      ],
    },
    {
      name: 'vehicleCategories',
      type: 'relationship',
      label: text('Preferred categories', 'Tercih edilen sınıflar'),
      relationTo: 'vehicle-categories',
      hasMany: true,
    },
    { name: 'notes', type: 'textarea', label: text('Customer notes', 'Müşteri notu') },
    { name: 'privacyAcceptedAt', type: 'date', label: text('Privacy notice accepted', 'Aydınlatma metni onayı'), admin: { readOnly: true } },
    { name: 'internalNotes', type: 'textarea', label: text('Internal notes', 'İç notlar') },
  ],
}
