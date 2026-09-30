'use client'

import { useState } from 'react'

import { Input } from '@/components/ui/input'
import { formatMoneyInput, parseMoneyInput } from '@/lib/money-input'
import { cn } from '@/lib/utils'

import { intlLocale } from '../lang'
import { useAdminLang } from '../lang-context'

/** Decimal money input ("45,50") that reports integer minor units (4550), or null when empty/invalid. */
export function MoneyInput({
  value,
  onChange,
  currency,
  id,
  className,
  autoFocus,
}: {
  value: number | null
  onChange: (minor: number | null) => void
  currency: string
  id?: string
  className?: string
  autoFocus?: boolean
}) {
  const lang = useAdminLang()
  const [textValue, setTextValue] = useState(() => formatMoneyInput(value, intlLocale(lang)))
  const [invalid, setInvalid] = useState(false)

  return (
    <div className={cn('relative', className)}>
      <Input
        id={id}
        inputMode="decimal"
        autoFocus={autoFocus}
        value={textValue}
        aria-invalid={invalid}
        placeholder="0,00"
        className="pr-14 tabular-nums"
        onChange={(event) => {
          setTextValue(event.target.value)
          const parsed = parseMoneyInput(event.target.value)
          setInvalid(parsed === 'invalid')
          onChange(parsed === 'invalid' ? null : parsed)
        }}
        onBlur={() => {
          const parsed = parseMoneyInput(textValue)
          if (parsed !== 'invalid') setTextValue(formatMoneyInput(parsed, intlLocale(lang)))
        }}
      />
      <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm">{currency}</span>
    </div>
  )
}
