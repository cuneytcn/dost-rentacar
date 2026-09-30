import type { CollectionConfig } from 'payload'

import { isStaffUser, staff } from '@/access'
import { slugField } from '@/fields'
import { adminGroups, text } from '@/i18n/admin'

/** Static pages: about, privacy notice (KVKK), cookie policy, rental terms … */
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: text('Page', 'Sayfa'), plural: text('Pages', 'Sayfalar') },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    group: adminGroups.content,
  },
  access: {
    read: ({ req }) => (isStaffUser(req.user) ? true : { _status: { equals: 'published' } }),
    create: staff,
    update: staff,
    delete: staff,
  },
  versions: { drafts: true },
  fields: [
    { name: 'title', type: 'text', label: text('Title', 'Başlık'), required: true, localized: true },
    { ...slugField([]), required: true },
    { name: 'content', type: 'richText', label: text('Content', 'İçerik'), localized: true },
    {
      name: 'seo',
      type: 'group',
      label: text('SEO', 'SEO'),
      fields: [
        { name: 'title', type: 'text', label: text('Meta title', 'Meta başlık'), localized: true },
        { name: 'description', type: 'textarea', label: text('Meta description', 'Meta açıklama'), localized: true, maxLength: 160 },
      ],
    },
  ],
}
