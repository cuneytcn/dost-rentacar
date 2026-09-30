import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import type { PublicSettings } from '@rent/shared'

import { CarBrowser } from '@/features/site/cars/car-browser'
import { getCategories, getSiteSettings, getVehicleModels, searchCars } from '@/features/site/data'
import { getMessages } from '@/features/site/i18n/server'
import { format } from '@/features/site/i18n/types'
import { BASE_AREA } from '@/features/site/service-areas'
import { getSiteKit } from '@/features/site/kit'
import { isLocale } from '@/features/site/routes'
import { carSearchQuery, parseCarSearch } from '@/features/site/search'
import { SearchPanel } from '@/features/site/search/search-panel'
import { alternatesFor } from '@/features/site/seo'
import { violationText } from '@/features/site/violations'

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const m = getMessages(locale)
  const searching = parseCarSearch(await searchParams) !== null
  return {
    title: format(m.meta.carsTitle, { area: BASE_AREA.name[locale] }),
    description: format(m.meta.carsDescription, { area: BASE_AREA.name[locale] }),
    alternates: alternatesFor(locale, '/cars'),
    // Date-specific result pages are not worth indexing; the plain fleet page is.
    robots: searching ? { index: false, follow: true } : undefined,
  }
}

export default async function CarsPage({ params, searchParams }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const search = parseCarSearch(await searchParams)
  const [kit, categories, settings] = await Promise.all([getSiteKit(locale), getCategories(locale), getSiteSettings(locale)])
  const { m } = kit

  const result = search ? await searchCars(locale, search) : null
  const items =
    result?.ok === true
      ? result.items.map(({ vehicleModel, quote, available, unavailableReason }) => ({ model: vehicleModel, quote, available, unavailableReason }))
      : (await getVehicleModels(locale)).map((model) => ({ model, quote: null, available: true, unavailableReason: null }))

  return (
    <>
      <section className="bg-surface border-b">
        <div className="container-site space-y-6 py-8 sm:py-10">
          <div className="space-y-2">
            <h1 className="text-brand-950 text-3xl font-extrabold sm:text-4xl">{search ? m.cars.resultsTitle : m.cars.title}</h1>
            {!search && <p className="text-muted-foreground text-lg">{m.cars.subtitle}</p>}
          </div>
          <div className="rounded-2xl border bg-white p-3 shadow-sm sm:p-4">
            <SearchPanel locale={locale} initial={search} variant="bar" />
          </div>
        </div>
      </section>
      <section className="container-site py-8 sm:py-12">
        {result && !result.ok ? (
          <div role="alert" className="border-destructive/30 bg-destructive/5 text-destructive rounded-2xl border px-6 py-5 font-medium">
            {m.cars.searchError} {errorDetail(result.details, kit, settings.reservationRules)}
          </div>
        ) : (
          <CarBrowser items={items} categories={categories} searchQuery={search ? carSearchQuery(search) : null} />
        )}
      </section>
    </>
  )
}

function errorDetail(details: unknown, kit: Awaited<ReturnType<typeof getSiteKit>>, rules: PublicSettings['reservationRules']): string {
  const code = (details as { violations?: { code: string }[] } | undefined)?.violations?.[0]?.code
  return code ? violationText(kit.m, kit.intlLocale, rules, code) : ''
}
