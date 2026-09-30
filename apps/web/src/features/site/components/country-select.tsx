'use client'

import { Check, ChevronsUpDown } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

import { countryOptions } from '../countries'
import { useSite } from '../site-context'

type Props = { id?: string; value: string; onChange: (code: string) => void; invalid?: boolean }

function flag(code: string): string {
  return String.fromCodePoint(...[...code].map((char) => 0x1f1e6 + char.charCodeAt(0) - 65))
}

/** Searchable country picker with localized names and the most common countries first. */
export function CountrySelect({ id, value, onChange, invalid }: Props) {
  const { intlLocale, m } = useSite()
  const [open, setOpen] = useState(false)
  const options = useMemo(() => countryOptions(intlLocale), [intlLocale])
  const selected = options.find((option) => option.code === value)

  const item = (option: (typeof options)[number]) => (
    <CommandItem
      key={option.code}
      value={`${option.name} ${option.code}`}
      onSelect={() => {
        onChange(option.code)
        setOpen(false)
      }}
    >
      <span className="text-base leading-none">{flag(option.code)}</span>
      {option.name}
      {option.code === value && <Check className="text-primary ml-auto" />}
    </CommandItem>
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        aria-invalid={invalid}
        className={cn(
          'border-input hover:border-brand-300 aria-invalid:border-destructive flex h-11 w-full items-center gap-2.5 rounded-xl border bg-white px-3.5 text-left text-sm outline-none focus-visible:ring-4 focus-visible:ring-ring/30',
          !selected && 'text-muted-foreground',
        )}
      >
        {selected && <span className="text-base leading-none">{flag(selected.code)}</span>}
        <span className="flex-1 truncate">{selected?.name ?? m.booking.country}</span>
        <ChevronsUpDown className="text-muted-foreground size-4" />
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder={m.booking.country} />
          <CommandList className="max-h-72">
            <CommandEmpty>—</CommandEmpty>
            <CommandGroup>{options.filter((option) => option.common).map(item)}</CommandGroup>
            <CommandSeparator />
            <CommandGroup>{options.filter((option) => !option.common).map(item)}</CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
