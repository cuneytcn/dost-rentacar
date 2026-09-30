'use client'

import { ArrowRight, Briefcase, Cog, Fuel, Users } from 'lucide-react'
import Link from 'next/link'

import type { Quote, VehicleModelSummary } from '@rent/shared'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { useSite } from '../site-context'
import { CarImage } from './car-image'

export function CarSpecs({ model, className }: { model: VehicleModelSummary; className?: string }) {
  const { m, plural } = useSite()
  const specs = [
    { icon: Users, label: plural(m.car.seats, model.seats) },
    { icon: Cog, label: m.transmission[model.transmission] },
    { icon: Fuel, label: m.fuel[model.fuelType] },
    { icon: Briefcase, label: plural(m.car.bags, model.largeBags + model.smallBags) },
  ]
  return (
    <ul className={cn('text-brand-900/75 grid grid-cols-2 gap-x-4 gap-y-2 text-sm', className)}>
      {specs.map(({ icon: Icon, label }) => (
        <li key={label} className="flex items-center gap-2">
          <Icon className="text-brand-400 size-4 shrink-0" />
          <span className="truncate">{label}</span>
        </li>
      ))}
    </ul>
  )
}

type CardProps = {
  model: VehicleModelSummary
  href: string
  /** Total price for the searched dates; without it the card shows the lowest daily rate. */
  quote?: Quote | null
  unavailableReason?: string | null
  priority?: boolean
}

/** Grid card: fleet and featured cars. */
export function CarCard({ model, href, quote, unavailableReason, priority }: CardProps) {
  const { m, price, plural, violation } = useSite()
  const unavailable = Boolean(unavailableReason)

  return (
    <article
      className={cn(
        'group hover:border-brand-200 relative flex flex-col overflow-hidden rounded-2xl border bg-white transition-[box-shadow,border-color] hover:shadow-[0_18px_40px_-24px_rgba(15,38,73,0.35)]',
        unavailable && 'opacity-60',
      )}
    >
      <CarImage url={model.imageUrls[0]} alt={model.name} priority={priority} className="rounded-none" />
      {model.category && (
        <span className="text-brand-800 absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold shadow-sm backdrop-blur">
          {model.category.name}
        </span>
      )}
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <h3 className="text-brand-950 text-lg leading-tight font-extrabold">
            <Link href={href} className="after:absolute after:inset-0">
              {model.name}
            </Link>
          </h3>
          <p className="text-muted-foreground mt-0.5 text-xs">{m.car.orSimilar}</p>
        </div>
        <CarSpecs model={model} />
        <div className="mt-auto flex items-end justify-between gap-3 border-t pt-4">
          {quote ? (
            <div>
              <p className="text-muted-foreground text-xs font-medium">{m.car.totalFor.replace('{days}', plural(m.search.days, quote.rentalDays))}</p>
              <p className="text-brand-950 text-2xl font-extrabold tabular-nums">{price(quote.total)}</p>
            </div>
          ) : unavailable ? (
            <p className="text-muted-foreground text-sm font-medium">{violation(unavailableReason)}</p>
          ) : (
            <div>
              <p className="text-muted-foreground text-xs font-medium">{m.car.from}</p>
              <p className="text-brand-950 text-2xl font-extrabold tabular-nums">
                {price(model.fromDailyRate.amount)}
                <span className="text-muted-foreground ml-1 text-sm font-semibold">{m.car.perDayShort}</span>
              </p>
            </div>
          )}
          <span
            aria-hidden
            className="bg-brand-50 text-brand-700 group-hover:bg-brand-600 flex size-10 shrink-0 items-center justify-center rounded-full transition-colors group-hover:text-white"
          >
            <ArrowRight className="size-5" />
          </span>
        </div>
      </div>
    </article>
  )
}

/** Wide row: search results with the total for the chosen dates. */
export function CarResultRow({ model, href, quote, unavailableReason, priority }: CardProps) {
  const { m, price, plural, violation } = useSite()
  const unavailable = !quote || Boolean(unavailableReason)
  const perDay = quote ? Math.round(quote.baseTotal / Math.max(1, quote.rentalDays)) : null

  return (
    <article
      className={cn(
        'group relative grid overflow-hidden rounded-2xl border bg-white transition-[box-shadow,border-color] sm:grid-cols-[15rem_1fr] lg:grid-cols-[17rem_1fr_13rem]',
        unavailable ? 'bg-muted/40' : 'hover:border-brand-200 hover:shadow-[0_18px_40px_-24px_rgba(15,38,73,0.35)]',
      )}
    >
      <CarImage
        url={model.imageUrls[0]}
        alt={model.name}
        priority={priority}
        sizes="(min-width: 640px) 272px, 100vw"
        className={cn('sm:aspect-auto sm:h-full', unavailable && 'grayscale')}
      />
      <div className="flex flex-col gap-4 p-5">
        <div>
          {model.category && <p className="text-brand-500 text-xs font-bold tracking-wide uppercase">{model.category.name}</p>}
          <h3 className="text-brand-950 mt-1 text-xl leading-tight font-extrabold">
            {model.name}
            <span className="text-muted-foreground ml-2 text-xs font-medium">{m.car.orSimilar}</span>
          </h3>
        </div>
        <CarSpecs model={model} className="max-w-sm" />
        <Link href={href} className="text-brand-600 mt-auto w-fit text-sm font-semibold hover:underline">
          {m.car.details}
        </Link>
      </div>
      <div className="flex flex-col justify-between gap-4 border-t p-5 sm:col-span-2 sm:flex-row sm:items-end lg:col-span-1 lg:flex-col lg:items-stretch lg:border-t-0 lg:border-l">
        {quote && !unavailable ? (
          <>
            <div className="lg:text-right">
              <p className="text-muted-foreground text-xs font-medium">{m.car.totalFor.replace('{days}', plural(m.search.days, quote.rentalDays))}</p>
              <p className="text-brand-950 text-3xl font-extrabold tabular-nums">{price(quote.total)}</p>
              {perDay !== null && <p className="text-muted-foreground text-sm tabular-nums">{m.car.perDay.replace('{price}', price(perDay))}</p>}
            </div>
            <Button asChild className="bg-brand-600 hover:bg-brand-700 h-11 rounded-xl text-base font-bold">
              <Link href={href}>
                {m.car.select}
                <ArrowRight />
              </Link>
            </Button>
          </>
        ) : (
          <p className="text-muted-foreground text-sm font-medium lg:text-right">
            {violation(unavailableReason)}
          </p>
        )}
      </div>
    </article>
  )
}
