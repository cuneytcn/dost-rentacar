import { ArrowLeft, ArrowRight, Briefcase, CalendarDays, Check, Cog, DoorOpen, Fuel, Gauge, MapPin, Users, BadgeCheck } from 'lucide-react'
import Link from 'next/link'

import type { Locale, VehicleModelDetail } from '@rent/shared'

import { Button } from '@/components/ui/button'

import { getLocations, getSiteSettings, searchCars } from '../data'
import { formatDateTime } from '../format'
import { getSiteKit } from '../kit'
import { carSearchQuery, type CarSearch } from '../search'
import { SearchPanel } from '../search/search-panel'
import { violationText } from '../violations'
import { CarGallery } from './car-gallery'

type Props = { locale: Locale; model: VehicleModelDetail; search: CarSearch | null }

export async function CarDetail({ locale, model, search }: Props) {
  const [kit, locations, settings] = await Promise.all([getSiteKit(locale), getLocations(locale), getSiteSettings(locale)])
  const { m, href, plural, price, fmt } = kit
  const query = search ? carSearchQuery(search) : null

  const result = search ? await searchCars(locale, search) : null
  const item = result?.ok ? result.items.find((entry) => entry.vehicleModel.id === model.id) : undefined
  const quote = item?.available ? item.quote : null
  const searchViolation = result && !result.ok ? (result.details as { violations?: { code: string }[] } | undefined)?.violations?.[0]?.code : undefined
  const reason = item ? item.unavailableReason : (searchViolation ?? null)
  const locationName = (id: number) => locations.find((location) => location.id === id)?.name ?? ''

  const specs = [
    { icon: Users, label: plural(m.car.seats, model.seats) },
    { icon: DoorOpen, label: plural(m.car.doors, model.doors) },
    { icon: Briefcase, label: plural(m.car.bags, model.largeBags + model.smallBags) },
    { icon: Cog, label: m.transmission[model.transmission] },
    { icon: Fuel, label: m.fuel[model.fuelType] },
    { icon: Gauge, label: model.dailyKmLimit ? fmt(m.car.kmPerDay, { km: model.dailyKmLimit }) : m.car.unlimitedKm },
  ]
  const conditions = [
    { label: m.car.minDriverAge, value: String(model.minDriverAge) },
    { label: m.car.minLicenseYears, value: plural(m.car.years, model.minLicenseYears) },
    { label: m.car.kmLimit, value: model.dailyKmLimit ? fmt(m.car.kmPerDay, { km: model.dailyKmLimit }) : m.car.unlimitedKm },
    { label: m.car.deposit, value: price(model.deposit.amount) },
    ...(model.extraKmFee ? [{ label: m.car.extraKmFee, value: price(model.extraKmFee.amount) }] : []),
  ]
  const tiers = model.rateTiers.map((tier, index) => {
    const next = model.rateTiers[index + 1]
    const label = next
      ? next.minDays - 1 === tier.minDays
        ? plural(m.search.days, tier.minDays)
        : `${tier.minDays}–${plural(m.search.days, next.minDays - 1)}`
      : plural(m.car.daysOrMore, tier.minDays)
    return { label, rate: tier.dailyRate.amount }
  })

  return (
    <div className="container-site py-6 sm:py-10">
      <Link href={href(`/cars${query ? `?${query}` : ''}`)} className="text-brand-700 hover:text-brand-500 inline-flex items-center gap-2 text-sm font-semibold">
        <ArrowLeft className="size-4" />
        {m.car.backToCars}
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_24rem] lg:items-start xl:gap-14">
        <div className="min-w-0 space-y-10">
          <CarGallery images={model.imageUrls} credits={model.imageCredits} alt={model.name} />

          <div className="space-y-5">
            <div>
              {model.category && <p className="text-brand-500 text-sm font-bold tracking-wide uppercase">{model.category.name}</p>}
              <h1 className="text-brand-950 mt-1 text-3xl font-extrabold sm:text-4xl">
                {model.name} <span className="text-muted-foreground text-base font-medium">{m.car.orSimilar}</span>
              </h1>
            </div>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {specs.map(({ icon: Icon, label }) => (
                <li key={label} className="bg-surface text-brand-900 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold">
                  <Icon className="text-brand-500 size-5 shrink-0" />
                  {label}
                </li>
              ))}
            </ul>
            {model.description && <p className="text-brand-900/80 leading-relaxed whitespace-pre-line">{model.description}</p>}
          </div>

          {model.features.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-brand-950 text-xl font-extrabold">{m.car.features}</h2>
              <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                {model.features.map((feature) => (
                  <li key={feature} className="text-brand-900 flex items-center gap-2.5 text-sm">
                    <span className="bg-brand-50 text-brand-600 flex size-6 items-center justify-center rounded-full">
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                    {m.features[feature as keyof typeof m.features] ?? feature}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-2xl border p-6">
              <h2 className="text-brand-950 text-lg font-extrabold">{m.car.conditions}</h2>
              <dl className="mt-4 divide-y text-sm">
                {conditions.map((row) => (
                  <div key={row.label} className="flex justify-between gap-4 py-2.5">
                    <dt className="text-muted-foreground">{row.label}</dt>
                    <dd className="text-brand-950 text-right font-semibold tabular-nums">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
            {tiers.length > 0 && (
              <section className="rounded-2xl border p-6">
                <h2 className="text-brand-950 text-lg font-extrabold">{m.car.pricing}</h2>
                <table className="mt-4 w-full text-sm">
                  <thead className="sr-only">
                    <tr>
                      <th>{m.car.rentalLength}</th>
                      <th>{m.car.dailyRate}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {tiers.map((tier) => (
                      <tr key={tier.label}>
                        <td className="text-muted-foreground py-2.5">{tier.label}</td>
                        <td className="text-brand-950 py-2.5 text-right font-semibold tabular-nums">
                          {price(tier.rate)} <span className="text-muted-foreground font-normal">{m.car.perDayShort}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-muted-foreground mt-3 text-xs leading-relaxed">{m.car.pricingNote}</p>
              </section>
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24">
          <div className="shadow-brand-900/10 rounded-3xl border bg-white p-5 shadow-xl sm:p-6">
            {search && quote ? (
              <div className="space-y-5">
                <ul className="space-y-3 text-sm">
                  {[
                    { label: m.search.pickup, location: search.pickup, at: search.from },
                    { label: m.search.return, location: search.return, at: search.to },
                  ].map((row) => (
                    <li key={row.label} className="bg-surface rounded-xl px-4 py-3">
                      <p className="text-muted-foreground text-xs font-semibold">{row.label}</p>
                      <p className="text-brand-950 mt-1 flex items-center gap-2 font-bold">
                        <CalendarDays className="text-brand-500 size-4" />
                        {formatDateTime(`${row.at}:00Z`, locale, 'UTC')}
                      </p>
                      <p className="text-brand-900/70 mt-0.5 flex items-center gap-2">
                        <MapPin className="text-brand-400 size-4" />
                        {locationName(row.location)}
                      </p>
                    </li>
                  ))}
                </ul>
                <div className="space-y-2 border-t pt-4 text-sm">
                  <p className="text-muted-foreground">{fmt(m.car.totalFor, { days: plural(m.search.days, quote.rentalDays) })}</p>
                  <p className="text-brand-950 text-4xl font-extrabold tabular-nums">{price(quote.total)}</p>
                  <p className="text-muted-foreground">{fmt(m.car.perDay, { price: price(Math.round(quote.baseTotal / quote.rentalDays)) })}</p>
                </div>
                <Button asChild className="bg-brand-600 hover:bg-brand-700 h-12 w-full rounded-xl text-base font-bold">
                  <Link href={href(`/booking?model=${model.slug}&${query}`)}>
                    {m.car.continue}
                    <ArrowRight />
                  </Link>
                </Button>
                <p className="text-muted-foreground flex items-center justify-center gap-2 text-xs">
                  <BadgeCheck className="text-brand-500 size-3.5 shrink-0" />
                  {m.home.trustNoPrepayment} · {fmt(m.home.trustFreeCancel, { hours: settings.reservationRules.selfCancelCutoffHours })}
                </p>
                <details className="group border-t pt-4">
                  <summary className="text-brand-600 cursor-pointer list-none text-sm font-semibold">{m.search.edit}</summary>
                  <div className="mt-4">
                    <SearchPanel locale={locale} initial={search} target={`/cars/${model.slug}`} variant="stack" />
                  </div>
                </details>
              </div>
            ) : (
              <div className="space-y-5">
                {search ? (
                  <p role="alert" className="bg-destructive/5 text-destructive rounded-xl px-4 py-3 text-sm font-medium">
                    {violationText(m, kit.intlLocale, settings.reservationRules, reason ?? 'sold_out')}
                  </p>
                ) : (
                  <div>
                    <p className="text-muted-foreground text-xs font-semibold">{m.car.from}</p>
                    <p className="text-brand-950 text-3xl font-extrabold tabular-nums">
                      {price(model.fromDailyRate.amount)}
                      <span className="text-muted-foreground ml-1 text-sm font-semibold">{m.car.perDayShort}</span>
                    </p>
                    <p className="text-muted-foreground mt-2 text-sm">{m.car.pickDatesForPrice}</p>
                  </div>
                )}
                <SearchPanel locale={locale} initial={search} target={`/cars/${model.slug}`} variant="stack" />
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

