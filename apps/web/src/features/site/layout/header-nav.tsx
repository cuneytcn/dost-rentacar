'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

export type NavLink = { href: string; label: string }

export function HeaderNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname()
  return (
    <nav className="hidden items-center gap-1 lg:flex">
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`)
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative rounded-full px-3.5 py-2 text-[0.94rem] font-semibold transition-colors',
              active ? 'text-brand-700 bg-brand-50' : 'text-brand-900/80 hover:text-brand-700 hover:bg-brand-50/60',
            )}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
