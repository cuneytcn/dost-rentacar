'use client'

import { CalendarDays, Clock } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { de, enGB, ru, tr } from 'react-day-picker/locale'

import { openTimes, snapToOpen, type OpeningHours } from '@rent/shared/opening-hours'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

import { useSite } from '../site-context'

const DAY_PICKER_LOCALES = { tr, en: enGB, de, ru }

/** Below this width the picker opens as a bottom sheet instead of a popover. */
const DESKTOP_QUERY = '(min-width: 640px)'

function toDate(day: string): Date {
  return new Date(`${day}T12:00:00`)
}

function toDay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

type Props = {
  id: string
  label: string
  /** `YYYY-MM-DDTHH:mm` */
  value: string
  onChange: (value: string) => void
  /** Opening hours of the office; only open days and times can be picked. */
  hours: OpeningHours
  /** Nothing before this moment (`YYYY-MM-DDTHH:mm`) can be picked. */
  earliest?: string
  /** Last selectable day (`YYYY-MM-DD`). */
  maxDay?: string
  invalid?: boolean
  compact?: boolean
}

/**
 * Search field for a pick-up or return moment. On desktop a popover shows the calendar and a time
 * column side by side; on phones a bottom sheet shows a full-width calendar, a grid of large time
 * buttons and a "Done" button.
 */
export function DateTimeField({ id, label, value, onChange, hours, earliest, maxDay, invalid, compact }: Props) {
  const { locale, intlLocale, m } = useSite()
  const [mode, setMode] = useState<'closed' | 'popover' | 'sheet'>('closed')
  const [day = '', time = '10:00'] = value.split('T')
  const selected = day ? toDate(day) : undefined
  const timeList = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const [step, setStep] = useState<'day' | 'time'>('day')
  const minDay = earliest?.slice(0, 10)
  const times = day ? openTimes(hours, day, earliest) : []
  const isClosed = (date: Date) => {
    const candidate = toDay(date)
    return (minDay !== undefined && candidate < minDay) || (maxDay !== undefined && candidate > maxDay) || openTimes(hours, candidate, earliest).length === 0
  }

  useEffect(() => {
    // Desktop: bring the selected time into view in the time column. (The phone sheet starts at the calendar.)
    if (mode !== 'popover') return
    const frame = requestAnimationFrame(() => timeList.current?.querySelector('[data-selected]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' }))
    return () => cancelAnimationFrame(frame)
  }, [mode])

  const format = (options: Intl.DateTimeFormatOptions) => (selected ? new Intl.DateTimeFormat(intlLocale, options).format(selected) : m.search.pickDate)
  const selectDay = (date: Date | undefined) => {
    if (!date) return
    const wanted = `${toDay(date)}T${time}`
    onChange(snapToOpen(wanted, hours, { earliest, searchDays: 0 }) ?? wanted)
    // On phones the next step is the time.
    if (mode === 'sheet') setStep('time')
  }
  const calendar = (className: string) => (
    <Calendar
      mode="single"
      locale={DAY_PICKER_LOCALES[locale]}
      weekStartsOn={1}
      selected={selected}
      defaultMonth={selected}
      startMonth={minDay ? toDate(minDay) : undefined}
      endMonth={maxDay ? toDate(maxDay) : undefined}
      disabled={isClosed}
      onSelect={selectDay}
      className={className}
    />
  )
  const timeButton = (option: string, onPick: () => void, large: boolean) => (
    <button
      key={option}
      type="button"
      data-selected={option === time ? '' : undefined}
      aria-pressed={option === time}
      onClick={onPick}
      className={cn(
        'shrink-0 rounded-lg tabular-nums transition-colors',
        large ? 'h-11 border text-base' : 'px-3 py-1.5 text-sm',
        option === time ? 'bg-primary text-primary-foreground border-primary font-semibold' : 'hover:bg-brand-50 text-brand-950',
      )}
    >
      {option}
    </button>
  )

  return (
    <>
      <Popover open={mode === 'popover'} onOpenChange={(open) => setMode(open ? 'popover' : 'closed')}>
        <PopoverAnchor asChild>
          <button
            id={id}
            type="button"
            data-invalid={invalid ? '' : undefined}
            aria-haspopup="dialog"
            aria-expanded={mode !== 'closed'}
            data-state={mode === 'closed' ? 'closed' : 'open'}
            ref={trigger}
            onClick={() => {
              setStep('day')
              setMode((current) => (current !== 'closed' ? 'closed' : window.matchMedia(DESKTOP_QUERY).matches ? 'popover' : 'sheet'))
            }}
            className={cn(
              'group hover:border-brand-300 data-[state=open]:border-brand-500 data-[state=open]:ring-brand-500/15 flex w-full flex-col items-start rounded-xl border bg-white text-left transition-[border-color,box-shadow] outline-none focus-visible:ring-4 focus-visible:ring-ring/30 data-[state=open]:ring-4 data-[invalid]:border-destructive',
              compact ? 'gap-0.5 px-3.5 py-2' : 'gap-1 px-4 py-3',
            )}
          >
            <span className="text-muted-foreground text-xs font-semibold">{label}</span>
            <span className="text-brand-950 flex w-full items-center gap-2 font-bold">
              <CalendarDays className="text-brand-500 size-4 shrink-0" />
              <span className="truncate">{format({ weekday: 'short', day: 'numeric', month: 'short' })}</span>
              <span className="text-brand-900/25 font-normal">|</span>
              <span className="tabular-nums">{time}</span>
            </span>
          </button>
        </PopoverAnchor>
        <PopoverContent
          align="start"
          className="flex w-auto flex-row p-0"
          // The field itself toggles the popover; don't treat clicks on it as "outside".
          onInteractOutside={(event) => trigger.current?.contains(event.target as Node) && event.preventDefault()}
        >
          {calendar('[--cell-size:--spacing(9)]')}
          <div className="w-28 border-l">
            <p className="text-muted-foreground flex items-center gap-1.5 px-3 pt-3 pb-2 text-xs font-semibold">
              <Clock className="size-3.5" />
              {m.search.time}
            </p>
            <div ref={mode === 'popover' ? timeList : undefined} className="flex max-h-[18rem] flex-col gap-1 overflow-y-auto px-2 pb-3">
              {times.map((option) =>
                timeButton(
                  option,
                  () => {
                    onChange(`${day}T${option}`)
                    setMode('closed')
                  },
                  false,
                ),
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Sheet open={mode === 'sheet'} onOpenChange={(open) => setMode(open ? 'sheet' : 'closed')}>
        <SheetContent side="bottom" className="max-h-[92dvh] gap-0 overflow-y-auto rounded-t-3xl p-0" onOpenAutoFocus={(event) => event.preventDefault()}>
          <SheetHeader className="border-b px-5 pt-5 pb-4 text-left">
            <SheetTitle className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{label}</SheetTitle>
            <SheetDescription className="text-brand-950 text-xl font-extrabold">
              {format({ weekday: 'long', day: 'numeric', month: 'long' })} · <span className="tabular-nums">{time}</span>
            </SheetDescription>
          </SheetHeader>
          <div role="tablist" className="bg-muted mx-5 mt-4 grid grid-cols-2 gap-1 rounded-xl p-1">
            {(
              [
                { value: 'day', icon: CalendarDays, label: format({ weekday: 'short', day: 'numeric', month: 'short' }) },
                { value: 'time', icon: Clock, label: time },
              ] as const
            ).map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={step === tab.value}
                onClick={() => setStep(tab.value)}
                className={cn(
                  'flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold tabular-nums transition-colors',
                  step === tab.value ? 'text-brand-950 bg-white shadow-sm' : 'text-muted-foreground',
                )}
              >
                <tab.icon className="size-4" />
                {tab.label}
              </button>
            ))}
          </div>
          {step === 'day' ? (
            <div className="flex justify-center px-2 py-2">{calendar('w-full [--cell-size:min(calc((100vw-2.5rem)/7),2.9rem)]')}</div>
          ) : (
            <div ref={mode === 'sheet' ? timeList : undefined} className="grid grid-cols-4 gap-2 px-5 py-4">
              {times.map((option) =>
                timeButton(
                  option,
                  () => {
                    onChange(`${day}T${option}`)
                    setMode('closed')
                  },
                  true,
                ),
              )}
            </div>
          )}
          <div className="sticky bottom-0 border-t bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button type="button" onClick={() => setMode('closed')} className="bg-brand-600 hover:bg-brand-700 h-12 w-full rounded-xl text-base font-bold">
              {m.search.done}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
