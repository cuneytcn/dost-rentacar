'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createLocalReq, logoutOperation } from 'payload'
import { z } from 'zod'

import { getPayloadClient } from '@/lib/payload'

import { ADMIN_LANG_COOKIE } from '../lang'
import { getSessionUser } from './session'

const loginSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(1),
  redirectTo: z.string().optional(),
})

export type LoginState = { error?: 'invalid' | 'locked' | 'forbidden' } | undefined

function safeRedirect(target: string | undefined): string {
  return target && target.startsWith('/admin') && !target.startsWith('//') ? target : '/admin'
}

export async function loginAction(_state: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'invalid' }

  const payload = await getPayloadClient()
  let result: Awaited<ReturnType<typeof payload.login<'users'>>>
  try {
    result = await payload.login({ collection: 'users', data: { email: parsed.data.email, password: parsed.data.password } })
  } catch (error) {
    const name = error instanceof Error ? error.name : ''
    return { error: name === 'LockedAuth' ? 'locked' : 'invalid' }
  }
  if (!result.token || !result.user) return { error: 'invalid' }

  ;(await cookies()).set(`${payload.config.cookiePrefix}-token`, result.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: result.exp ? new Date(result.exp * 1000) : undefined,
  })
  redirect(safeRedirect(parsed.data.redirectTo))
}

export async function logoutAction(): Promise<void> {
  const payload = await getPayloadClient()
  const user = await getSessionUser()
  if (user) {
    const req = await createLocalReq({ user }, payload)
    await logoutOperation({ collection: payload.collections.users, req }).catch(() => undefined)
  }
  ;(await cookies()).delete(`${payload.config.cookiePrefix}-token`)
  redirect('/admin/login')
}

export async function setAdminLangAction(lang: 'tr' | 'en'): Promise<void> {
  ;(await cookies()).set(ADMIN_LANG_COOKIE, lang, { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 })
}
