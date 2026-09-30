import Link from 'next/link'
import { Phone } from 'lucide-react'

import type { Locale } from '@rent/shared'

import { Button } from '@/components/ui/button'

import { getSelectableCurrencies, getSiteSettings } from '../data'
import { getSiteKit } from '../kit'
import { Brand } from './brand'
import { HeaderNav } from './header-nav'
import { MobileNav } from './mobile-nav'
import { PreferencesMenu } from './preferences-menu'

export async function SiteHeader({ locale }: { locale: Locale }) {
  const [kit, settings, currencies] = await Promise.all([getSiteKit(locale), getSiteSettings(locale), getSelectableCurrencies(locale)])
  const { m, href } = kit
  const links = [
    { href: href('/cars'), label: m.nav.cars },
    { href: href('/corporate'), label: m.nav.corporate },
    { href: href('/faq'), label: m.nav.faq },
    { href: href('/contact'), label: m.nav.contact },
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container-site flex h-16 items-center gap-6 lg:h-[4.5rem]">
        <Brand name={settings.companyName} href={href('/')} />
        <HeaderNav links={links} />
        <div className="ml-auto flex items-center gap-2">
          {settings.phone && (
            <a
              href={`tel:${settings.phone.replace(/\s+/g, '')}`}
              className="text-brand-900 hover:text-brand-600 hidden items-center gap-2 px-2 text-sm font-semibold tabular-nums xl:flex"
            >
              <Phone className="text-brand-500 size-4" />
              {settings.phone}
            </a>
          )}
          <PreferencesMenu currencies={currencies} className="hidden md:flex" />
          <Button asChild variant="outline" className="border-brand-200 text-brand-800 hover:bg-brand-50 hidden h-10 rounded-full px-5 font-semibold md:inline-flex">
            <Link href={href('/reservation')}>{m.nav.myBooking}</Link>
          </Button>
          <MobileNav
            links={[...links, { href: href('/reservation'), label: m.nav.myBooking }]}
            currencies={currencies}
            phone={settings.phone}
            companyName={settings.companyName}
          />
        </div>
      </div>
    </header>
  )
}
