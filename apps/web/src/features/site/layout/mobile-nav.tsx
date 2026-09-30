'use client'

import { Menu, Phone } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { LOCALES, type Currency } from '@rent/shared/constants'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

import { useSite } from '../site-context'
import type { NavLink } from './header-nav'
import { useSitePreferences } from './preferences-menu'

type Props = { links: NavLink[]; currencies: Currency[]; phone: string | null; companyName: string }

export function MobileNav({ links, currencies, phone, companyName }: Props) {
  const { m, locale, display } = useSite()
  const { localeHref, setCurrency } = useSitePreferences()
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-brand-900 size-10 rounded-full lg:hidden" aria-label={m.nav.menu}>
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-sm gap-0 p-0">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="text-brand-900 text-left text-base font-extrabold">{companyName}</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col px-3 py-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-brand-900 hover:bg-brand-50 rounded-lg px-3 py-3 text-base font-semibold"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-5 border-t px-5 py-5">
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{m.nav.language}</p>
            <div className="grid grid-cols-4 gap-2">
              {LOCALES.map((option) => (
                <a
                  key={option}
                  href={localeHref(option)}
                  hrefLang={option}
                  className={cn(
                    'rounded-lg border py-2 text-center text-sm font-semibold',
                    option === locale ? 'border-brand-600 bg-brand-50 text-brand-700' : 'text-brand-900',
                  )}
                >
                  {option.toUpperCase()}
                </a>
              ))}
            </div>
          </div>
          {currencies.length > 1 && (
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{m.nav.currency}</p>
              <div className="grid grid-cols-4 gap-2">
                {currencies.map((currency) => (
                  <button
                    key={currency}
                    type="button"
                    onClick={() => setCurrency(currency)}
                    className={cn(
                      'rounded-lg border py-2 text-sm font-semibold',
                      currency === display.currency ? 'border-brand-600 bg-brand-50 text-brand-700' : 'text-brand-900',
                    )}
                  >
                    {currency}
                  </button>
                ))}
              </div>
            </div>
          )}
          {phone && (
            <Button asChild className="h-11 w-full rounded-full">
              <a href={`tel:${phone.replace(/\s+/g, '')}`}>
                <Phone />
                {phone}
              </a>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
