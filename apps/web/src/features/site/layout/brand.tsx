import Link from 'next/link'

import { cn } from '@/lib/utils'

/** Placeholder mark until the client's logo arrives: a rounded tile with a stylised road. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn('size-8 shrink-0', className)}>
      <rect width="32" height="32" rx="9" className="fill-brand-700" />
      <path d="M11 25 15 7h2l4 18" className="fill-none stroke-white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 11v2.2M16 16.4v2.4M16 22v1.6" className="stroke-brand-300" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function Brand({ name, href, inverted = false }: { name: string; href: string; inverted?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 rounded-md outline-offset-4">
      <BrandMark />
      <span className={cn('text-lg font-extrabold tracking-tight', inverted ? 'text-white' : 'text-brand-900')}>{name}</span>
    </Link>
  )
}
