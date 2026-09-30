import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { HomePage } from '@/features/site/home/home-page'
import { getLocations, getSiteSettings } from '@/features/site/data'
import { getMessages } from '@/features/site/i18n/server'
import { format } from '@/features/site/i18n/types'
import { alternatesFor } from '@/features/site/seo'
import { BASE_AREA, DELIVERY_AREAS, listAreas } from '@/features/site/service-areas'
import { INTL_LOCALES } from '@/features/site/constants'
import { isLocale } from '@/features/site/routes'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const [settings, locations] = await Promise.all([getSiteSettings(locale), getLocations(locale)])
  const m = getMessages(locale)
  const values = {
    company: settings.companyName,
    city: locations[0]?.city ?? '',
    area: BASE_AREA.name[locale],
    areas: listAreas(DELIVERY_AREAS, locale, INTL_LOCALES[locale]),
  }
  return {
    title: { absolute: format(m.meta.homeTitle, values) },
    description: format(m.meta.homeDescription, values),
    alternates: alternatesFor(locale, '/'),
  }
}

export default async function Page({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  return <HomePage locale={locale} />
}
