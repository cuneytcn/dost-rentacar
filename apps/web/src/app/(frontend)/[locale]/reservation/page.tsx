import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PageHero } from '@/features/site/components/section'
import { getMessages } from '@/features/site/i18n/server'
import { ReservationLookup } from '@/features/site/reservation/reservation-lookup'
import { isLocale } from '@/features/site/routes'
import { alternatesFor } from '@/features/site/seo'

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const m = getMessages(locale)
  return { title: m.meta.reservationTitle, description: m.meta.reservationDescription, alternates: alternatesFor(locale, '/reservation') }
}

export default async function ReservationPage({ params, searchParams }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const m = getMessages(locale)
  const code = (await searchParams).code
  return (
    <>
      <PageHero title={m.reservation.title} subtitle={m.reservation.subtitle} />
      <section className="container-site py-10 sm:py-14">
        <ReservationLookup initialCode={typeof code === 'string' ? code.toUpperCase().slice(0, 20) : ''} />
      </section>
    </>
  )
}
