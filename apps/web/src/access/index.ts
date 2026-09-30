import type { Access, FieldAccess, PayloadRequest, Where } from 'payload'

type RequestUser = PayloadRequest['user']

export const isAdminUser = (user: RequestUser): boolean =>
  Boolean(user && user.collection === 'users' && user.role === 'admin')

export const isStaffUser = (user: RequestUser): boolean =>
  Boolean(user && user.collection === 'users' && (user.role === 'admin' || user.role === 'staff'))

export const getUserLocationIds = (user: RequestUser): number[] => {
  if (!user || user.collection !== 'users') return []
  return (user.locations ?? []).map((location) => (typeof location === 'object' ? location.id : location))
}

export const anyone: Access = () => true
export const admins: Access = ({ req }) => isAdminUser(req.user)
export const staff: Access = ({ req }) => isStaffUser(req.user)

export const adminsFieldLevel: FieldAccess = ({ req }) => isAdminUser(req.user)

/** Public reads only see active documents; staff see everything. */
export const activeOrStaff: Access = ({ req }) => {
  if (isStaffUser(req.user)) return true
  return { isActive: { equals: true } }
}

/**
 * Admins see everything; staff see documents linked to one of their locations
 * through any of the given relationship paths.
 */
export const staffScopedByLocation =
  (paths: string[]): Access =>
  ({ req }) => {
    if (isAdminUser(req.user)) return true
    if (!isStaffUser(req.user)) return false
    const locationIds = getUserLocationIds(req.user)
    if (locationIds.length === 0) return false
    const where: Where = { or: paths.map((path) => ({ [path]: { in: locationIds } })) }
    return where
  }
