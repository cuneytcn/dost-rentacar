import type { CollectionConfig } from 'payload'

import { VEHICLE_BLOCK_REASONS } from '@rent/shared'

import { staff } from '@/access'
import { adminGroups, optionLabels, options, text } from '@/i18n/admin'

/** Takes a vehicle out of rentable capacity for a period (maintenance, repair …). */
export const VehicleBlocks: CollectionConfig = {
  slug: 'vehicle-blocks',
  labels: { singular: text('Vehicle block', 'Araç kapatma'), plural: text('Vehicle blocks', 'Araç kapatmaları') },
  admin: {
    useAsTitle: 'reason',
    defaultColumns: ['vehicle', 'reason', 'startsAt', 'endsAt'],
    group: adminGroups.fleet,
    description: text(
      'Block a vehicle for maintenance or repair so it cannot be booked.',
      'Bakım veya onarım için aracı kiralamaya kapatın.',
    ),
  },
  access: {
    read: staff,
    create: staff,
    update: staff,
    delete: staff,
  },
  fields: [
    { name: 'vehicle', type: 'relationship', label: text('Vehicle', 'Araç'), relationTo: 'vehicles', required: true, index: true },
    { name: 'reason', type: 'select', label: text('Reason', 'Sebep'), required: true, options: options(VEHICLE_BLOCK_REASONS, optionLabels.vehicleBlockReason) },
    {
      type: 'row',
      fields: [
        { name: 'startsAt', type: 'date', label: text('Starts', 'Başlangıç'), required: true, index: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
        {
          name: 'endsAt',
          type: 'date',
          label: text('Ends', 'Bitiş'),
          required: true,
          index: true,
          admin: { date: { pickerAppearance: 'dayAndTime' } },
          validate: (value: unknown, { siblingData }: { siblingData: Partial<{ startsAt: string }> }) => {
            if (value && siblingData?.startsAt && new Date(value as string) <= new Date(siblingData.startsAt)) {
              return 'End must be after start'
            }
            return true
          },
        },
      ],
    },
    { name: 'notes', type: 'textarea', label: text('Notes', 'Notlar') },
  ],
}
