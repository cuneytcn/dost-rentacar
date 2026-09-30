'use client'

import { CalendarIcon, X } from 'lucide-react'
import { useState } from 'react'
import type { DateRange } from 'react-day-picker'
import { enGB, tr } from 'react-day-picker/locale'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { text } from '@/i18n/admin'

import { useAdminLang, useT } from '../lang-context'
import { intlLocale, type AdminLang } from '../lang'

/**
 * Date and time pickers for the panel. Values keep the plain string formats the forms and
 * server actions already use (`YYYY-MM-DD`, `HH:mm`, `YYYY-MM-DDTHH:mm`), so they are drop-in
 * replacements for the native inputs while rendering the same in every browser and language.
 */

const copy = {
  pickDate: text('Pick a date', 'Tarih seçin'),
  pickRange: text('Any date', 'Tüm tarihler'),
  time: text('Time', 'Saat'),
  clear: text('Clear', 'Temizle'),
}

const DAY_PICKER_LOCALES = { tr, en: enGB }

/** Calendar days are handled as local noon so no time zone can shift them to the neighbouring day. */
function parseDay(value: string | null | undefined): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}/.test(value)) return undefined
  return new Date(`${value.slice(0, 10)}T12:00:00`)
}

function formatDay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function displayDay(value: string, lang: AdminLang): string {
  const date = parseDay(value)
  return date ? new Intl.DateTimeFormat(intlLocale(lang), { day: 'numeric', month: 'short', year: 'numeric', weekday: 'short' }).format(date) : ''
}

/** Locale, week start and month names in the panel language for any `<Calendar>`. */
export function useCalendarProps() {
  const lang = useAdminLang()
  return {
    locale: DAY_PICKER_LOCALES[lang],
    weekStartsOn: 1 as const,
    formatters: { formatMonthDropdown: (date: Date) => new Intl.DateTimeFormat(intlLocale(lang), { month: 'short' }).format(date) },
  }
}

type DatePickerProps = {
  id?: string
  value: string | null | undefined
  onChange: (value: string) => void
  onBlur?: () => void
  disabled?: boolean
  invalid?: boolean
  placeholder?: string
  /** `YYYY-MM-DD` bounds; days outside are disabled. */
  min?: string
  max?: string
  /** Month/year dropdowns for dates far from today, such as birth dates. */
  years?: { from: number; to: number }
  clearable?: boolean
  className?: string
}

export function DatePicker({ id, value, onChange, onBlur, disabled, invalid, placeholder, min, max, years, clearable, className }: DatePickerProps) {
  const lang = useAdminLang()
  const t = useT()
  const calendar = useCalendarProps()
  const [open, setOpen] = useState(false)
  const selected = parseDay(value)
  const minDay = parseDay(min)
  const maxDay = parseDay(max)

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) onBlur?.()
      }}
    >
      <div className={cn('relative', className)}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-invalid={invalid}
            className={cn(
              'w-full justify-start px-3 font-normal aria-invalid:border-destructive aria-invalid:ring-destructive/20',
              !selected && 'text-muted-foreground',
              clearable && selected && 'pr-9',
            )}
          >
            <CalendarIcon className="text-muted-foreground" />
            <span className="truncate">{selected ? displayDay(value!, lang) : (placeholder ?? t(copy.pickDate))}</span>
          </Button>
        </PopoverTrigger>
        {clearable && selected && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t(copy.clear)}
            className="text-muted-foreground absolute top-1/2 right-1 size-7 -translate-y-1/2"
            onClick={() => onChange('')}
          >
            <X />
          </Button>
        )}
      </div>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          {...calendar}
          mode="single"
          selected={selected}
          defaultMonth={selected ?? minDay ?? (years ? new Date(years.to, 0, 1) : undefined)}
          captionLayout={years ? 'dropdown' : 'label'}
          startMonth={years ? new Date(years.from, 0) : undefined}
          endMonth={years ? new Date(years.to, 11) : undefined}
          disabled={[...(minDay ? [{ before: minDay }] : []), ...(maxDay ? [{ after: maxDay }] : [])]}
          onSelect={(date) => {
            if (!date) return
            onChange(formatDay(date))
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

const TIME_OPTIONS = Array.from({ length: 96 }, (_, index) => `${String(Math.floor(index / 4)).padStart(2, '0')}:${String((index % 4) * 15).padStart(2, '0')}`)

type TimeSelectProps = {
  id?: string
  value: string | null | undefined
  onChange: (value: string) => void
  disabled?: boolean
  invalid?: boolean
  className?: string
}

/** Quarter-hour time picker (`HH:mm`). A stored value off the grid is still shown and kept. */
export function TimeSelect({ id, value, onChange, disabled, invalid, className }: TimeSelectProps) {
  const t = useT()
  const current = value ? value.slice(0, 5) : ''
  const options = current && !TIME_OPTIONS.includes(current) ? [...TIME_OPTIONS, current].sort() : TIME_OPTIONS
  return (
    <Select value={current} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={id} aria-invalid={invalid} aria-label={t(copy.time)} className={cn('w-24 tabular-nums', className)}>
        <SelectValue placeholder="--:--" />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {options.map((option) => (
          <SelectItem key={option} value={option} className="tabular-nums">
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

type DateTimePickerProps = {
  id?: string
  value: string | null | undefined
  onChange: (value: string) => void
  onBlur?: () => void
  disabled?: boolean
  invalid?: boolean
  /** `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm`; earlier days are disabled. */
  min?: string
  /** Time used when a day is picked before any time is set. */
  defaultTime?: string
  className?: string
}

/** Date + time (`YYYY-MM-DDTHH:mm`), shown as a day picker and a quarter-hour select side by side. */
export function DateTimePicker({ id, value, onChange, onBlur, disabled, invalid, min, defaultTime = '10:00', className }: DateTimePickerProps) {
  const [day = '', time = ''] = (value ?? '').split('T')
  return (
    <div className={cn('flex gap-2', className)}>
      <DatePicker
        id={id}
        className="min-w-0 flex-1"
        value={day}
        min={min?.slice(0, 10)}
        disabled={disabled}
        invalid={invalid}
        onBlur={onBlur}
        onChange={(next) => onChange(next ? `${next}T${time || defaultTime}` : '')}
      />
      <TimeSelect value={time} disabled={disabled || !day} invalid={invalid} onChange={(next) => onChange(`${day}T${next}`)} />
    </div>
  )
}

type DateRangePickerProps = {
  from: string | null | undefined
  to: string | null | undefined
  onChange: (range: { from: string | null; to: string | null }) => void
  placeholder?: string
  className?: string
}

/** Two-month range picker for list filters; both ends are optional `YYYY-MM-DD` values. */
export function DateRangePicker({ from, to, onChange, placeholder, className }: DateRangePickerProps) {
  const lang = useAdminLang()
  const t = useT()
  const calendar = useCalendarProps()
  const [open, setOpen] = useState(false)
  const selected: DateRange | undefined = from || to ? { from: parseDay(from), to: parseDay(to) } : undefined
  // Picks stay local while the popover is open so a filter refresh between the two clicks cannot reset them.
  const [draft, setDraft] = useState<DateRange | undefined>(selected)
  const commit = (range: DateRange | undefined) => onChange({ from: range?.from ? formatDay(range.from) : null, to: range?.to ? formatDay(range.to) : null })
  const format = new Intl.DateTimeFormat(intlLocale(lang), { day: 'numeric', month: 'short', year: 'numeric' })
  const label = selected?.from
    ? selected.to
      ? format.formatRange(selected.from, selected.to)
      : `${format.format(selected.from)} –`
    : selected?.to
      ? `– ${format.format(selected.to)}`
      : null

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft(selected)
        else if (draft?.from && (draft.from.getTime() !== selected?.from?.getTime() || draft.to?.getTime() !== selected?.to?.getTime())) commit(draft)
        setOpen(next)
      }}
    >
      <div className={cn('relative', className)}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className={cn('w-full justify-start px-3 font-normal', !label && 'text-muted-foreground', label && 'pr-9')}>
            <CalendarIcon className="text-muted-foreground" />
            <span className="truncate">{label ?? placeholder ?? t(copy.pickRange)}</span>
          </Button>
        </PopoverTrigger>
        {label && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t(copy.clear)}
            className="text-muted-foreground absolute top-1/2 right-1 size-7 -translate-y-1/2"
            onClick={() => onChange({ from: null, to: null })}
          >
            <X />
          </Button>
        )}
      </div>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          {...calendar}
          mode="range"
          numberOfMonths={2}
          showOutsideDays={false}
          selected={draft}
          defaultMonth={selected?.from ?? selected?.to}
          onSelect={(range) => {
            setDraft(range)
            if (range?.from && range.to && range.from.getTime() !== range.to.getTime()) {
              commit(range)
              setOpen(false)
            }
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

/** Year ranges for dropdown captions on dates of people and documents. */
export const BIRTH_YEARS = { from: 1930, to: new Date().getFullYear() - 18 }
export const PAST_YEARS = { from: 1960, to: new Date().getFullYear() }
