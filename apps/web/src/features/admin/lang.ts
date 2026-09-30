export type AdminLang = 'tr' | 'en'
export const ADMIN_LANG_COOKIE = 'admin-lang'

export const intlLocale = (lang: AdminLang) => (lang === 'tr' ? 'tr-TR' : 'en-GB')
