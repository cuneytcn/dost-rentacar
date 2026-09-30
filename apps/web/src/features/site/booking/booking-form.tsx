'use client'

import { ArrowLeft, Building2, Landmark, Loader2, Minus, Plus, Store } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { ExtraDto, PreferredPaymentMethod, PublicSettings, Quote, ReservationSummary } from '@rent/shared'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

import { fieldErrors, postApi, violationCodes } from '../api'
import { CountrySelect } from '../components/country-select'
import { DateInput } from '../components/date-input'
import { Turnstile } from '../components/turnstile'
import { COUNTRY_BY_LOCALE } from '../countries'
import { carSearchQuery, type CarSearch } from '../search'
import { useSite } from '../site-context'
import { BookingConfirmation } from './booking-confirmation'
import { BookingSummary } from './booking-summary'

type Props = {
  model: { id: number; slug: string; name: string; imageUrl: string | null; category: string | null; minDriverAge: number }
  search: CarSearch
  rental: { pickupLocationId: number; returnLocationId: number; pickupAt: string; returnAt: string }
  pickupName: string
  returnName: string
  extras: ExtraDto[]
  initialQuote: Quote
  bankAccounts: PublicSettings['bankAccounts']
  exchangeRates: PublicSettings['exchangeRates']
  termsHref: string | null
  privacyHref: string | null
}

type Driver = {
  firstName: string
  lastName: string
  email: string
  phone: string
  country: string
  birthDate: string
  licenseIssuedAt: string
}

const REQUIRED: (keyof Driver)[] = ['firstName', 'lastName', 'email', 'phone', 'country', 'birthDate', 'licenseIssuedAt']
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function BookingForm(props: Props) {
  const { model, search, rental, extras, initialQuote } = props
  const { m, locale, href, fmt, price, violation } = useSite()
  const thisYear = new Date().getFullYear()

  const [quantities, setQuantities] = useState<Record<number, number>>({})
  const [quote, setQuote] = useState(initialQuote)
  const [quoting, setQuoting] = useState(false)
  const [driver, setDriver] = useState<Driver>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: COUNTRY_BY_LOCALE[locale] ?? '',
    birthDate: '',
    licenseIssuedAt: '',
  })
  const [flightNumber, setFlightNumber] = useState('')
  const [note, setNote] = useState('')
  const [payment, setPayment] = useState<PreferredPaymentMethod>('office')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptPrivacy, setAcceptPrivacy] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string>()
  const [invalid, setInvalid] = useState<Set<string>>(new Set())
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState<ReservationSummary | null>(null)
  const quoteRequest = useRef(0)
  const lastExtrasKey = useRef('[]')

  const selectedExtras = Object.entries(quantities)
    .filter(([, quantity]) => quantity > 0)
    .map(([extraId, quantity]) => ({ extraId: Number(extraId), quantity }))

  // Re-price whenever extras change; the latest request wins.
  const extrasKey = JSON.stringify(selectedExtras)
  useEffect(() => {
    if (extrasKey === lastExtrasKey.current) return
    lastExtrasKey.current = extrasKey
    const request = ++quoteRequest.current
    setQuoting(true)
    const timer = setTimeout(async () => {
      const result = await postApi<{ quote: Quote | null }>('/quotes', { ...rental, vehicleModelId: model.id, extras: JSON.parse(extrasKey) }, locale)
      if (request !== quoteRequest.current) return
      if (result.ok && result.data.quote) setQuote(result.data.quote)
      setQuoting(false)
    }, 250)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the quote only depends on the extras selection
  }, [extrasKey])

  const update = (patch: Partial<Driver>) => {
    setDriver((current) => ({ ...current, ...patch }))
    setInvalid((current) => {
      const next = new Set(current)
      Object.keys(patch).forEach((key) => next.delete(key))
      return next
    })
  }

  const accept = (set: (value: boolean) => void, key: string, value: boolean) => {
    set(value)
    if (value) setInvalid((current) => new Set([...current].filter((item) => item !== key)))
  }

  const onCaptcha = useCallback((token: string | undefined) => setCaptchaToken(token), [])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const missing = new Set<string>(REQUIRED.filter((key) => !driver[key].trim()))
    if (driver.email && !EMAIL.test(driver.email)) missing.add('email')
    if (driver.phone && driver.phone.replace(/\D/g, '').length < 6) missing.add('phone')
    if (!acceptTerms) missing.add('acceptTerms')
    if (!acceptPrivacy) missing.add('acceptPrivacy')
    setInvalid(missing)
    if (missing.size > 0) {
      setFormError(m.errors.validation_error)
      document.querySelector(`[data-field="${[...missing][0]}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setSubmitting(true)
    setFormError(null)
    const result = await postApi<ReservationSummary>('/reservations', {
      ...rental,
      vehicleModelId: model.id,
      extras: selectedExtras,
      customer: {
        firstName: driver.firstName.trim(),
        lastName: driver.lastName.trim(),
        email: driver.email.trim(),
        phone: driver.phone.trim(),
        country: driver.country,
        birthDate: driver.birthDate,
        licenseIssuedAt: driver.licenseIssuedAt,
      },
      flightNumber: flightNumber.trim() || undefined,
      customerNote: note.trim() || undefined,
      preferredPaymentMethod: payment,
      locale,
      acceptTerms: true,
      acceptPrivacy: true,
      marketingConsent: marketing,
      captchaToken,
    })
    setSubmitting(false)

    if (result.ok) {
      setConfirmed(result.data)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const { error } = result
    if (error.code === 'validation_error') {
      setInvalid(fieldErrors(error))
      setFormError(m.errors.validation_error)
    } else if (error.code === 'rule_violation') {
      const codes = violationCodes(error)
      setInvalid(new Set(codes.flatMap((code) => (code === 'driver_age' ? ['birthDate'] : code === 'license_years' ? ['licenseIssuedAt'] : []))))
      setFormError(codes.length ? codes.map((code) => violation(code)).join(' ') : m.errors.rule_violation)
    } else {
      setFormError(m.errors[error.code as keyof typeof m.errors] ?? m.errors.internal_error)
    }
  }

  if (confirmed) {
    return <BookingConfirmation reservation={confirmed} email={driver.email.trim()} bankAccounts={props.bankAccounts} exchangeRates={props.exchangeRates} />
  }

  const field = (key: keyof Driver, label: string, input: React.ReactNode, optional = false) => (
    <div className="grid gap-2" data-field={key}>
      <Label htmlFor={`driver-${key}`} className="text-brand-900 text-sm font-semibold">
        {label}
        {optional && <span className="text-muted-foreground font-normal">({m.booking.optional})</span>}
      </Label>
      {input}
      {invalid.has(key) && <p className="text-destructive text-xs font-medium">{fieldMessage(key)}</p>}
    </div>
  )
  const fieldMessage = (key: string) =>
    key === 'email' && driver.email ? m.booking.invalidEmail : key === 'phone' && driver.phone ? m.booking.invalidPhone : m.booking.required
  const textInput = (key: keyof Driver, props: React.ComponentProps<typeof Input> = {}) => (
    <Input
      id={`driver-${key}`}
      value={driver[key]}
      aria-invalid={invalid.has(key)}
      onChange={(event) => update({ [key]: event.target.value })}
      className="h-11 rounded-xl bg-white"
      {...props}
    />
  )
  const legal = (template: string, text: string, link: string | null) => {
    const [before, after] = template.split('{link}')
    return (
      <>
        {before}
        {link ? (
          <Link href={link} target="_blank" className="text-brand-600 font-semibold underline underline-offset-2">
            {text}
          </Link>
        ) : (
          <span className="font-semibold">{text}</span>
        )}
        {after}
      </>
    )
  }

  return (
    <div className="bg-surface min-h-full">
      <div className="container-site py-6 sm:py-10">
        <Link href={href(`/cars?${carSearchQuery(search)}`)} className="text-brand-700 hover:text-brand-500 inline-flex items-center gap-2 text-sm font-semibold">
          <ArrowLeft className="size-4" />
          {m.booking.changeCar}
        </Link>
        <h1 className="text-brand-950 mt-4 text-3xl font-extrabold sm:text-4xl">{m.booking.title}</h1>

        <form onSubmit={submit} noValidate className="mt-8 grid gap-8 lg:grid-cols-[1fr_24rem] lg:items-start">
          <div className="min-w-0 space-y-6">
            {extras.length > 0 && (
              <Step number={1} title={m.booking.steps.extras} subtitle={m.booking.extrasSubtitle}>
                <ul className="divide-y">
                  {extras.map((extra) => {
                    const quantity = quantities[extra.id] ?? 0
                    const setQuantity = (next: number) => setQuantities((current) => ({ ...current, [extra.id]: Math.max(0, Math.min(extra.maxQuantity, next)) }))
                    return (
                      <li key={extra.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                        <div className="min-w-0 flex-1">
                          <p className="text-brand-950 font-bold">{extra.name}</p>
                          {extra.description && <p className="text-muted-foreground mt-0.5 text-sm">{extra.description}</p>}
                          <p className="text-brand-700 mt-1 text-sm font-semibold tabular-nums">
                            {fmt(extra.pricingType === 'per_day' ? m.booking.perDay : m.booking.perRental, { price: price(extra.price.amount) })}
                          </p>
                        </div>
                        {extra.maxQuantity > 1 ? (
                          <div className="flex items-center gap-1 rounded-full border bg-white p-1">
                            <Button type="button" variant="ghost" size="icon" className="size-8 rounded-full" disabled={quantity === 0} onClick={() => setQuantity(quantity - 1)} aria-label={m.booking.remove}>
                              <Minus />
                            </Button>
                            <span className="text-brand-950 w-6 text-center font-bold tabular-nums">{quantity}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-full"
                              disabled={quantity >= extra.maxQuantity}
                              onClick={() => setQuantity(quantity + 1)}
                              aria-label={m.booking.add}
                            >
                              <Plus />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant={quantity ? 'default' : 'outline'}
                            className="h-9 min-w-24 rounded-full font-semibold"
                            onClick={() => setQuantity(quantity ? 0 : 1)}
                            aria-pressed={quantity > 0}
                          >
                            {quantity ? m.booking.remove : m.booking.add}
                          </Button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </Step>
            )}

            <Step number={extras.length ? 2 : 1} title={m.booking.steps.driver} subtitle={m.booking.driverSubtitle}>
              <div className="grid gap-4 sm:grid-cols-2">
                {field('firstName', m.booking.firstName, textInput('firstName', { autoComplete: 'given-name' }))}
                {field('lastName', m.booking.lastName, textInput('lastName', { autoComplete: 'family-name' }))}
                {field('email', m.booking.email, textInput('email', { type: 'email', autoComplete: 'email', inputMode: 'email' }))}
                {field('phone', m.booking.phone, textInput('phone', { type: 'tel', autoComplete: 'tel', inputMode: 'tel', placeholder: '+90 5xx xxx xx xx' }))}
                {field('country', m.booking.country, <CountrySelect id="driver-country" value={driver.country} invalid={invalid.has('country')} onChange={(country) => update({ country })} />)}
                {field(
                  'birthDate',
                  m.booking.birthDate,
                  <DateInput
                    id="driver-birthDate"
                    value={driver.birthDate}
                    fromYear={thisYear - 90}
                    toYear={thisYear - model.minDriverAge}
                    invalid={invalid.has('birthDate')}
                    onChange={(birthDate) => update({ birthDate })}
                  />,
                )}
                {field(
                  'licenseIssuedAt',
                  m.booking.licenseIssuedAt,
                  <DateInput
                    id="driver-licenseIssuedAt"
                    value={driver.licenseIssuedAt}
                    fromYear={thisYear - 70}
                    toYear={thisYear}
                    invalid={invalid.has('licenseIssuedAt')}
                    onChange={(licenseIssuedAt) => update({ licenseIssuedAt })}
                  />,
                )}
                <div className="grid gap-2">
                  <Label htmlFor="flight-number" className="text-brand-900 text-sm font-semibold">
                    {m.booking.flightNumber}
                    <span className="text-muted-foreground font-normal">({m.booking.optional})</span>
                  </Label>
                  <Input id="flight-number" value={flightNumber} onChange={(event) => setFlightNumber(event.target.value)} className="h-11 rounded-xl bg-white uppercase" maxLength={20} />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="customer-note" className="text-brand-900 text-sm font-semibold">
                    {m.booking.note}
                    <span className="text-muted-foreground font-normal">({m.booking.optional})</span>
                  </Label>
                  <Textarea
                    id="customer-note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder={m.booking.notePlaceholder}
                    maxLength={1000}
                    className="min-h-20 rounded-xl bg-white"
                  />
                </div>
              </div>
            </Step>

            <Step number={extras.length ? 3 : 2} title={m.booking.steps.payment} subtitle={m.booking.paymentSubtitle}>
              <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    { value: 'office', icon: Store, title: m.booking.payAtOffice, text: m.booking.payAtOfficeText },
                    // Transfers are only offered once the business has entered a bank account to pay into.
                    ...(props.bankAccounts.length > 0
                      ? [{ value: 'bank_transfer', icon: Landmark, title: m.booking.payByTransfer, text: m.booking.payByTransferText } as const]
                      : []),
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={payment === option.value}
                    onClick={() => setPayment(option.value)}
                    className={cn(
                      'flex gap-3 rounded-2xl border-2 bg-white p-4 text-left transition-colors',
                      payment === option.value ? 'border-brand-600 bg-brand-50/50' : 'hover:border-brand-200 border-transparent ring-1 ring-border',
                    )}
                  >
                    <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', payment === option.value ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600')}>
                      <option.icon className="size-5" />
                    </span>
                    <span>
                      <span className="text-brand-950 block font-bold">{option.title}</span>
                      <span className="text-muted-foreground mt-0.5 block text-sm">{option.text}</span>
                    </span>
                  </button>
                ))}
              </div>
            </Step>

            <Step number={extras.length ? 4 : 3} title={m.booking.steps.confirm}>
              <div className="space-y-4">
                <Consent id="accept-terms" checked={acceptTerms} onChange={(value) => accept(setAcceptTerms, 'acceptTerms', value)} invalid={invalid.has('acceptTerms')} message={m.booking.mustAccept}>
                  {legal(m.booking.acceptTerms, m.booking.termsLink, props.termsHref)}
                </Consent>
                <Consent id="accept-privacy" checked={acceptPrivacy} onChange={(value) => accept(setAcceptPrivacy, 'acceptPrivacy', value)} invalid={invalid.has('acceptPrivacy')} message={m.booking.mustAccept}>
                  {legal(m.booking.acceptPrivacy, m.booking.privacyLink, props.privacyHref)}
                </Consent>
                <Consent id="marketing" checked={marketing} onChange={setMarketing}>
                  {m.booking.marketing}
                </Consent>
                <Turnstile onToken={onCaptcha} locale={locale} />
              </div>
            </Step>
          </div>

          <div className="lg:sticky lg:top-24">
            <BookingSummary
              model={model}
              search={search}
              pickupName={props.pickupName}
              returnName={props.returnName}
              quote={quote}
              updating={quoting}
              footer={
                <div className="space-y-3">
                  {formError && (
                    <p role="alert" className="bg-destructive/5 text-destructive rounded-xl px-4 py-3 text-sm font-medium">
                      {formError}
                    </p>
                  )}
                  <Button type="submit" disabled={submitting || quoting} className="bg-brand-600 hover:bg-brand-700 h-12 w-full rounded-xl text-base font-bold">
                    {submitting ? (
                      <>
                        <Loader2 className="animate-spin" />
                        {m.booking.submitting}
                      </>
                    ) : (
                      m.booking.submit
                    )}
                  </Button>
                  <p className="text-muted-foreground flex items-center justify-center gap-1.5 text-center text-xs">
                    <Building2 className="size-3.5" />
                    {m.booking.paymentSubtitle}
                  </p>
                </div>
              }
            />
          </div>
        </form>
      </div>
    </div>
  )
}

function Step({ number, title, subtitle, children }: { number: number; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border bg-white p-5 sm:p-7">
      <div className="mb-5 flex gap-3">
        <span className="bg-brand-600 flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white">{number}</span>
        <div>
          <h2 className="text-brand-950 text-xl font-extrabold">{title}</h2>
          {subtitle && <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

function Consent({
  id,
  checked,
  onChange,
  invalid,
  message,
  children,
}: {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  invalid?: boolean
  message?: string
  children: React.ReactNode
}) {
  return (
    <div data-field={id === 'accept-terms' ? 'acceptTerms' : id === 'accept-privacy' ? 'acceptPrivacy' : id}>
      <div className="text-brand-900 flex items-start gap-3 text-sm leading-relaxed">
        <Checkbox id={id} checked={checked} onCheckedChange={(value) => onChange(value === true)} aria-invalid={invalid} className="mt-0.5 size-5 rounded-[5px]" />
        <label htmlFor={id} className="cursor-pointer">
          {children}
        </label>
      </div>
      {invalid && message && <p className="text-destructive mt-1 ml-8 text-xs font-medium">{message}</p>}
    </div>
  )
}
