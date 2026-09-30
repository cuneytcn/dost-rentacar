'use client'

import { Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

import { useQueryParams } from './use-query-params'

/** Debounced search box bound to the `q` URL param. */
export function SearchInput({ placeholder, className }: { placeholder: string; className?: string }) {
  const { get, update } = useQueryParams()
  const [value, setValue] = useState(get('q'))
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const onChange = (next: string) => {
    setValue(next)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => update({ q: next.trim() || null }), 300)
  }

  return (
    <div className={cn('relative', className)}>
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="pr-8 pl-8" />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
          aria-label="Clear"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}
