'use client'

import { CalendarIcon, ChevronLeft, ChevronRight, Wrench } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { optionLabels, text } from '@/i18n/admin'
import { addDays, barPosition } from '@/lib/time-grid'
import { cn } from '@/lib/utils'

import { formatDateTime } from '../format'
import { intlLocale } from '../lang'
import { useAdminLang, useT } from '../lang-context'
import { useCalendarProps } from '../shared/date-picker'
import { ReservationStatusText } from '../shared/status-badge'
import { DAY_OPTIONS_CLIENT } from './constants'
import type { CalendarBooking, CalendarData } from './data'

const copy = {
  today: text('Today', 'Bugün'),
  allLocations: text('All locations', 'Tüm şubeler'),
  days: text('days', 'gün'),
  vehicle: text('Vehicle', 'Araç'),
  noVehicles: text('No vehicles match this filter.', 'Bu filtreye uygun araç yok.'),
  unassigned: text('Waiting for a vehicle', 'Araç bekleyen rezervasyonlar'),
  unassignedHint: text('Open a reservation to assign a plate.', 'Plaka atamak için rezervasyonu açın.'),
  noUnassigned: text('Every reservation in this period has a vehicle.', 'Bu dönemdeki tüm rezervasyonlara araç atanmış.'),
  blocked: text('Blocked', 'Kapalı'),
}

const barStyles: Record<CalendarBooking['status'], string> = {
  pending: 'bg-amber-500/15 text-amber-800 ring-amber-500/40 hover:bg-amber-500/25 dark:text-amber-200',
  confirmed: 'bg-sky-500/15 text-sky-800 ring-sky-500/40 hover:bg-sky-500/25 dark:text-sky-200',
  active: 'bg-emerald-500/20 text-emerald-800 ring-emerald-500/40 hover:bg-emerald-500/30 dark:text-emerald-200',
  completed: 'bg-zinc-500/15 text-zinc-700 ring-zinc-500/30 hover:bg-zinc-500/25 dark:text-zinc-300',
  cancelled: 'bg-rose-500/15 text-rose-800 ring-rose-500/40',
  no_show: 'bg-rose-500/15 text-rose-800 ring-rose-500/40',
}

export function CalendarView({ data }: { data: CalendarData }) {
  const calendarProps = useCalendarProps()
  const t = useT()
  const lang = useAdminLang()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const window = { start: new Date(data.windowStart), end: new Date(data.windowEnd) }
  const dayDates = Array.from({ length: data.days }, (_, index) => addDays(data.startDate, index))
  const locale = intlLocale(lang)
  const dayFormat = new Intl.DateTimeFormat(locale, { day: 'numeric', timeZone: 'UTC' })
  const weekdayFormat = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' })
  const rangeFormat = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

  const navigate = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    startTransition(() => router.push(`${pathname}?${next.toString()}`))
  }

  const lastDate = dayDates.at(-1)!
  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center">
          <Button variant="outline" size="icon" className="rounded-r-none" onClick={() => navigate({ start: addDays(data.startDate, -data.days) })}>
            <ChevronLeft />
          </Button>
          <Button variant="outline" className="-ml-px rounded-none" onClick={() => navigate({ start: null })}>
            {t(copy.today)}
          </Button>
          <Button variant="outline" size="icon" className="-ml-px rounded-l-none" onClick={() => navigate({ start: addDays(data.startDate, data.days) })}>
            <ChevronRight />
          </Button>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="font-normal">
              <CalendarIcon />
              {rangeFormat.formatRange(new Date(`${data.startDate}T00:00:00Z`), new Date(`${lastDate}T00:00:00Z`))}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              {...calendarProps}
              mode="single"
              selected={new Date(`${data.startDate}T12:00:00`)}
              onSelect={(date) => {
                if (!date) return
                const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                navigate({ start: value })
              }}
            />
          </PopoverContent>
        </Popover>
        <Tabs value={String(data.days)} onValueChange={(value) => navigate({ days: value })}>
          <TabsList>
            {DAY_OPTIONS_CLIENT.map((option) => (
              <TabsTrigger key={option} value={String(option)}>
                {option} {t(copy.days)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {data.locations.length > 1 && (
          <Select value={data.locationId ? String(data.locationId) : 'all'} onValueChange={(value) => navigate({ location: value === 'all' ? null : value })}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t(copy.allLocations)}</SelectItem>
              {data.locations.map((location) => (
                <SelectItem key={location.id} value={String(location.id)}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="text-muted-foreground ml-auto hidden items-center gap-3 text-xs lg:flex">
          {(['pending', 'confirmed', 'active', 'completed'] as const).map((status) => (
            <span key={status} className="flex items-center gap-1.5">
              <span className={cn('size-2.5 rounded-sm ring-1', barStyles[status])} />
              {t(optionLabels.reservationStatus[status])}
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-[repeating-linear-gradient(45deg,var(--color-rose-400)_0_2px,transparent_2px_4px)] ring-1 ring-rose-400/60" />
            {t(copy.blocked)}
          </span>
        </div>
      </div>

      <Card className={cn('overflow-hidden p-0 transition-opacity', pending && 'opacity-60')}>
        <div className="overflow-x-auto">
          <div className="grid min-w-full" style={{ gridTemplateColumns: `200px minmax(${data.days * 44}px, 1fr)` }}>
            <div className="bg-card sticky left-0 z-20 border-r border-b px-4 py-3 text-xs font-medium text-muted-foreground">{t(copy.vehicle)}</div>
            <div className="grid border-b" style={{ gridTemplateColumns: `repeat(${data.days}, minmax(0, 1fr))` }}>
              {dayDates.map((date) => {
                const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
                return (
                  <div
                    key={date}
                    className={cn(
                      'flex flex-col items-center justify-center border-l py-2 text-xs',
                      (weekday === 0 || weekday === 6) && 'bg-muted/40',
                      date === data.today && 'bg-primary/5',
                    )}
                  >
                    <span className="text-muted-foreground uppercase">{weekdayFormat.format(new Date(`${date}T00:00:00Z`))}</span>
                    <span
                      className={cn(
                        'mt-0.5 flex size-6 items-center justify-center rounded-full text-sm font-medium tabular-nums',
                        date === data.today && 'bg-primary text-primary-foreground',
                      )}
                    >
                      {dayFormat.format(new Date(`${date}T00:00:00Z`))}
                    </span>
                  </div>
                )
              })}
            </div>

            {data.rows.length === 0 && (
              <div className="text-muted-foreground col-span-2 py-16 text-center text-sm">{t(copy.noVehicles)}</div>
            )}

            {data.rows.map((row) => (
              <div key={row.id} className="contents group">
                <div className="bg-card group-hover:bg-muted/40 sticky left-0 z-10 flex flex-col justify-center border-r border-b px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold">{row.plate}</span>
                    {row.status !== 'active' && (
                      <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                        {t(optionLabels.vehicleStatus[row.status as keyof typeof optionLabels.vehicleStatus])}
                      </Badge>
                    )}
                  </div>
                  <span className="text-muted-foreground truncate text-xs">{row.model}</span>
                </div>
                <div className="group-hover:bg-muted/20 relative grid border-b" style={{ gridTemplateColumns: `repeat(${data.days}, minmax(0, 1fr))` }}>
                  {dayDates.map((date) => {
                    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
                    return (
                      <div
                        key={date}
                        className={cn('border-l', (weekday === 0 || weekday === 6) && 'bg-muted/40', date === data.today && 'bg-primary/5')}
                      />
                    )
                  })}
                  {row.blocks.map((block) => {
                    const position = barPosition(new Date(block.startsAt), new Date(block.endsAt), window)
                    if (!position) return null
                    return (
                      <Tooltip key={`block-${block.id}`}>
                        <TooltipTrigger asChild>
                          <div
                            className="absolute inset-y-2 flex items-center gap-1 overflow-hidden rounded-md bg-[repeating-linear-gradient(45deg,color-mix(in_oklab,var(--color-rose-500)_22%,transparent)_0_6px,color-mix(in_oklab,var(--color-rose-500)_10%,transparent)_6px_12px)] px-2 text-xs font-medium text-rose-800 ring-1 ring-rose-500/40 dark:text-rose-200"
                            style={{ left: `${position.leftPercent}%`, width: `${position.widthPercent}%` }}
                          >
                            <Wrench className="size-3 shrink-0" />
                            <span className="truncate">{t(optionLabels.vehicleBlockReason[block.reason as keyof typeof optionLabels.vehicleBlockReason])}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{t(optionLabels.vehicleBlockReason[block.reason as keyof typeof optionLabels.vehicleBlockReason])}</p>
                          <p>
                            {formatDateTime(block.startsAt, lang)} → {formatDateTime(block.endsAt, lang)}
                          </p>
                          {block.notes && <p className="opacity-80">{block.notes}</p>}
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}
                  {row.bookings.map((booking) => {
                    const position = barPosition(new Date(booking.pickupAt), new Date(booking.returnAt), window)
                    if (!position) return null
                    return (
                      <Tooltip key={booking.id}>
                        <TooltipTrigger asChild>
                          <Link
                            href={`/admin/reservations/${booking.id}`}
                            className={cn(
                              'absolute inset-y-2 flex items-center overflow-hidden rounded-md px-2 text-xs font-medium ring-1 transition-colors',
                              barStyles[booking.status],
                              position.startsBefore && 'rounded-l-none',
                              position.endsAfter && 'rounded-r-none',
                            )}
                            style={{ left: `${position.leftPercent}%`, width: `${position.widthPercent}%` }}
                          >
                            <span className="truncate">{booking.customerName}</span>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent className="space-y-1">
                          <p className="font-medium">
                            {booking.customerName} · <span className="font-mono">{booking.code}</span>
                          </p>
                          <p>
                            {formatDateTime(booking.pickupAt, lang)} → {formatDateTime(booking.returnAt, lang)}
                          </p>
                          <p className="opacity-80">{booking.pickupLocation}</p>
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="gap-0 py-0">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h3 className="font-semibold">{t(copy.unassigned)}</h3>
            <p className="text-muted-foreground text-sm">{t(copy.unassignedHint)}</p>
          </div>
          <Badge variant="secondary">{data.unassigned.length}</Badge>
        </div>
        {data.unassigned.length === 0 ? (
          <p className="text-muted-foreground px-5 py-8 text-center text-sm">{t(copy.noUnassigned)}</p>
        ) : (
          <ul className="divide-y">
            {data.unassigned.map((booking) => (
              <li key={booking.id}>
                <Link href={`/admin/reservations/${booking.id}`} className="hover:bg-muted/50 flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3">
                  <span className="font-mono text-sm font-semibold">{booking.code}</span>
                  <ReservationStatusText status={booking.status} />
                  <span className="font-medium">{booking.vehicleModel}</span>
                  <span className="text-muted-foreground text-sm">{booking.customerName}</span>
                  <span className="text-muted-foreground ml-auto text-sm">
                    {booking.pickupLocation} · {formatDateTime(booking.pickupAt, lang)} → {formatDateTime(booking.returnAt, lang)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
