'use client'

import { Check, Loader2, Send } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useState } from 'react'

import type { VehicleCategoryDto } from '@rent/shared'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

import { fieldErrors, postApi } from '../api'
import { CountrySelect } from '../components/country-select'
import { DateInput } from '../components/date-input'
import { Turnstile } from '../components/turnstile'
import { COUNTRY_BY_LOCALE } from '../countries'
import { useSite } from '../site-context'

const DURATIONS = [3, 6, 12, 24, 36]
const REQUIRED = ['companyName', 'contactName', 'email', 'phone', 'country', 'vehicleCount', 'startDate'] as const

type Props = { categories: VehicleCategoryDto[]; privacyHref: string | null }

export function CorporateForm({ categories, privacyHref }: Props) {
  const { m, locale, plural } = useSite()
  const thisYear = new Date().getFullYear()
  const [values, setValues] = useState({
    companyName: '',
    taxNumber: '',
    contactName: '',
    email: '',
    phone: '',
    country: COUNTRY_BY_LOCALE[locale] ?? 'TR',
    vehicleCount: '1',
    startDate: '',
    notes: '',
  })
  const [duration, setDuration] = useState(12)
  const [categoryIds, setCategoryIds] = useState<number[]>([])
  const [acceptPrivacy, setAcceptPrivacy] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string>()
  const [invalid, setInvalid] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const onCaptcha = useCallback((token: string | undefined) => setCaptchaToken(token), [])

  const set = (key: keyof typeof values, value: string) => {
    setValues((current) => ({ ...current, [key]: value }))
    setInvalid((current) => new Set([...current].filter((item) => item !== key)))
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const missing = new Set<string>(REQUIRED.filter((key) => !values[key].trim()))
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) missing.add('email')
    if (!acceptPrivacy) missing.add('acceptPrivacy')
    setInvalid(missing)
    if (missing.size) return setError(m.errors.validation_error)

    setSending(true)
    setError(null)
    const result = await postApi('/corporate-requests', {
      companyName: values.companyName.trim(),
      taxNumber: values.taxNumber.trim() || undefined,
      contactName: values.contactName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      country: values.country,
      vehicleCount: Math.max(1, Number(values.vehicleCount) || 1),
      vehicleCategoryIds: categoryIds,
      startDate: values.startDate,
      durationMonths: duration,
      notes: values.notes.trim() || undefined,
      locale,
      acceptPrivacy: true,
      captchaToken,
    })
    setSending(false)
    if (result.ok) return setSent(true)
    if (result.error.code === 'validation_error') setInvalid(fieldErrors(result.error))
    setError(m.errors[result.error.code as keyof typeof m.errors] ?? m.errors.internal_error)
  }

  if (sent) {
    return (
      <div className="rounded-3xl border bg-white p-8 text-center sm:p-12">
        <span className="bg-success/10 text-success mx-auto flex size-16 items-center justify-center rounded-full">
          <Check className="size-8" strokeWidth={3} />
        </span>
        <h2 className="text-brand-950 mt-5 text-2xl font-extrabold">{m.corporate.successTitle}</h2>
        <p className="text-muted-foreground mt-2">{m.corporate.successText}</p>
      </div>
    )
  }

  const input = (key: keyof typeof values, label: string, props: React.ComponentProps<typeof Input> = {}, optional = false) => (
    <div className="grid gap-2">
      <Label htmlFor={`corporate-${key}`} className="text-brand-900 text-sm font-semibold">
        {label}
        {optional && <span className="text-muted-foreground font-normal">({m.booking.optional})</span>}
      </Label>
      <Input
        id={`corporate-${key}`}
        value={values[key]}
        aria-invalid={invalid.has(key)}
        onChange={(event) => set(key, event.target.value)}
        className="h-11 rounded-xl bg-white"
        {...props}
      />
    </div>
  )
  const [privacyBefore, privacyAfter] = m.corporate.acceptPrivacy.split('{link}')

  return (
    <form onSubmit={submit} noValidate className="space-y-5 rounded-3xl border bg-white p-6 sm:p-8">
      <div>
        <h2 className="text-brand-950 text-2xl font-extrabold">{m.corporate.formTitle}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{m.corporate.formSubtitle}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {input('companyName', m.corporate.companyName, { autoComplete: 'organization' })}
        {input('taxNumber', m.corporate.taxNumber, {}, true)}
        {input('contactName', m.corporate.contactName, { autoComplete: 'name' })}
        {input('email', m.corporate.email, { type: 'email', autoComplete: 'email' })}
        {input('phone', m.corporate.phone, { type: 'tel', autoComplete: 'tel' })}
        <div className="grid gap-2">
          <Label htmlFor="corporate-country" className="text-brand-900 text-sm font-semibold">
            {m.corporate.country}
          </Label>
          <CountrySelect id="corporate-country" value={values.country} onChange={(country) => set('country', country)} invalid={invalid.has('country')} />
        </div>
        {input('vehicleCount', m.corporate.vehicleCount, { type: 'number', min: 1, max: 500, inputMode: 'numeric' })}
        <div className="grid gap-2">
          <Label htmlFor="corporate-startDate" className="text-brand-900 text-sm font-semibold">
            {m.corporate.startDate}
          </Label>
          <DateInput id="corporate-startDate" value={values.startDate} fromYear={thisYear} toYear={thisYear + 2} invalid={invalid.has('startDate')} onChange={(date) => set('startDate', date)} />
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label className="text-brand-900 text-sm font-semibold">{m.corporate.duration}</Label>
          <Select value={String(duration)} onValueChange={(value) => setDuration(Number(value))}>
            <SelectTrigger className="h-11! w-full rounded-xl bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DURATIONS.map((months) => (
                <SelectItem key={months} value={String(months)}>
                  {plural(m.corporate.months, months)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {categories.length > 0 && (
          <div className="grid gap-2 sm:col-span-2">
            <Label className="text-brand-900 text-sm font-semibold">
              {m.corporate.categories}
              <span className="text-muted-foreground font-normal">({m.booking.optional})</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const active = categoryIds.includes(category.id)
                return (
                  <button
                    key={category.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setCategoryIds((current) => (active ? current.filter((id) => id !== category.id) : [...current, category.id]))}
                    className={cn(
                      'flex h-9 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors',
                      active ? 'border-brand-600 bg-brand-600 text-white' : 'text-brand-900 hover:border-brand-300 bg-white',
                    )}
                  >
                    {active && <Check className="size-3.5" strokeWidth={3} />}
                    {category.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="corporate-notes" className="text-brand-900 text-sm font-semibold">
            {m.corporate.notes}
            <span className="text-muted-foreground font-normal">({m.booking.optional})</span>
          </Label>
          <Textarea id="corporate-notes" value={values.notes} onChange={(event) => set('notes', event.target.value)} maxLength={2000} className="min-h-24 rounded-xl bg-white" />
        </div>
      </div>
      <div>
        <div className="text-brand-900 flex items-start gap-3 text-sm leading-relaxed">
          <Checkbox
            id="corporate-privacy"
            checked={acceptPrivacy}
            aria-invalid={invalid.has('acceptPrivacy')}
            onCheckedChange={(value) => {
              setAcceptPrivacy(value === true)
              if (value) setInvalid((current) => new Set([...current].filter((item) => item !== 'acceptPrivacy')))
            }}
            className="mt-0.5 size-5 rounded-[5px]"
          />
          <label htmlFor="corporate-privacy" className="cursor-pointer">
            {privacyBefore}
            {privacyHref ? (
              <Link href={privacyHref} target="_blank" className="text-brand-600 font-semibold underline underline-offset-2">
                {m.booking.privacyLink}
              </Link>
            ) : (
              <span className="font-semibold">{m.booking.privacyLink}</span>
            )}
            {privacyAfter}
          </label>
        </div>
      </div>
      <Turnstile onToken={onCaptcha} locale={locale} />
      {error && (
        <p role="alert" className="bg-destructive/5 text-destructive rounded-xl px-4 py-3 text-sm font-medium">
          {error}
        </p>
      )}
      <Button type="submit" disabled={sending} className="bg-brand-600 hover:bg-brand-700 h-12 w-full rounded-xl text-base font-bold sm:w-auto sm:px-8">
        {sending ? <Loader2 className="animate-spin" /> : <Send />}
        {sending ? m.corporate.submitting : m.corporate.submit}
      </Button>
    </form>
  )
}
