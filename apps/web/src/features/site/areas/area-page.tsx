import { ChevronRight, Clock, MapPin, Navigation, Phone, Truck } from 'lucide-react'
import Link from 'next/link'

import type { Locale } from '@rent/shared'

import { Button } from '@/components/ui/button'

import { CarCard } from '../cars/car-card'
import { FaqList } from '../components/faq-list'
import { contentTokens } from '../components/site-rich-text'
import { getFaqs, getLocations, getSiteSettings, getVehicleModels } from '../data'
import { getSiteKit } from '../kit'
import { WhatsappIcon, whatsappUrl } from '../layout/whatsapp-button'
import { SearchPanel } from '../search/search-panel'
import { SERVICE_AREAS, type ServiceArea } from '../service-areas'
import { breadcrumbJsonLd, businessJsonLd, JsonLd } from '../structured-data'

/** Landing page for one service area: local intro, delivery/office facts, live search and the fleet. */
export async function AreaPage({ locale, area }: { locale: Locale; area: ServiceArea }) {
  const [kit, settings, locations, models, faqs] = await Promise.all([
    getSiteKit(locale),
    getSiteSettings(locale),
    getLocations(locale),
    getVehicleModels(locale),
    getFaqs(locale),
  ])
  const { m, href, fmt } = kit
  const office = locations[0]
  const name = area.name[locale]
  const title = fmt(m.areas.h1, { area: name })
  const others = SERVICE_AREAS.filter((item) => item.slug !== area.slug)
  const hours = office?.openingHours ?? []
  const openDays = hours.map((slot) => m.weekdays[slot.day]).filter(Boolean)
  const hoursSummary =
    hours.length > 0 && hours.every((slot) => slot.opensAt === hours[0]!.opensAt && slot.closesAt === hours[0]!.closesAt)
      ? `${openDays[0]}–${openDays[openDays.length - 1]} ${hours[0]!.opensAt}–${hours[0]!.closesAt}`
      : null

  return (
    <>
      <JsonLd
        data={[
          businessJsonLd({ settings, office, areas: SERVICE_AREAS, locale, image: models[0]?.imageUrls[0] }),
          breadcrumbJsonLd([
            { name: m.nav.home, path: href('/') },
            { name: m.areas.hubTitle, path: href('/car-rental') },
            { name: title, path: href(`/car-rental/${area.slug}`) },
          ]),
        ]}
      />
      <section className="bg-surface border-b">
        <div className="container-site space-y-6 py-8 sm:py-12">
          <nav aria-label="Breadcrumb" className="text-muted-foreground flex flex-wrap items-center gap-1 text-sm">
            <Link href={href('/')} className="hover:text-brand-700">
              {m.nav.home}
            </Link>
            <ChevronRight className="size-3.5" />
            <Link href={href('/car-rental')} className="hover:text-brand-700">
              {m.areas.hubTitle}
            </Link>
            <ChevronRight className="size-3.5" />
            <span className="text-brand-900 font-medium">{name}</span>
          </nav>
          <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-start">
            <div className="space-y-4">
              <h1 className="text-brand-950 text-3xl font-extrabold sm:text-5xl">{title}</h1>
              {area.intro[locale].map((paragraph) => (
                <p key={paragraph} className="text-brand-900/80 max-w-2xl text-lg leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
            <div className="space-y-3 rounded-3xl border bg-white p-5 sm:p-6">
              {area.base ? (
                office && (
                  <p className="text-brand-900 flex gap-3 text-sm leading-relaxed">
                    <MapPin className="text-brand-500 mt-0.5 size-5 shrink-0" />
                    <span>
                      <span className="text-brand-950 block font-bold">{m.areas.office}</span>
                      {office.address}, {office.city}
                    </span>
                  </p>
                )
              ) : (
                <>
                  <p className="text-brand-900 flex gap-3 text-sm leading-relaxed">
                    <Truck className="text-brand-500 mt-0.5 size-5 shrink-0" />
                    <span>
                      <span className="text-brand-950 block font-bold">{m.areas.delivery}</span>
                      {fmt(m.areas.deliveryText, { area: name })}
                    </span>
                  </p>
                  <p className="text-brand-900 flex gap-3 text-sm">
                    <Navigation className="text-brand-500 mt-0.5 size-5 shrink-0" />
                    {fmt(m.areas.distance, { km: area.km, minutes: area.minutes })}
                  </p>
                </>
              )}
              {hoursSummary && (
                <p className="text-brand-900 flex gap-3 text-sm">
                  <Clock className="text-brand-500 mt-0.5 size-5 shrink-0" />
                  {hoursSummary}
                </p>
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                {settings.phone && (
                  <Button asChild className="h-11 rounded-full px-5 font-bold">
                    <a href={`tel:${settings.phone.replace(/\s+/g, '')}`}>
                      <Phone />
                      {m.areas.call}
                    </a>
                  </Button>
                )}
                {settings.whatsapp && (
                  <Button asChild variant="outline" className="h-11 rounded-full border-[#25d366]/40 bg-white px-5 font-bold text-[#128c4a] hover:bg-[#25d366]/10">
                    <a href={whatsappUrl(settings.whatsapp)} target="_blank" rel="noopener noreferrer">
                      <WhatsappIcon className="size-5" />
                      {m.nav.whatsapp}
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="rounded-2xl border bg-white p-3 shadow-sm sm:p-4">
            <SearchPanel locale={locale} variant="bar" />
          </div>
        </div>
      </section>

      <section className="container-site py-14 sm:py-16">
        <h2 className="text-brand-950 text-2xl font-extrabold sm:text-3xl">{fmt(m.areas.cars, { area: name })}</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {models.map((model) => (
            <CarCard key={model.id} model={model} href={href(`/cars/${model.slug}`)} />
          ))}
        </div>
      </section>

      <section className="container-site pb-14 sm:pb-16">
        <h2 className="text-brand-950 text-xl font-extrabold">{m.areas.otherAreas}</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {others.map((item) => (
            <li key={item.slug}>
              <Link
                href={href(`/car-rental/${item.slug}`)}
                className="text-brand-800 hover:border-brand-300 hover:bg-brand-50 inline-flex h-10 items-center gap-2 rounded-full border bg-white px-4 text-sm font-semibold"
              >
                <MapPin className="text-brand-500 size-4" />
                {fmt(m.areas.h1, { area: item.name[locale] })}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {faqs.length > 0 && (
        <section className="container-site grid gap-8 pb-20 lg:grid-cols-[0.8fr_1.2fr]">
          <h2 className="text-brand-950 text-2xl font-extrabold sm:text-3xl">{m.home.faqTitle}</h2>
          <FaqList faqs={faqs.slice(0, 5)} tokens={contentTokens(settings)} />
        </section>
      )}
    </>
  )
}
