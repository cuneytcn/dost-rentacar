'use client'

import { MapPin, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { snapToOpen, type OpeningHours } from '@rent/shared/opening-hours'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { addDays } from '@/lib/time-grid'
import { cn } from '@/lib/utils'

import { carSearchQuery, type CarSearch } from '../search'
import { useSite } from '../site-context'
import { DateTimeField } from './date-time-field'

export type SearchLocation = { id: number; name: string; city: string; allowsPickup: boolean; allowsReturn: boolean; openingHours: OpeningHours }

type Props = {
  locations: SearchLocation[]
  initial: CarSearch | null
  defaults: { from: string; to: string }
  /** Earliest bookable pick-up (`YYYY-MM-DDTHH:mm`, minimum notice applied) and last bookable day. */
  earliest: string
  maxDay: string
  /** Where to go with the search, as an internal path (defaults to the car list). */
  target?: string
  variant?: 'hero' | 'bar' | 'stack'
}

function shiftBy(value: string, from: string, to: string): string {
  // Keep the rental length (whole days, same time of day) when the pick-up moves past the return.
  const length = Math.max(1, Math.round((Date.parse(`${to}:00Z`) - Date.parse(`${from}:00Z`)) / 86_400_000))
  return `${addDays(value.slice(0, 10), length)}T${value.slice(11)}`
}

export function SearchForm({ locations, initial, defaults, earliest, maxDay, target = '/cars', variant = 'hero' }: Props) {
  const { m, href, plural } = useSite()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const pickupOptions = locations.filter((location) => location.allowsPickup)
  const returnOptions = locations.filter((location) => location.allowsReturn)
  const firstPickup = pickupOptions[0]?.id ?? 0

  const [pickup, setPickup] = useState(initial?.pickup ?? firstPickup)
  const [returnId, setReturnId] = useState(initial?.return ?? initial?.pickup ?? firstPickup)
  const [differentReturn, setDifferentReturn] = useState(Boolean(initial && initial.return !== initial.pickup))
  const [from, setFrom] = useState(initial?.from ?? defaults.from)
  const [to, setTo] = useState(initial?.to ?? defaults.to)
  const [error, setError] = useState<string | null>(null)

  const effectiveReturn = differentReturn ? returnId : pickup
  const hoursOf = (id: number) => locations.find((location) => location.id === id)?.openingHours ?? []

  // Only moments when the offices are open can be picked; moving an office or date keeps the
  // choice valid by snapping to the nearest open slot.
  const snapPickup = (value: string, office = pickup) => snapToOpen(value, hoursOf(office), { earliest }) ?? value
  const snapReturn = (value: string, pickupAt: string, office = effectiveReturn) => {
    const wanted = value <= pickupAt ? shiftBy(pickupAt, from, to) : value
    return snapToOpen(wanted, hoursOf(office), { earliest: pickupAt }) ?? wanted
  }
  const changePickupOffice = (office: number) => {
    setPickup(office)
    const nextFrom = snapPickup(from, office)
    setFrom(nextFrom)
    setTo(snapReturn(to, nextFrom, differentReturn ? returnId : office))
  }
  const changeReturnOffice = (office: number) => {
    setReturnId(office)
    setTo(snapReturn(to, from, office))
  }
  const days = Math.ceil((Date.parse(`${to}:00Z`) - Date.parse(`${from}:00Z`)) / 86_400_000)
  const compact = variant === 'bar'
  const stack = variant === 'stack'

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!pickup || !effectiveReturn || !from || !to) return setError(m.search.errorMissing)
    if (to <= from) return setError(m.search.errorReturnBeforePickup)
    setError(null)
    const query = carSearchQuery({ pickup, return: effectiveReturn, from, to })
    startTransition(() => router.push(href(`${target}?${query}`)))
  }

  const locationSelect = (id: string, value: number, onChange: (id: number) => void, options: SearchLocation[], label: string) => (
    <Select value={value ? String(value) : undefined} onValueChange={(next) => onChange(Number(next))}>
      <SelectTrigger
        id={id}
        aria-label={label}
        className={cn(
          'hover:border-brand-300 data-[state=open]:border-brand-500 data-[state=open]:ring-brand-500/15 h-auto! w-full flex-col items-start justify-start rounded-xl bg-white text-left shadow-none data-[state=open]:ring-4 [&>svg:last-child]:hidden',
          compact ? 'gap-0.5 px-3.5 py-2' : 'gap-1 px-4 py-3',
        )}
      >
        <span className="text-muted-foreground text-xs font-semibold">{label}</span>
        <span className="text-brand-950 flex w-full min-w-0 items-center gap-2 font-bold *:data-[slot=select-value]:flex *:data-[slot=select-value]:flex-1 *:data-[slot=select-value]:items-center">
          <MapPin className="text-brand-500 size-4 shrink-0" />
          <SelectValue placeholder={m.search.selectLocation} />
        </span>
      </SelectTrigger>
      <SelectContent position="popper" className="rounded-xl">
        {options.map((location) => (
          <SelectItem key={location.id} value={String(location.id)} className="py-2">
            <span className="font-semibold">{location.name}</span>
            <span className="text-muted-foreground ml-auto pl-3 text-xs font-medium">{location.city}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  return (
    <form
      onSubmit={submit}
      className={cn(
        'grid gap-3',
        stack ? '' : compact ? 'lg:grid-cols-[1.1fr_1fr_1fr_auto] lg:items-end' : differentReturn ? 'lg:grid-cols-4 lg:items-end' : 'lg:grid-cols-3 lg:items-end',
      )}
    >
      <div className={cn('grid gap-3', variant === 'hero' && 'sm:grid-cols-2 lg:contents', compact && differentReturn && 'sm:grid-cols-2')}>
        {locationSelect('search-pickup', pickup, changePickupOffice, pickupOptions, m.search.pickupLocation)}
        {differentReturn && locationSelect('search-return', returnId, changeReturnOffice, returnOptions, m.search.returnLocation)}
      </div>

      <div className={cn('grid gap-3', !stack && 'sm:grid-cols-2', compact && 'lg:col-span-2', variant === 'hero' && 'lg:contents')}>
        <DateTimeField
          id="search-from"
          label={m.search.pickup}
          value={from}
          hours={hoursOf(pickup)}
          earliest={earliest}
          maxDay={maxDay}
          compact={compact}
          onChange={(next) => {
            setFrom(next)
            setTo(snapReturn(to, next))
          }}
        />
        <DateTimeField
          id="search-to"
          label={days > 0 ? `${m.search.return} · ${plural(m.search.days, days)}` : m.search.return}
          value={to}
          hours={hoursOf(effectiveReturn)}
          earliest={from}
          compact={compact}
          invalid={to <= from}
          onChange={setTo}
        />
      </div>

      <div className={cn('flex flex-col gap-3', !stack && 'sm:flex-row sm:items-center', compact ? 'lg:contents' : !stack && 'sm:justify-between lg:col-span-full')}>
        {returnOptions.length > 1 && (
          // Checkbox beside (not inside) its label: inside a form Radix re-dispatches the click, and a wrapping label would bounce it back.
          <div className={cn('flex items-center gap-2.5', compact && 'lg:order-first lg:col-span-4')}>
            <Checkbox
              id={`${variant}-different-return`}
              checked={differentReturn}
              onCheckedChange={(checked) => {
                setDifferentReturn(checked === true)
                setReturnId(pickup)
                // Back to one office: the return must fit the pick-up office's hours again.
                if (!checked) setTo(snapReturn(to, from, pickup))
              }}
            />
            <label htmlFor={`${variant}-different-return`} className="text-brand-900 cursor-pointer text-sm font-medium select-none">
              {m.search.differentReturn}
            </label>
          </div>
        )}
        <Button
          type="submit"
          disabled={pending}
          className={cn(
            'bg-brand-600 hover:bg-brand-700 shadow-brand-600/25 rounded-xl text-base font-bold shadow-lg',
            compact ? 'h-[3.25rem] px-6' : stack ? 'h-12 w-full' : 'h-14 px-8 sm:ml-auto',
          )}
        >
          <Search className="size-5" />
          {compact ? m.search.update : stack ? m.car.checkPrice : m.search.submit}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-destructive text-sm font-medium lg:col-span-full">
          {error}
        </p>
      )}
    </form>
  )
}
