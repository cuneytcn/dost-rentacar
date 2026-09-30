import type { CollectionConfig } from 'payload'

import { FAQ_CATEGORIES } from '@rent/shared'

import { activeOrStaff, staff } from '@/access'
import { isActiveField, sortOrderField } from '@/fields'
import { adminGroups, optionLabels, options, text } from '@/i18n/admin'

export const Faqs: CollectionConfig = {
  slug: 'faqs',
  labels: { singular: text('FAQ', 'SSS'), plural: text('FAQs', 'Sıkça sorulan sorular') },
  admin: {
    useAsTitle: 'question',
    defaultColumns: ['question', 'category', 'sortOrder', 'isActive'],
    group: adminGroups.content,
  },
  access: {
    read: activeOrStaff,
    create: staff,
    update: staff,
    delete: staff,
  },
  defaultSort: 'sortOrder',
  fields: [
    { name: 'question', type: 'text', label: text('Question', 'Soru'), required: true, localized: true },
    { name: 'answer', type: 'richText', label: text('Answer', 'Cevap'), required: true, localized: true },
    { name: 'category', type: 'select', label: text('Category', 'Kategori'), required: true, defaultValue: 'booking', options: options(FAQ_CATEGORIES, optionLabels.faqCategory) },
    isActiveField,
    sortOrderField,
  ],
}
