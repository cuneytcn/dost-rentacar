import type { CollectionConfig } from 'payload'

import { admins, staff } from '@/access'
import { adminGroups, text } from '@/i18n/admin'

/** Private files: payment proofs, handover/damage photos, fine notices. Never publicly readable. */
export const Documents: CollectionConfig = {
  slug: 'documents',
  labels: { singular: text('Document', 'Belge'), plural: text('Documents', 'Belgeler') },
  admin: { group: adminGroups.system },
  access: {
    read: staff,
    create: staff,
    update: staff,
    delete: admins,
  },
  fields: [
    {
      name: 'description',
      type: 'text',
      label: text('Description', 'Açıklama'),
    },
  ],
  upload: {
    mimeTypes: ['image/*', 'application/pdf'],
    imageSizes: [{ name: 'thumbnail', width: 400, height: 300, position: 'centre' }],
    adminThumbnail: 'thumbnail',
  },
}
