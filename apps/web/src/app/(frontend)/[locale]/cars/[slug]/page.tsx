import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CarDetail } from '@/features/site/cars/car-detail'
import { getVehicleModel } from '@/features/site/data'
import { mediaSrc } from '@/features/site/cars/car-image'
import { getMessages } from '@/features/site/i18n/server'
import { format } from '@/features/site/i18n/types'
import { getSiteKit } from '@/features/site/kit'
import { BASE_AREA } from '@/features/site/service-areas'
import { breadcrumbJsonLd, carJsonLd, JsonLd } from '@/features/site/structured-data'
import { isLocale, sitePath } from '@/features/site/routes'
import { parseCarSearch } from '@/features/site/search'
import { alternatesFor } from '@/features/site/seo'

type Props = { params: Promise<{ locale: string; slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isLocale(locale)) return {}
  const model = await getVehicleModel(locale, slug)
  const m = getMessages(locale)
  if (!model) return { title: m.meta.notFoundTitle }
  const kit = await getSiteKit(locale)
  const area = BASE_AREA.name[locale]
  const specs = [kit.plural(m.car.seats, model.seats), m.transmission[model.transmission], m.fuel[model.fuelType]].join(', ')
  return {
    title: format(m.meta.carTitle, { model: model.name, area }),
    description: format(m.meta.carDescription, { model: model.name, area, specs, price: kit.price(model.fromDailyRate.amount) }),
    alternates: alternatesFor(locale, `/cars/${model.slug}`),
    openGraph: model.imageUrls[0] ? { images: [{ url: mediaSrc(model.imageUrls[0]) }] } : undefined,
  }
}

export default async function CarPage({ params, searchParams }: Props) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()
  const model = await getVehicleModel(locale, slug)
  if (!model) notFound()
  const m = getMessages(locale)
  const path = sitePath(locale, `/cars/${model.slug}`)
  return (
    <>
      <JsonLd
        data={[
          carJsonLd(model, path, model.fromDailyRate.amount),
          breadcrumbJsonLd([
            { name: m.nav.home, path: sitePath(locale) },
            { name: m.nav.cars, path: sitePath(locale, '/cars') },
            { name: model.name, path },
          ]),
        ]}
      />
      <CarDetail locale={locale} model={model} search={parseCarSearch(await searchParams)} />
    </>
  )
}
