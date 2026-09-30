import { ArrowRight, BadgeCheck, Building2, CalendarCheck2, CarFront, Check, HandCoins, KeyRound, MapPin, Phone, ReceiptText, ShieldCheck, Truck, Undo2 } from 'lucide-react'
import Link from 'next/link'

import type { Locale } from '@rent/shared'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { CarCard } from '../cars/car-card'
import { CarImage } from '../cars/car-image'
import { FaqList } from '../components/faq-list'
import { contentTokens } from '../components/site-rich-text'
import { SectionHeading } from '../components/section'
import { getFaqs, getLocations, getSiteSettings, getVehicleModels } from '../data'
import { getSiteKit } from '../kit'
import { siteUrl } from '@/lib/urls'

import { WhatsappIcon, whatsappUrl } from '../layout/whatsapp-button'
import { SearchPanel } from '../search/search-panel'
import { BASE_AREA, DELIVERY_AREAS, listAreas, SERVICE_AREAS } from '../service-areas'
import { businessJsonLd, JsonLd } from '../structured-data'

export async function HomePage({ locale }: { locale: Locale }) {
  const [kit, settings, locations, featured, allModels, faqs] = await Promise.all([
    getSiteKit(locale),
    getSiteSettings(locale),
    getLocations(locale),
    getVehicleModels(locale, true),
    getVehicleModels(locale),
    getFaqs(locale),
  ])
  const { m, href, fmt, price } = kit
  const areaName = BASE_AREA.name[locale]
  const showcase = [...featured, ...allModels.filter((model) => !featured.some((item) => item.id === model.id))].slice(0, 6)
  const heroModel = showcase.find((model) => model.imageUrls.length > 0) ?? showcase[0]
  const cheapest = allModels.reduce<number | null>((low, model) => (low === null || model.fromDailyRate.amount < low ? model.fromDailyRate.amount : low), null)

  const trust = [
    m.home.trustNoPrepayment,
    fmt(m.home.trustFreeCancel, { hours: settings.reservationRules.selfCancelCutoffHours }),
    m.home.trustNoHidden,
  ]
  const steps = [
    { icon: CarFront, title: m.home.step1Title, text: m.home.step1Text },
    { icon: CalendarCheck2, title: m.home.step2Title, text: m.home.step2Text },
    { icon: KeyRound, title: m.home.step3Title, text: m.home.step3Text },
  ]
  const reasons = [
    { icon: ReceiptText, title: m.home.why1Title, text: m.home.why1Text },
    { icon: HandCoins, title: m.home.why2Title, text: m.home.why2Text },
    { icon: Undo2, title: m.home.why3Title, text: m.home.why3Text },
    { icon: ShieldCheck, title: m.home.why4Title, text: m.home.why4Text },
  ]

  return (
    <>
      <JsonLd
        data={[
          businessJsonLd({ settings, office: locations[0], areas: SERVICE_AREAS, locale, image: heroModel?.imageUrls[0] }),
          { '@context': 'https://schema.org', '@type': 'WebSite', name: settings.companyName, url: siteUrl(href('/')), inLanguage: locale },
        ]}
      />
      {/* Hero */}
      <section className="relative isolate">
        <div className="from-brand-50 via-brand-50/60 absolute inset-x-0 top-0 -z-10 h-[calc(100%-6rem)] overflow-hidden rounded-b-[2.5rem] bg-gradient-to-b to-white sm:rounded-b-[3.5rem]">
          <HeroBackdrop />
        </div>
        <div className="container-site grid items-center gap-10 pt-10 pb-8 sm:pt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pt-16">
          <div className="space-y-6">
            <p className="text-brand-700 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3.5 py-1.5 text-sm font-bold">
              <span className="bg-brand-500 size-1.5 rounded-full" />
              {fmt(m.home.eyebrow, { city: areaName })}
            </p>
            <h1 className="text-brand-950 text-4xl leading-[1.08] font-extrabold sm:text-5xl lg:text-[3.6rem]">{m.home.title}</h1>
            <p className="text-brand-900/70 max-w-xl text-lg leading-relaxed">{m.home.subtitle}</p>
            <ul className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-x-6">
              {trust.map((item) => (
                <li key={item} className="text-brand-900 flex items-center gap-2 text-sm font-semibold">
                  <span className="bg-brand-600 flex size-5 items-center justify-center rounded-full text-white">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          {heroModel && (
            <div className="relative hidden lg:block">
              <div className="shadow-brand-900/10 overflow-hidden rounded-[2rem] border-8 border-white bg-white shadow-2xl">
                <CarImage url={heroModel.imageUrls[0]} alt={heroModel.name} priority sizes="(min-width: 1024px) 560px, 0px" className="aspect-[3/2]" />
              </div>
              {cheapest !== null && (
                <div className="absolute -bottom-6 -left-6 rounded-2xl border bg-white px-5 py-4 shadow-xl shadow-brand-900/10">
                  <p className="text-muted-foreground text-xs font-semibold">{m.car.from}</p>
                  <p className="text-brand-950 text-2xl font-extrabold tabular-nums">
                    {price(cheapest)}
                    <span className="text-muted-foreground ml-1 text-sm font-semibold">{m.car.perDayShort}</span>
                  </p>
                </div>
              )}
              <div className="absolute -top-4 -right-4 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-brand-800 shadow-lg shadow-brand-900/10">
                <BadgeCheck className="text-brand-500 size-4" />
                {m.home.trustNoPrepayment}
              </div>
            </div>
          )}
        </div>
        <div className="container-site">
          <div className="shadow-brand-900/10 rounded-3xl border bg-white p-4 shadow-[0_30px_60px_-30px] sm:p-6">
            <SearchPanel locale={locale} />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container-site py-20 sm:py-24">
        <SectionHeading title={m.home.howTitle} subtitle={m.home.howSubtitle} align="center" />
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className="relative rounded-2xl border bg-white p-7">
              <span className="text-brand-100 absolute top-5 right-6 text-5xl font-extrabold tabular-nums">{String(index + 1).padStart(2, '0')}</span>
              <span className="bg-brand-50 text-brand-600 flex size-12 items-center justify-center rounded-xl">
                <Icon className="size-6" />
              </span>
              <h3 className="text-brand-950 mt-5 text-lg font-extrabold">{title}</h3>
              <p className="text-muted-foreground mt-2 leading-relaxed">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Fleet */}
      {showcase.length > 0 && (
        <section className="bg-surface rounded-[2.5rem] py-20 sm:rounded-[3.5rem] sm:py-24">
          <div className="container-site">
            <SectionHeading
              title={m.home.fleetTitle}
              subtitle={m.home.fleetSubtitle}
              action={
                <Button asChild variant="outline" className="border-brand-200 text-brand-800 hover:bg-white h-11 rounded-full bg-transparent px-5 font-bold">
                  <Link href={href('/cars')}>
                    {m.home.fleetAll}
                    <ArrowRight />
                  </Link>
                </Button>
              }
            />
            <div className={cn('mt-10 grid gap-6 sm:grid-cols-2', showcase.length % 4 === 0 ? 'lg:grid-cols-4' : 'lg:grid-cols-3')}>
              {showcase.map((model) => (
                <CarCard key={model.id} model={model} href={href(`/cars/${model.slug}`)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Service areas: local relevance and internal links to the area pages */}
      <section className="container-site pb-4">
        <div className="grid gap-6 rounded-[2rem] border bg-white p-6 sm:p-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div className="space-y-3">
            <h2 className="text-brand-950 text-2xl font-extrabold sm:text-3xl">{fmt(m.home.areasTitle, { area: areaName })}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {fmt(m.home.areasText, { area: areaName, areas: listAreas(DELIVERY_AREAS, locale, kit.intlLocale) })}
            </p>
          </div>
          <ul className="flex flex-wrap gap-2 lg:justify-end">
            {SERVICE_AREAS.map((area) => (
              <li key={area.slug}>
                <Link
                  href={href(`/car-rental/${area.slug}`)}
                  className="text-brand-800 hover:border-brand-300 hover:bg-brand-50 inline-flex h-10 items-center gap-2 rounded-full border bg-white px-4 text-sm font-semibold"
                >
                  {area.base ? <MapPin className="text-brand-500 size-4" /> : <Truck className="text-brand-500 size-4" />}
                  {fmt(m.areas.h1, { area: area.name[locale] })}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Why us */}
      <section className="container-site py-20 sm:py-24">
        <SectionHeading title={m.home.whyTitle} subtitle={m.home.whySubtitle} align="center" />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map(({ icon: Icon, title, text }) => (
            <div key={title} className="hover:border-brand-200 rounded-2xl border bg-white p-7 transition-colors">
              <span className="bg-brand-50 text-brand-600 flex size-12 items-center justify-center rounded-xl">
                <Icon className="size-6" />
              </span>
              <h3 className="text-brand-950 mt-5 text-lg font-extrabold">{title}</h3>
              <p className="text-muted-foreground mt-2 text-[0.95rem] leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Corporate */}
      <section className="container-site">
        <div className="bg-brand-900 relative isolate overflow-hidden rounded-[2rem] px-6 py-12 sm:px-12 sm:py-16 lg:px-16">
          <div className="bg-brand-600/40 absolute -top-24 -right-24 -z-10 size-96 rounded-full blur-3xl" />
          <div className="bg-brand-400/20 absolute -bottom-32 left-1/3 -z-10 size-80 rounded-full blur-3xl" />
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div className="max-w-2xl space-y-4">
              <span className="text-brand-200 inline-flex items-center gap-2 text-sm font-bold tracking-wide uppercase">
                <Building2 className="size-4" />
                {m.corporate.eyebrow}
              </span>
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">{m.home.corporateTitle}</h2>
              <p className="text-brand-100/80 text-lg leading-relaxed">{m.home.corporateText}</p>
            </div>
            <Button asChild className="text-brand-900 hover:bg-brand-50 h-12 rounded-full bg-white px-7 text-base font-bold">
              <Link href={href('/corporate')}>
                {m.home.corporateCta}
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      {faqs.length > 0 && (
        <section className="container-site grid gap-10 py-20 sm:py-24 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-5">
            <SectionHeading title={m.home.faqTitle} />
            <Link href={href('/faq')} className="text-brand-600 inline-flex items-center gap-2 text-base font-bold hover:underline">
              {m.home.faqAll}
              <ArrowRight className="size-4" />
            </Link>
          </div>
          <FaqList faqs={faqs.slice(0, 5)} tokens={contentTokens(settings)} />
        </section>
      )}

      {/* Contact */}
      {(settings.phone || settings.whatsapp) && (
        <section className="container-site pb-20 sm:pb-24">
          <div className="bg-surface flex flex-col items-start justify-between gap-6 rounded-[2rem] border px-6 py-10 sm:px-12 md:flex-row md:items-center">
            <div className="space-y-2">
              <h2 className="text-brand-950 text-2xl font-extrabold sm:text-3xl">{m.home.contactTitle}</h2>
              <p className="text-muted-foreground text-lg">{m.home.contactText}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {settings.phone && (
                <Button asChild className="h-12 rounded-full px-6 text-base font-bold">
                  <a href={`tel:${settings.phone.replace(/\s+/g, '')}`}>
                    <Phone />
                    {settings.phone}
                  </a>
                </Button>
              )}
              {settings.whatsapp && (
                <Button asChild variant="outline" className="h-12 rounded-full border-[#25d366]/40 bg-white px-6 text-base font-bold text-[#128c4a] hover:bg-[#25d366]/10">
                  <a href={whatsappUrl(settings.whatsapp)} target="_blank" rel="noopener noreferrer">
                    <WhatsappIcon className="size-5" />
                    {m.nav.whatsapp}
                  </a>
                </Button>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  )
}

/** Soft road lines behind the hero. */
function HeroBackdrop() {
  return (
    <svg aria-hidden className="text-brand-200/70 absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1440 720" fill="none">
      <defs>
        <pattern id="hero-grid" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M48 0H0v48" stroke="currentColor" strokeOpacity="0.35" />
        </pattern>
        <radialGradient id="hero-fade" cx="0.75" cy="0.2" r="0.8">
          <stop offset="0" stopColor="white" stopOpacity="0" />
          <stop offset="1" stopColor="white" stopOpacity="1" />
        </radialGradient>
      </defs>
      <rect width="1440" height="720" fill="url(#hero-grid)" />
      <rect width="1440" height="720" fill="url(#hero-fade)" opacity="0.7" />
      <path d="M1440 120C1180 150 1020 260 900 420S640 700 380 760" stroke="currentColor" strokeWidth="90" strokeOpacity="0.35" strokeLinecap="round" />
      <path d="M1440 120C1180 150 1020 260 900 420S640 700 380 760" stroke="white" strokeWidth="3" strokeDasharray="22 22" strokeOpacity="0.9" />
    </svg>
  )
}
