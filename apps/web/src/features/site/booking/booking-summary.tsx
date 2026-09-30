'use client'

import { CalendarDays, Loader2, MapPin } from 'lucide-react'

import type { Quote } from '@rent/shared'

import { cn } from '@/lib/utils'

import { CarImage } from '../cars/car-image'
import { INTL_LOCALES } from '../constants'
import type { CarSearch } from '../search'
import { useSite } from '../site-context'

type Props = {
  model: { name: string; imageUrl: string | null; category: string | null }
  search: CarSearch
  pickupName: string
  returnName: string
  quote: Quote
  updating: boolean
  footer: React.ReactNode
}

/** Wall-clock `YYYY-MM-DDTHH:mm` at the office, formatted without shifting time zones. */
function formatLocal(value: string, locale: keyof typeof INTL_LOCALES): string {
  return new Intl.DateTimeFormat(INTL_LOCALES[locale], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(
    new Date(`${value}:00Z`),
  )
}

export function BookingSummary({ model, search, pickupName, returnName, quote, updating, footer }: Props) {
  const { m, locale, price, plural, fmt, display, baseCurrency, money } = useSite()
  const rows = [
    { label: fmt(`${m.booking.rental} · {days}`, { days: plural(m.search.days, quote.rentalDays) }), amount: quote.baseTotal },
    ...quote.extras.map((extra) => ({ label: extra.quantity > 1 ? `${extra.name} × ${extra.quantity}` : extra.name, amount: extra.total })),
    ...(quote.transferFee ? [{ label: m.booking.oneWayFee, amount: quote.transferFee }] : []),
  ]

  return (
    <aside className="shadow-brand-900/10 overflow-hidden rounded-3xl border bg-white shadow-xl">
      <div className="flex items-center gap-4 border-b p-5">
        <CarImage url={model.imageUrl ?? undefined} alt={model.name} sizes="96px" className="w-24 shrink-0 rounded-xl" />
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs font-semibold">{m.booking.summary}</p>
          <p className="text-brand-950 truncate text-lg font-extrabold">{model.name}</p>
          {model.category && <p className="text-brand-500 text-xs font-bold uppercase">{model.category}</p>}
        </div>
      </div>
      <ul className="space-y-3 border-b p-5 text-sm">
        {[
          { label: m.search.pickup, name: pickupName, at: search.from },
          { label: m.search.return, name: returnName, at: search.to },
        ].map((row) => (
          <li key={row.label} className="grid grid-cols-[4.5rem_1fr] gap-2">
            <span className="text-muted-foreground font-medium">{row.label}</span>
            <span>
              <span className="text-brand-950 flex items-center gap-1.5 font-bold">
                <CalendarDays className="text-brand-500 size-3.5" />
                {formatLocal(row.at, locale)}
              </span>
              <span className="text-brand-900/70 mt-0.5 flex items-center gap-1.5">
                <MapPin className="text-brand-400 size-3.5" />
                {row.name}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <div className={cn('space-y-2.5 p-5 text-sm transition-opacity', updating && 'opacity-60')}>
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-3">
            <span className="text-brand-900/80">{row.label}</span>
            <span className="text-brand-950 font-semibold tabular-nums">{price(row.amount)}</span>
          </div>
        ))}
        <div className="flex items-end justify-between gap-3 border-t pt-3">
          <span className="text-brand-950 flex items-center gap-2 font-bold">
            {m.booking.total}
            {updating && <Loader2 className="text-muted-foreground size-3.5 animate-spin" />}
          </span>
          <span className="text-brand-950 text-2xl font-extrabold tabular-nums">{price(quote.total)}</span>
        </div>
        {display.currency !== baseCurrency && (
          <p className="text-muted-foreground text-right text-xs tabular-nums">≈ {money(quote.total, baseCurrency)}</p>
        )}
        <div className="text-muted-foreground flex justify-between gap-3 text-xs">
          <span>{m.booking.deposit}</span>
          <span className="tabular-nums">{price(quote.deposit)}</span>
        </div>
        {display.currency !== baseCurrency && (
          <p className="text-muted-foreground bg-surface rounded-lg px-3 py-2 text-xs leading-relaxed">
            {fmt(m.booking.displayNote, { base: baseCurrency, currency: display.currency })}
          </p>
        )}
      </div>
      <div className="border-t p-5">{footer}</div>
    </aside>
  )
}
