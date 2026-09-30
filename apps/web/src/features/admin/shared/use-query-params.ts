'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

/** URL-backed filter state: `update({ q: 'x', page: null })` pushes new search params. */
export function useQueryParams() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const update = (changes: Record<string, string | number | null | undefined>, options: { resetPage?: boolean } = { resetPage: true }) => {
    const next = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === undefined || value === '') next.delete(key)
      else next.set(key, String(value))
    }
    if (options.resetPage && !('page' in changes)) next.delete('page')
    const query = next.toString()
    startTransition(() => router.push(query ? `${pathname}?${query}` : pathname, { scroll: false }))
  }

  return { searchParams, update, pending, get: (key: string) => searchParams.get(key) ?? '' }
}
