'use client'

import { AlertOctagon, Check, ChevronsUpDown, Loader2, UserPlus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { text } from '@/i18n/admin'

import { useT } from '../../lang-context'
import { searchCustomersAction, type CustomerHit } from '../create-actions'

const copy = {
  placeholder: text('Search existing customer…', 'Kayıtlı müşteri ara…'),
  search: text('Name, email or phone', 'Ad, e-posta veya telefon'),
  typeMore: text('Type at least 2 characters.', 'En az 2 karakter yazın.'),
  none: text('No customer found.', 'Müşteri bulunamadı.'),
  createNew: text('New customer', 'Yeni müşteri'),
  rentals: text('rentals', 'kiralama'),
  blacklisted: text('Blacklisted', 'Kara liste'),
}

export function CustomerPicker({
  value,
  onSelect,
  onCreateNew,
}: {
  value: CustomerHit | null
  onSelect: (customer: CustomerHit) => void
  onCreateNew: (query: string) => void
}) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CustomerHit[]>([])
  const [loading, setLoading] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const search = (next: string) => {
    setQuery(next)
    clearTimeout(timer.current)
    if (next.trim().length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    timer.current = setTimeout(async () => {
      const result = await searchCustomersAction(next)
      setResults(result.ok ? result.data : [])
      setLoading(false)
    }, 250)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="h-auto min-h-10 w-full justify-between py-2 font-normal">
          {value ? (
            <span className="flex flex-col items-start text-left">
              <span className="font-medium">{value.fullName}</span>
              <span className="text-muted-foreground text-xs">
                {value.phone} · {value.email}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">{t(copy.placeholder)}</span>
          )}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-80 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder={t(copy.search)} value={query} onValueChange={search} />
          <CommandList>
            {loading && (
              <div className="flex justify-center py-6">
                <Loader2 className="text-muted-foreground size-4 animate-spin" />
              </div>
            )}
            {!loading && query.trim().length < 2 && <div className="text-muted-foreground py-6 text-center text-sm">{t(copy.typeMore)}</div>}
            {!loading && query.trim().length >= 2 && results.length === 0 && (
              <div className="text-muted-foreground py-6 text-center text-sm">{t(copy.none)}</div>
            )}
            {!loading && results.length > 0 && (
              <CommandGroup>
                {results.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    value={String(customer.id)}
                    onSelect={() => {
                      onSelect(customer)
                      setOpen(false)
                    }}
                    className="flex items-start gap-2"
                  >
                    <Check className={value?.id === customer.id ? 'mt-0.5 opacity-100' : 'mt-0.5 opacity-0'} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{customer.fullName}</span>
                        {customer.isBlacklisted && (
                          <Badge variant="destructive" className="h-5 gap-1 px-1.5">
                            <AlertOctagon className="size-3" />
                            {t(copy.blacklisted)}
                          </Badge>
                        )}
                      </div>
                      <div className="text-muted-foreground truncate text-xs">
                        {customer.phone} · {customer.email} · {customer.reservations} {t(copy.rentals)}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            <CommandGroup className="border-t">
              <CommandItem
                value="__new__"
                onSelect={() => {
                  onCreateNew(query)
                  setOpen(false)
                }}
              >
                <UserPlus />
                {t(copy.createNew)}
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
