import 'server-only'

import { cookies } from 'next/headers'

import type { AdminText } from '@/i18n/admin'

import { ADMIN_LANG_COOKIE, type AdminLang } from './lang'

export async function getAdminLang(): Promise<AdminLang> {
  const value = (await cookies()).get(ADMIN_LANG_COOKIE)?.value
  return value === 'en' ? 'en' : 'tr'
}

/** Server-side translator for admin UI copy defined with `text(en, tr)`. */
export async function getTranslator(): Promise<{ lang: AdminLang; t: (value: AdminText) => string }> {
  const lang = await getAdminLang()
  return { lang, t: (value) => value[lang] }
}

/** Page `<title>` in the panel language: `export const generateMetadata = () => adminTitle(text(...))`. */
export async function adminTitle(title: AdminText): Promise<{ title: string }> {
  const { t } = await getTranslator()
  return { title: t(title) }
}
