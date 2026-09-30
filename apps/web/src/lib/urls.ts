import type { Locale } from '@rent/shared'

import { sitePath } from '@/features/site/routes'

export function siteUrl(path = ''): string {
  const base = (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3050').replace(/\/$/, '')
  return `${base}${path}`
}

/** Public "manage my reservation" page in the customer's language. */
export function reservationPageUrl(locale: Locale, code: string): string {
  return siteUrl(sitePath(locale, `/reservation?code=${encodeURIComponent(code)}`))
}

export function adminDocumentUrl(collection: string, id: number): string {
  return siteUrl(`/admin/${collection}/${id}`)
}
