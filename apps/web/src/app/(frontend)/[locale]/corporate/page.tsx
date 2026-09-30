import { Banknote, CarFront, ReceiptText, Wrench } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PageHero } from '@/features/site/components/section'
import { CorporateForm } from '@/features/site/corporate/corporate-form'
import { getCategories, getPages, LEGAL_PAGE_SLUGS } from '@/features/site/data'
import { getMessages } from '@/features/site/i18n/server'
import { isLocale, sitePath } from '@/features/site/routes'
import { alternatesFor } from '@/features/site/seo'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const m = getMessages(locale)
  return { title: m.meta.corporateTitle, description: m.meta.corporateDescription, alternates: alternatesFor(locale, '/corporate') }
}

export default async function CorporatePage({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const m = getMessages(locale)
  const [categories, pages] = await Promise.all([getCategories(locale), getPages(locale)])
  const privacyHref = pages.some((page) => page.slug === LEGAL_PAGE_SLUGS.privacy) ? sitePath(locale, `/${LEGAL_PAGE_SLUGS.privacy}`) : null
  const benefits = [
    { icon: Banknote, title: m.corporate.benefit1Title, text: m.corporate.benefit1Text },
    { icon: Wrench, title: m.corporate.benefit2Title, text: m.corporate.benefit2Text },
    { icon: ReceiptText, title: m.corporate.benefit3Title, text: m.corporate.benefit3Text },
    { icon: CarFront, title: m.corporate.benefit4Title, text: m.corporate.benefit4Text },
  ]

  return (
    <>
      <PageHero eyebrow={m.corporate.eyebrow} title={m.corporate.title} subtitle={m.corporate.subtitle} />
      <section className="container-site grid gap-10 py-10 sm:py-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {benefits.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-4 rounded-2xl border bg-white p-5">
              <span className="bg-brand-50 text-brand-600 flex size-12 shrink-0 items-center justify-center rounded-xl">
                <Icon className="size-6" />
              </span>
              <div>
                <h2 className="text-brand-950 font-extrabold">{title}</h2>
                <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{text}</p>
              </div>
            </li>
          ))}
        </ul>
        <CorporateForm categories={categories} privacyHref={privacyHref} />
      </section>
    </>
  )
}
