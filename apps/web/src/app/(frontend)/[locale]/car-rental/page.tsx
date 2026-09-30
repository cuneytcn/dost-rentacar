import { ArrowRight, MapPin, Navigation, Truck } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PageHero } from '@/features/site/components/section'
import { getLocations, getSiteSettings } from '@/features/site/data'
import { getMessages } from '@/features/site/i18n/server'
import { format } from '@/features/site/i18n/types'
import { INTL_LOCALES } from '@/features/site/constants'
import { isLocale, sitePath } from '@/features/site/routes'
import { BASE_AREA, DELIVERY_AREAS, listAreas, SERVICE_AREAS } from '@/features/site/service-areas'
import { alternatesFor } from '@/features/site/seo'
import { businessJsonLd, JsonLd } from '@/features/site/structured-data'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const m = getMessages(locale)
  return {
    title: m.meta.areasTitle,
    description: format(m.areas.hubSubtitle, { area: BASE_AREA.name[locale], areas: listAreas(DELIVERY_AREAS, locale, INTL_LOCALES[locale]) }),
    alternates: alternatesFor(locale, '/car-rental'),
  }
}

/** Overview of the office district and the delivery districts, linking to each area page. */
export default async function ServiceAreasPage({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const m = getMessages(locale)
  const [settings, locations] = await Promise.all([getSiteSettings(locale), getLocations(locale)])

  return (
    <>
      <JsonLd data={businessJsonLd({ settings, office: locations[0], areas: SERVICE_AREAS, locale })} />
      <PageHero
        title={m.areas.hubTitle}
        subtitle={format(m.areas.hubSubtitle, { area: BASE_AREA.name[locale], areas: listAreas(DELIVERY_AREAS, locale, INTL_LOCALES[locale]) })}
      />
      <section className="container-site py-10 sm:py-14">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_AREAS.map((area) => (
            <li key={area.slug}>
              <Link
                href={sitePath(locale, `/car-rental/${area.slug}`)}
                className="group hover:border-brand-200 flex h-full flex-col gap-3 rounded-2xl border bg-white p-6 transition-shadow hover:shadow-[0_18px_40px_-24px_rgba(15,38,73,0.35)]"
              >
                <span className="bg-brand-50 text-brand-600 flex size-11 items-center justify-center rounded-xl">
                  {area.base ? <MapPin className="size-5" /> : <Truck className="size-5" />}
                </span>
                <h2 className="text-brand-950 text-xl font-extrabold">{format(m.areas.h1, { area: area.name[locale] })}</h2>
                <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">{area.intro[locale][0]}</p>
                <span className="text-brand-900/70 mt-auto flex items-center gap-2 text-xs font-semibold">
                  {area.base ? (
                    <>
                      <MapPin className="text-brand-500 size-3.5" />
                      {m.areas.office}
                    </>
                  ) : (
                    <>
                      <Navigation className="text-brand-500 size-3.5" />
                      {format(m.areas.distance, { km: area.km, minutes: area.minutes })}
                    </>
                  )}
                  <ArrowRight className="text-brand-600 ml-auto size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
