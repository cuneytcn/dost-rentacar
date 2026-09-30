'use client'

import { CalendarDays } from 'lucide-react'
import { useState } from 'react'
import { de, enGB, ru, tr } from 'react-day-picker/locale'

import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

import { useSite } from '../site-context'

const DAY_PICKER_LOCALES = { tr, en: enGB, de, ru }

type Props = {
  id?: string
  value: string
  onChange: (value: string) => void
  /** Year range for the month/year dropdowns. */
  fromYear: number
  toYear: number
  invalid?: boolean
  placeholder?: string
}

/** Date of birth / licence date: calendar with month and year dropdowns, value `YYYY-MM-DD`. */
export function DateInput({ id, value, onChange, fromYear, toYear, invalid, placeholder }: Props) {
  const { locale, intlLocale, m } = useSite()
  const [open, setOpen] = useState(false)
  const selected = value ? new Date(`${value}T12:00:00`) : undefined
  const label = selected ? new Intl.DateTimeFormat(intlLocale, { day: 'numeric', month: 'long', year: 'numeric' }).format(selected) : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        aria-invalid={invalid}
        className={cn(
          'border-input hover:border-brand-300 aria-invalid:border-destructive flex h-11 w-full items-center gap-2.5 rounded-xl border bg-white px-3.5 text-left text-sm outline-none focus-visible:ring-4 focus-visible:ring-ring/30',
          !label && 'text-muted-foreground',
        )}
      >
        <CalendarDays className="text-brand-500 size-4 shrink-0" />
        <span className="truncate">{label ?? placeholder ?? m.search.pickDate}</span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={DAY_PICKER_LOCALES[locale]}
          weekStartsOn={1}
          captionLayout="dropdown"
          startMonth={new Date(fromYear, 0)}
          endMonth={new Date(toYear, 11)}
          defaultMonth={selected ?? new Date(toYear, 0)}
          selected={selected}
          formatters={{ formatMonthDropdown: (date) => new Intl.DateTimeFormat(intlLocale, { month: 'short' }).format(date) }}
          onSelect={(date) => {
            if (!date) return
            onChange(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
