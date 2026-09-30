import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { BookingForm } from '@/features/site/booking/booking-form'
import { getExtras, getLocations, getPages, getSiteSettings, getVehicleModel, LEGAL_PAGE_SLUGS, searchCars } from '@/features/site/data'
import { getMessages } from '@/features/site/i18n/server'
import { getSiteKit } from '@/features/site/kit'
import { isLocale } from '@/features/site/routes'
import { carSearchQuery, parseCarSearch, toRentalWindow } from '@/features/site/search'
import { violationText } from '@/features/site/violations'

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  return { title: getMessages(locale).meta.bookingTitle, robots: { index: false, follow: false } }
}

export default async function BookingPage({ params, searchParams }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const query = await searchParams
  const search = parseCarSearch(query)
  const slug = typeof query.model === 'string' ? query.model : null
  const kit = await getSiteKit(locale)
  const { m, href } = kit

  const model = slug ? await getVehicleModel(locale, slug) : null
  const [locations, settings, extras, pages] = await Promise.all([getLocations(locale), getSiteSettings(locale), getExtras(locale), getPages(locale)])
  const rental = search ? toRentalWindow(search, locations) : null
  const result = search && model ? await searchCars(locale, search) : null
  const item = result?.ok ? result.items.find((entry) => entry.vehicleModel.id === model?.id) : undefined

  if (!search || !model || !rental || !item?.available || !item.quote) {
    const reason = item && !item.available ? violationText(m, kit.intlLocale, settings.reservationRules, item.unavailableReason) : m.booking.missingSearch
    return (
      <div className="container-site py-20">
        <div className="mx-auto max-w-lg space-y-5 rounded-3xl border bg-white p-8 text-center">
          <p className="text-brand-950 text-lg font-bold">{reason}</p>
          <Button asChild className="h-11 rounded-full px-6">
            <Link href={href(`/cars${search ? `?${carSearchQuery(search)}` : ''}`)}>{m.car.backToCars}</Link>
          </Button>
        </div>
      </div>
    )
  }

  const legalHref = (slugName: string) => (pages.some((page) => page.slug === slugName) ? href(`/${slugName}`) : null)
  const locationName = (id: number) => locations.find((location) => location.id === id)?.name ?? ''

  return (
    <BookingForm
      model={{ id: model.id, slug: model.slug, name: model.name, imageUrl: model.imageUrls[0] ?? null, category: model.category?.name ?? null, minDriverAge: model.minDriverAge }}
      search={search}
      rental={rental}
      pickupName={locationName(search.pickup)}
      returnName={locationName(search.return)}
      extras={extras}
      initialQuote={item.quote}
      bankAccounts={settings.bankAccounts}
      exchangeRates={settings.exchangeRates}
      termsHref={legalHref(LEGAL_PAGE_SLUGS.terms)}
      privacyHref={legalHref(LEGAL_PAGE_SLUGS.privacy)}
    />
  )
}
