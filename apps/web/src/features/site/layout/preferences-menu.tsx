'use client'

import { Check, ChevronDown, Globe } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

import { LOCALES, type Currency, type Locale } from '@rent/shared/constants'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

import { LOCALE_NAMES, SITE_CURRENCY_COOKIE } from '../constants'
import { switchLocalePath } from '../routes'
import { useSite } from '../site-context'

export function useSitePreferences() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const query = searchParams.toString()

  return {
    pending,
    localeHref: (locale: Locale) => switchLocalePath(`${pathname}${query ? `?${query}` : ''}`, locale),
    setCurrency: (currency: Currency) => {
      document.cookie = `${SITE_CURRENCY_COOKIE}=${currency}; path=/; max-age=31536000; samesite=lax`
      startTransition(() => router.refresh())
    },
  }
}

export function PreferencesMenu({ currencies, className }: { currencies: Currency[]; className?: string }) {
  const { locale, m, display } = useSite()
  const { localeHref, setCurrency, pending } = useSitePreferences()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'text-brand-900 hover:bg-brand-50 data-[state=open]:bg-brand-50 flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
          pending && 'opacity-60',
          className,
        )}
      >
        <Globe className="text-brand-500 size-4" />
        {locale.toUpperCase()}
        <span className="text-brand-900/30">·</span>
        {display.currency}
        <ChevronDown className="size-3.5 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-muted-foreground text-xs font-medium">{m.nav.language}</DropdownMenuLabel>
        {LOCALES.map((option) => (
          <DropdownMenuItem key={option} asChild>
            <a href={localeHref(option)} hrefLang={option} lang={option}>
              <span className="text-muted-foreground w-6 text-xs font-semibold">{option.toUpperCase()}</span>
              {LOCALE_NAMES[option]}
              {option === locale && <Check className="text-primary ml-auto" />}
            </a>
          </DropdownMenuItem>
        ))}
        {currencies.length > 1 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-muted-foreground text-xs font-medium">{m.nav.currency}</DropdownMenuLabel>
            {currencies.map((currency) => (
              <DropdownMenuItem key={currency} onSelect={() => setCurrency(currency)}>
                <span className="text-muted-foreground w-6 text-xs font-semibold">{currencySymbol(currency, locale)}</span>
                {currency}
                {currency === display.currency && <Check className="text-primary ml-auto" />}
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function currencySymbol(currency: Currency, locale: Locale): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, currencyDisplay: 'narrowSymbol' }).formatToParts(0).find((part) => part.type === 'currency')?.value ?? currency
}
