'use client'

import { SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'

import type { AvailabilityItem, FuelType, Transmission, VehicleCategoryDto, VehicleModelSummary } from '@rent/shared'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

import { useSite } from '../site-context'
import { CarCard, CarResultRow } from './car-card'

type Item = { model: VehicleModelSummary; quote: AvailabilityItem['quote']; available: boolean; unavailableReason: string | null }

type Props = {
  items: Item[]
  categories: VehicleCategoryDto[]
  /** Query string of the current search; present when prices are for specific dates. */
  searchQuery: string | null
}

type Sort = 'recommended' | 'price'

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'h-9 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors',
        active ? 'border-brand-600 bg-brand-600 text-white' : 'text-brand-900 hover:border-brand-300 bg-white',
      )}
    >
      {children}
    </button>
  )
}

export function CarBrowser({ items, categories, searchQuery }: Props) {
  const { m, href, plural } = useSite()
  const [category, setCategory] = useState<string | null>(null)
  const [transmission, setTransmission] = useState<Transmission | null>(null)
  const [fuel, setFuel] = useState<FuelType | null>(null)
  const [sort, setSort] = useState<Sort>(searchQuery ? 'price' : 'recommended')

  const usedCategories = categories.filter((option) => items.some((item) => item.model.category?.id === option.id))
  const usedFuels = [...new Set(items.map((item) => item.model.fuelType))]
  const usedTransmissions = [...new Set(items.map((item) => item.model.transmission))]

  const visible = useMemo(() => {
    const filtered = items.filter(
      (item) =>
        (!category || item.model.category?.slug === category) &&
        (!transmission || item.model.transmission === transmission) &&
        (!fuel || item.model.fuelType === fuel),
    )
    if (sort === 'recommended') return filtered
    const priceOf = (item: Item) => item.quote?.total ?? item.model.fromDailyRate.amount
    return [...filtered].sort((a, b) => Number(b.available) - Number(a.available) || priceOf(a) - priceOf(b))
  }, [items, category, transmission, fuel, sort])

  const available = visible.filter((item) => item.available)
  const unavailable = visible.filter((item) => !item.available)
  const filtered = Boolean(category || transmission || fuel)
  const carHref = (model: VehicleModelSummary) => href(`/cars/${model.slug}${searchQuery ? `?${searchQuery}` : ''}`)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
          <Chip active={!category} onClick={() => setCategory(null)}>
            {m.cars.all}
          </Chip>
          {usedCategories.map((option) => (
            <Chip key={option.id} active={category === option.slug} onClick={() => setCategory(category === option.slug ? null : option.slug)}>
              {option.name}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="text-muted-foreground mr-1 hidden size-4 sm:block" />
          {usedTransmissions.length > 1 && (
            <Select value={transmission ?? 'all'} onValueChange={(value) => setTransmission(value === 'all' ? null : (value as Transmission))}>
              <SelectTrigger aria-label={m.cars.transmission} className="h-9 rounded-full bg-white font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {m.cars.transmission}: {m.cars.all}
                </SelectItem>
                {usedTransmissions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {m.transmission[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {usedFuels.length > 1 && (
            <Select value={fuel ?? 'all'} onValueChange={(value) => setFuel(value === 'all' ? null : (value as FuelType))}>
              <SelectTrigger aria-label={m.cars.fuel} className="h-9 rounded-full bg-white font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {m.cars.fuel}: {m.cars.all}
                </SelectItem>
                {usedFuels.map((option) => (
                  <SelectItem key={option} value={option}>
                    {m.fuel[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={sort} onValueChange={(value) => setSort(value as Sort)}>
            <SelectTrigger aria-label={m.cars.sort} className="h-9 rounded-full bg-white font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="recommended">{m.cars.sortRecommended}</SelectItem>
              <SelectItem value="price">{m.cars.sortPrice}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {searchQuery && (
        <p className="text-brand-900 text-sm font-semibold" aria-live="polite">
          {plural(m.cars.results, available.length)}
        </p>
      )}

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white px-6 py-16 text-center">
          <p className="text-muted-foreground">{m.cars.empty}</p>
          {filtered && (
            <Button
              variant="outline"
              className="mt-4 rounded-full"
              onClick={() => {
                setCategory(null)
                setTransmission(null)
                setFuel(null)
              }}
            >
              {m.cars.clearFilters}
            </Button>
          )}
        </div>
      ) : searchQuery ? (
        <div className="space-y-4">
          {available.map((item, index) => (
            <CarResultRow key={item.model.id} model={item.model} quote={item.quote} href={carHref(item.model)} priority={index < 2} />
          ))}
          {unavailable.length > 0 && (
            <>
              <h2 className="text-muted-foreground pt-6 text-sm font-bold tracking-wide uppercase">{m.cars.unavailableTitle}</h2>
              {unavailable.map((item) => (
                <CarResultRow
                  key={item.model.id}
                  model={item.model}
                  quote={null}
                  unavailableReason={item.unavailableReason ?? 'sold_out'}
                  href={href(`/cars/${item.model.slug}`)}
                />
              ))}
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item, index) => (
            <CarCard key={item.model.id} model={item.model} href={carHref(item.model)} priority={index < 3} />
          ))}
        </div>
      )}
    </div>
  )
}
