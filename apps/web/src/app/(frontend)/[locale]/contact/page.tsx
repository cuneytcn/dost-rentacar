import { Clock, Mail, MapPin, Navigation, Phone } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { WEEKDAYS } from '@rent/shared'

import { Button } from '@/components/ui/button'
import { PageHero } from '@/features/site/components/section'
import { getLocations, getSiteSettings } from '@/features/site/data'
import { getMessages } from '@/features/site/i18n/server'
import { WhatsappIcon, whatsappUrl } from '@/features/site/layout/whatsapp-button'
import { isLocale } from '@/features/site/routes'
import { alternatesFor } from '@/features/site/seo'
import { format } from '@/features/site/i18n/types'
import { BASE_AREA, SERVICE_AREAS } from '@/features/site/service-areas'
import { businessJsonLd, JsonLd } from '@/features/site/structured-data'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const m = getMessages(locale)
  const area = BASE_AREA.name[locale]
  return { title: format(m.meta.contactTitle, { area }), description: format(m.meta.contactDescription, { area }), alternates: alternatesFor(locale, '/contact') }
}

function directionsUrl(location: { latitude: number | null; longitude: number | null; address: string; city: string }): string {
  const destination = location.latitude != null && location.longitude != null ? `${location.latitude},${location.longitude}` : `${location.address}, ${location.city}`
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const m = getMessages(locale)
  const [locations, settings] = await Promise.all([getLocations(locale), getSiteSettings(locale)])
  const company = [
    { label: m.contact.company, value: settings.legalName },
    { label: m.contact.authorization, value: settings.authorizationNumber },
    { label: m.contact.taxOffice, value: settings.taxOffice },
    { label: m.contact.taxNumber, value: settings.taxNumber },
    { label: m.contact.mersis, value: settings.mersisNumber },
  ].filter((row): row is { label: string; value: string } => Boolean(row.value))

  return (
    <>
      <JsonLd data={businessJsonLd({ settings, office: locations[0], areas: SERVICE_AREAS, locale })} />
      <PageHero title={m.contact.title} subtitle={m.contact.subtitle} />
      <section className="container-site space-y-10 py-10 sm:py-14">
        <div className="grid gap-6 lg:grid-cols-2">
          {locations.map((location) => (
            <article key={location.id} className="flex flex-col rounded-3xl border bg-white p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-brand-950 text-2xl font-extrabold">{location.name}</h2>
                  <p className="text-brand-900/70 mt-2 flex gap-2 leading-relaxed">
                    <MapPin className="text-brand-500 mt-1 size-4 shrink-0" />
                    <span>
                      {location.address}, {location.city}
                    </span>
                  </p>
                </div>
                {(!location.allowsPickup || !location.allowsReturn) && (
                  <span className="bg-brand-50 text-brand-700 rounded-full px-3 py-1 text-xs font-bold">
                    {location.allowsPickup ? m.contact.pickupOnly : m.contact.returnOnly}
                  </span>
                )}
              </div>

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div className="space-y-3 text-sm">
                  <a href={`tel:${location.phone.replace(/\s+/g, '')}`} className="text-brand-900 hover:text-brand-600 flex items-center gap-2.5 font-semibold tabular-nums">
                    <Phone className="text-brand-500 size-4" />
                    {location.phone}
                  </a>
                  {location.email && (
                    <a href={`mailto:${location.email}`} className="text-brand-900 hover:text-brand-600 flex items-center gap-2.5 font-semibold">
                      <Mail className="text-brand-500 size-4" />
                      {location.email}
                    </a>
                  )}
                  {location.whatsapp && (
                    <a href={whatsappUrl(location.whatsapp)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 font-semibold text-[#128c4a] hover:underline">
                      <WhatsappIcon className="size-4" />
                      {m.contact.whatsapp}
                    </a>
                  )}
                </div>
                <div>
                  <p className="text-brand-950 mb-2 flex items-center gap-2 text-sm font-bold">
                    <Clock className="text-brand-500 size-4" />
                    {m.contact.hours}
                  </p>
                  <dl className="space-y-1 text-sm">
                    {WEEKDAYS.map((day) => {
                      const slot = location.openingHours.find((entry) => entry.day === day)
                      return (
                        <div key={day} className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">{m.weekdays[day]}</dt>
                          <dd className={slot ? 'text-brand-950 font-semibold tabular-nums' : 'text-muted-foreground'}>
                            {slot ? `${slot.opensAt}–${slot.closesAt}` : m.contact.closed}
                          </dd>
                        </div>
                      )
                    })}
                  </dl>
                </div>
              </div>

              <Button asChild variant="outline" className="border-brand-200 text-brand-800 hover:bg-brand-50 mt-6 h-11 w-fit rounded-full bg-white px-5 font-bold">
                <a href={directionsUrl(location)} target="_blank" rel="noopener noreferrer">
                  <Navigation />
                  {m.contact.directions}
                </a>
              </Button>
            </article>
          ))}
        </div>

        {(settings.phone || settings.email || settings.address || company.length > 0) && (
          <div className="bg-surface grid gap-8 rounded-3xl border p-6 sm:p-8 md:grid-cols-2">
            <div className="space-y-3">
              <h2 className="text-brand-950 text-lg font-extrabold">{m.contact.headOffice}</h2>
              {settings.phone && (
                <a href={`tel:${settings.phone.replace(/\s+/g, '')}`} className="text-brand-900 flex items-center gap-2.5 text-sm font-semibold tabular-nums">
                  <Phone className="text-brand-500 size-4" />
                  {settings.phone}
                </a>
              )}
              {settings.email && (
                <a href={`mailto:${settings.email}`} className="text-brand-900 flex items-center gap-2.5 text-sm font-semibold">
                  <Mail className="text-brand-500 size-4" />
                  {settings.email}
                </a>
              )}
              {settings.whatsapp && (
                <a href={whatsappUrl(settings.whatsapp)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm font-semibold text-[#128c4a]">
                  <WhatsappIcon className="size-4" />
                  {m.contact.whatsapp}
                </a>
              )}
              {settings.address && (
                <p className="text-brand-900/80 flex gap-2.5 text-sm leading-relaxed whitespace-pre-line">
                  <MapPin className="text-brand-500 mt-0.5 size-4 shrink-0" />
                  {settings.address}
                </p>
              )}
            </div>
            {company.length > 0 && (
              <dl className="space-y-2 text-sm">
                {company.map((row) => (
                  <div key={row.label} className="flex justify-between gap-4 border-b pb-2 last:border-b-0">
                    <dt className="text-muted-foreground">{row.label}</dt>
                    <dd className="text-brand-950 text-right font-semibold">{row.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        )}
      </section>
    </>
  )
}
