import type { CollectionConfig } from 'payload'

import { USER_ROLES } from '@rent/shared'

import { admins, adminsFieldLevel, isAdminUser } from '@/access'
import { adminGroups, optionLabels, options, text } from '@/i18n/admin'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: text('User', 'Kullanıcı'), plural: text('Users', 'Kullanıcılar') },
  auth: {
    tokenExpiration: 60 * 60 * 12,
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role', 'locations'],
    group: adminGroups.system,
  },
  access: {
    // Payload's own admin UI is not mounted; keep it locked in case it is ever re-enabled.
    admin: ({ req }) => isAdminUser(req.user),
    create: admins,
    delete: admins,
    read: ({ req }) => {
      if (isAdminUser(req.user)) return true
      if (!req.user) return false
      return { id: { equals: req.user.id } }
    },
    update: ({ req }) => {
      if (isAdminUser(req.user)) return true
      if (!req.user) return false
      return { id: { equals: req.user.id } }
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: text('Full name', 'Ad soyad'),
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      label: text('Role', 'Rol'),
      required: true,
      defaultValue: 'staff',
      saveToJWT: true,
      options: options(USER_ROLES, optionLabels.userRole),
      access: { create: adminsFieldLevel, update: adminsFieldLevel },
    },
    {
      name: 'locations',
      type: 'relationship',
      label: text('Locations', 'Şubeler'),
      relationTo: 'locations',
      hasMany: true,
      saveToJWT: true,
      access: { create: adminsFieldLevel, update: adminsFieldLevel },
      admin: {
        description: text(
          'Staff only see reservations of these locations.',
          'Personel yalnızca bu şubelerin rezervasyonlarını görür.',
        ),
        condition: (data) => data?.role === 'staff',
      },
      validate: (value: unknown, { siblingData }: { siblingData: Partial<{ role: string }> }) => {
        if (siblingData?.role === 'staff' && (!Array.isArray(value) || value.length === 0)) {
          return 'Staff users need at least one location'
        }
        return true
      },
    },
  ],
}
