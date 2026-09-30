import { DEFAULT_TIME_ZONE } from '@rent/shared'

import { intlLocale, type AdminLang } from './lang'

export function formatMoney(minor: number | null | undefined, currency: string, lang: AdminLang): string {
  if (minor == null) return '—'
  return new Intl.NumberFormat(intlLocale(lang), { style: 'currency', currency }).format(minor / 100)
}

export function formatDateTime(value: string | Date | null | undefined, lang: AdminLang, timeZone = DEFAULT_TIME_ZONE): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat(intlLocale(lang), { dateStyle: 'medium', timeStyle: 'short', timeZone }).format(new Date(value))
}

export function formatDate(value: string | Date | null | undefined, lang: AdminLang, timeZone = DEFAULT_TIME_ZONE): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat(intlLocale(lang), { dateStyle: 'medium', timeZone }).format(new Date(value))
}
