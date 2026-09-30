import 'server-only'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'

import { isAdminUser, isStaffUser } from '@/access'
import { getPayloadClient } from '@/lib/payload'
import type { User } from '@/payload-types'

export type SessionUser = User & { collection: 'users'; _sid?: string }

/** Current panel user from the Payload auth cookie, memoized per request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await headers() })
  return user && user.collection === 'users' ? (user as SessionUser) : null
})

export async function requireStaff(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user || !isStaffUser(user)) redirect('/admin/login')
  return user
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireStaff()
  if (!isAdminUser(user)) redirect('/admin')
  return user
}
