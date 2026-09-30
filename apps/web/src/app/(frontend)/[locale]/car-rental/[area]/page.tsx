import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { AreaPage } from '@/features/site/areas/area-page'
import { getMessages } from '@/features/site/i18n/server'
import { format } from '@/features/site/i18n/types'
import { isLocale } from '@/features/site/routes'
import { getServiceArea } from '@/features/site/service-areas'
import { alternatesFor } from '@/features/site/seo'

type Props = { params: Promise<{ locale: string; area: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, area: slug } = await params
  const area = getServiceArea(slug)
  if (!isLocale(locale) || !area) return {}
  const m = getMessages(locale)
  const description = area.intro[locale].join(' ')
  return {
    title: format(m.meta.areaTitle, { area: area.name[locale] }),
    description: description.length > 158 ? `${description.slice(0, 155).replace(/\s+\S*$/, '')}…` : description,
    alternates: alternatesFor(locale, `/car-rental/${area.slug}`),
  }
}

export default async function ServiceAreaPage({ params }: Props) {
  const { locale, area: slug } = await params
  const area = getServiceArea(slug)
  if (!isLocale(locale) || !area) notFound()
  return <AreaPage locale={locale} area={area} />
}
