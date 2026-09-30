import type { CollectionConfig } from 'payload'

import { ID_DOCUMENT_TYPES } from '@rent/shared'

import { admins, staff } from '@/access'
import { adminGroups, optionLabels, options, text } from '@/i18n/admin'

/** Renters. There are no customer accounts; records are matched by email. Personal data (KVKK/GDPR). */
export const Customers: CollectionConfig = {
  slug: 'customers',
  labels: { singular: text('Customer', 'Müşteri'), plural: text('Customers', 'Müşteriler') },
  admin: {
    useAsTitle: 'fullName',
    defaultColumns: ['fullName', 'email', 'phone', 'country', 'isBlacklisted'],
    listSearchableFields: ['fullName', 'email', 'phone', 'idDocumentNumber'],
    group: adminGroups.operations,
  },
  access: {
    read: staff,
    create: staff,
    update: staff,
    delete: admins,
  },
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        const firstName = data.firstName ?? originalDoc?.firstName ?? ''
        const lastName = data.lastName ?? originalDoc?.lastName ?? ''
        data.fullName = `${firstName} ${lastName}`.trim()
        if (typeof data.email === 'string') data.email = data.email.toLowerCase().trim()
        return data
      },
    ],
  },
  fields: [
    { name: 'fullName', type: 'text', admin: { hidden: true }, index: true },
    {
      type: 'row',
      fields: [
        { name: 'firstName', type: 'text', label: text('First name', 'Ad'), required: true },
        { name: 'lastName', type: 'text', label: text('Last name', 'Soyad'), required: true },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'email', type: 'email', label: text('Email', 'E-posta'), required: true, unique: true },
        { name: 'phone', type: 'text', label: text('Phone', 'Telefon'), required: true },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'country', type: 'text', label: text('Country code', 'Ülke kodu'), maxLength: 2 },
        { name: 'birthDate', type: 'text', label: text('Birth date', 'Doğum tarihi'), admin: { placeholder: 'YYYY-MM-DD' } },
        { name: 'preferredLocale', type: 'text', label: text('Language', 'Dil'), admin: { readOnly: true } },
      ],
    },
    {
      type: 'collapsible',
      label: text('Identity & driving license', 'Kimlik ve ehliyet'),
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'idDocumentType', type: 'select', label: text('ID type', 'Kimlik türü'), options: options(ID_DOCUMENT_TYPES, optionLabels.idDocumentType) },
            { name: 'idDocumentNumber', type: 'text', label: text('ID number', 'Kimlik / pasaport no') },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'licenseNumber', type: 'text', label: text('License number', 'Ehliyet no') },
            { name: 'licenseCountry', type: 'text', label: text('License country', 'Ehliyet ülkesi'), maxLength: 2 },
            { name: 'licenseIssuedAt', type: 'text', label: text('License issued', 'Ehliyet veriliş tarihi'), admin: { placeholder: 'YYYY-MM-DD' } },
          ],
        },
        { name: 'address', type: 'textarea', label: text('Address', 'Adres') },
      ],
    },
    {
      type: 'collapsible',
      label: text('Consents', 'Onaylar'),
      admin: { initCollapsed: true },
      fields: [
        { name: 'privacyAcceptedAt', type: 'date', label: text('Privacy notice accepted', 'Aydınlatma metni onayı'), admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
        { name: 'marketingConsent', type: 'checkbox', label: text('Marketing consent', 'Ticari ileti izni'), defaultValue: false },
        { name: 'marketingConsentAt', type: 'date', label: text('Marketing consent date', 'Ticari ileti izin tarihi'), admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
      ],
    },
    {
      name: 'isBlacklisted',
      type: 'checkbox',
      label: text('Blacklisted', 'Kara listede'),
      defaultValue: false,
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'blacklistReason',
      type: 'textarea',
      label: text('Blacklist reason', 'Kara liste sebebi'),
      admin: { position: 'sidebar', condition: (data) => Boolean(data?.isBlacklisted) },
    },
    { name: 'notes', type: 'textarea', label: text('Internal notes', 'İç notlar') },
    {
      name: 'reservations',
      type: 'join',
      label: text('Reservations', 'Rezervasyonlar'),
      collection: 'reservations',
      on: 'customer',
      admin: { defaultColumns: ['code', 'status', 'pickupAt', 'returnAt'] },
    },
  ],
}
