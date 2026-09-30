import type { CollectionConfig } from 'payload'

import { activeOrStaff, admins } from '@/access'
import { isActiveField, slugField, sortOrderField } from '@/fields'
import { adminGroups, text } from '@/i18n/admin'

export const VehicleCategories: CollectionConfig = {
  slug: 'vehicle-categories',
  labels: { singular: text('Vehicle category', 'Araç sınıfı'), plural: text('Vehicle categories', 'Araç sınıfları') },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'sortOrder', 'isActive'],
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
    { name: 'description', type: 'textarea', label: text('Description', 'Açıklama'), localized: true },
  ],
}
