import type { CollectionConfig } from 'payload'

import { anyone, staff } from '@/access'
import { adminGroups, text } from '@/i18n/admin'

/** Public images (vehicle photos, page visuals). Private files go to `documents`. */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: text('Image', 'Görsel'), plural: text('Images', 'Görseller') },
  admin: { group: adminGroups.content },
  access: {
    read: anyone,
    create: staff,
    update: staff,
    delete: staff,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: text('Alternative text', 'Alternatif metin'),
      required: true,
      localized: true,
    },
    {
      name: 'credit',
      type: 'text',
      label: text('Credit / licence', 'Kaynak / lisans'),
      admin: { description: text('Shown under the photo, e.g. “Jane Doe / Wikimedia Commons, CC BY-SA 4.0”.', 'Fotoğrafın altında gösterilir, ör. “Ad Soyad / Wikimedia Commons, CC BY-SA 4.0”.') },
    },
    { name: 'creditUrl', type: 'text', label: text('Credit link', 'Kaynak bağlantısı') },
  ],
  upload: {
    mimeTypes: ['image/*'],
    imageSizes: [
      // 3:2 matches car photography; crops follow the focal point.
      { name: 'thumbnail', width: 450, height: 300, position: 'centre' },
      { name: 'card', width: 960, height: 640, position: 'centre' },
      { name: 'hero', width: 1920, height: undefined },
    ],
    adminThumbnail: 'thumbnail',
    focalPoint: true,
  },
}
