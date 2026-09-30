import Link from 'next/link'
import { Mail, MapPin, Phone } from 'lucide-react'

import type { Locale } from '@rent/shared'

import { getPages, getSiteSettings } from '../data'
import { SERVICE_AREAS } from '../service-areas'
import { getSiteKit } from '../kit'
import { Brand } from './brand'
import { SocialIcon } from './social-icon'

export async function SiteFooter({ locale }: { locale: Locale }) {
  const [{ m, href, fmt }, settings, pages] = await Promise.all([getSiteKit(locale), getSiteSettings(locale), getPages(locale)])
  const rentLinks = [
    { href: href('/cars'), label: m.nav.cars },
    { href: href('/reservation'), label: m.nav.myBooking },
    { href: href('/corporate'), label: m.nav.corporate },
  ]
  const infoLinks = [
    { href: href('/faq'), label: m.nav.faq },
    { href: href('/contact'), label: m.nav.contact },
    ...pages.map((page) => ({ href: href(`/${page.slug}`), label: page.title })),
  ]
  const areaLinks = SERVICE_AREAS.map((area) => ({ href: href(`/car-rental/${area.slug}`), label: fmt(m.areas.h1, { area: area.name[locale] }) }))
  const socials = Object.entries(settings.socialLinks)

  return (
    <footer className="bg-brand-950 text-brand-100 mt-auto">
      <div className="container-site grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1.3fr]">
        <div className="space-y-4">
          <Brand name={settings.companyName} href={href('/')} inverted />
          <p className="text-brand-200/80 max-w-xs text-sm leading-relaxed">{m.footer.about}</p>
          {socials.length > 0 && (
            <div className="flex gap-2 pt-1">
              {socials.map(([network, url]) => (
                <a
                  key={network}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={network}
                  className="hover:bg-brand-800 flex size-9 items-center justify-center rounded-full border border-white/10 transition-colors"
                >
                  <SocialIcon network={network} className="size-4" />
                </a>
              ))}
            </div>
          )}
        </div>
        <FooterColumn title={m.footer.rent} links={rentLinks} />
        <FooterColumn title={m.footer.areas} links={areaLinks} />
        <FooterColumn title={m.footer.info} links={infoLinks} />
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white">{m.footer.contact}</h2>
          <ul className="text-brand-200/90 space-y-3 text-sm">
            {settings.phone && (
              <li>
                <a href={`tel:${settings.phone.replace(/\s+/g, '')}`} className="flex items-center gap-2.5 tabular-nums hover:text-white">
                  <Phone className="text-brand-400 size-4 shrink-0" />
                  {settings.phone}
                </a>
              </li>
            )}
            {settings.email && (
              <li>
                <a href={`mailto:${settings.email}`} className="flex items-center gap-2.5 hover:text-white">
                  <Mail className="text-brand-400 size-4 shrink-0" />
                  {settings.email}
                </a>
              </li>
            )}
            {settings.address && (
              <li className="flex gap-2.5">
                <MapPin className="text-brand-400 mt-0.5 size-4 shrink-0" />
                <span className="leading-relaxed whitespace-pre-line">{settings.address}</span>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-site text-brand-300/70 flex flex-col gap-2 py-5 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {settings.legalName ?? settings.companyName}. {m.footer.rights}
          </p>
          {settings.authorizationNumber && (
            <p>
              {m.contact.authorization}: {settings.authorizationNumber}
            </p>
          )}
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-white">{title}</h2>
      <ul className="space-y-2.5 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-brand-200/90 hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
