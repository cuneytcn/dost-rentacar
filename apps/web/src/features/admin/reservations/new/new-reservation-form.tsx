'use client'

import { AlertTriangle, ArrowRight, CarFront, Loader2, Minus, Plus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { COUNTRY_SUGGESTIONS } from './countries'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { optionLabels, text, type AdminText } from '@/i18n/admin'
import { cn } from '@/lib/utils'
import type { RuleViolation } from '@/services/rental-rules'

import { formatDateTime, formatMoney } from '../../format'
import { useAdminLang, useT } from '../../lang-context'
import { BIRTH_YEARS, DatePicker, DateTimePicker, PAST_YEARS } from '../../shared/date-picker'
import { fromDateTimeLocal } from '@/lib/local-datetime'
import { createReservationAction, getModelOptionsAction, type CustomerHit, type ModelOption } from '../create-actions'
import { CustomerPicker } from './customer-picker'

export type NewReservationProps = {
  locations: { id: number; name: string }[]
  extras: { id: number; name: string; pricingType: 'per_day' | 'per_rental'; price: number; maxQuantity: number }[]
  currency: string
  defaults: { pickupAt: string; returnAt: string }
}

const copy = {
  customer: text('Customer', 'Müşteri'),
  customerHint: text('Search by name, phone or email, or add a new one.', 'Ad, telefon veya e-postayla arayın ya da yeni ekleyin.'),
  newCustomer: text('New customer', 'Yeni müşteri'),
  backToSearch: text('Search existing instead', 'Kayıtlı müşteri seç'),
  firstName: text('First name', 'Ad'),
  lastName: text('Last name', 'Soyad'),
  email: text('Email', 'E-posta'),
  phone: text('Phone', 'Telefon'),
  country: text('Country', 'Ülke'),
  birthDate: text('Birth date', 'Doğum tarihi'),
  licenseNumber: text('License number', 'Ehliyet no'),
  licenseIssuedAt: text('License issued', 'Ehliyet veriliş'),
  rental: text('Dates & locations', 'Tarih ve şube'),
  pickupLocation: text('Pickup location', 'Alış şubesi'),
  returnLocation: text('Return location', 'İade şubesi'),
  pickupAt: text('Pickup', 'Alış'),
  returnAt: text('Return', 'İade'),
  vehicle: text('Vehicle', 'Araç'),
  vehicleHint: text('Availability and prices for the selected dates.', 'Seçilen tarihler için müsaitlik ve fiyat.'),
  soldOut: text('Sold out', 'Dolu'),
  left: text('left', 'boş'),
  perDay: text('/ day', '/ gün'),
  days: text('days', 'gün'),
  extras: text('Extras', 'Ek hizmetler'),
  perRental: text('per rental', 'kiralama başına'),
  other: text('Other', 'Diğer'),
  source: text('Source', 'Kaynak'),
  language: text('Customer language', 'Müşteri dili'),
  payment: text('Payment', 'Ödeme'),
  flight: text('Flight number', 'Uçuş no'),
  note: text('Internal note', 'İç not'),
  summary: text('Summary', 'Özet'),
  noSelection: text('Choose a vehicle to see the price.', 'Fiyatı görmek için araç seçin.'),
  rentalPrice: text('Rental', 'Kiralama'),
  transferFee: text('One-way fee', 'Farklı şube ücreti'),
  total: text('Total', 'Toplam'),
  deposit: text('Deposit', 'Depozito'),
  confirmNow: text('Create as confirmed', 'Onaylı olarak oluştur'),
  confirmHint: text('The customer receives a confirmation email.', 'Müşteriye onay e-postası gider.'),
  create: text('Create reservation', 'Rezervasyonu oluştur'),
  created: text('Reservation created', 'Rezervasyon oluşturuldu'),
  missingCustomer: text('Choose or add a customer.', 'Müşteri seçin veya ekleyin.'),
  missingFields: text('Fill in the customer’s name, email and phone.', 'Müşterinin adını, e-postasını ve telefonunu girin.'),
  missingVehicle: text('Choose a vehicle.', 'Araç seçin.'),
  invalidDates: text('Return must be after pickup.', 'İade, alıştan sonra olmalı.'),
  warnings: text('Outside the website rules', 'Web sitesi kurallarının dışında'),
}

const violationCopy: Record<RuleViolation['code'], AdminText> = {
  lead_time: text('Short notice', 'Kısa süre kala'),
  too_far_ahead: text('Too far ahead', 'Çok ileri tarih'),
  min_rental_days: text('Below minimum days', 'Minimum gün altında'),
  max_rental_days: text('Above maximum days', 'Maksimum gün üstünde'),
  location_closed: text('Outside opening hours', 'Çalışma saatleri dışında'),
  driver_age: text('Driver age', 'Sürücü yaşı'),
  license_years: text('License years', 'Ehliyet yılı'),
}

type NewCustomer = {
  firstName: string
  lastName: string
  email: string
  phone: string
  country: string
  birthDate: string
  licenseNumber: string
  licenseIssuedAt: string
}

const emptyCustomer: NewCustomer = { firstName: '', lastName: '', email: '', phone: '', country: 'TR', birthDate: '', licenseNumber: '', licenseIssuedAt: '' }

export function NewReservationForm({ locations, extras, currency, defaults }: NewReservationProps) {
  const t = useT()
  const lang = useAdminLang()
  const router = useRouter()
  const [customer, setCustomer] = useState<CustomerHit | null>(null)
  const [newCustomer, setNewCustomer] = useState<NewCustomer | null>(null)
  const [pickupLocationId, setPickupLocationId] = useState(locations[0]?.id ?? 0)
  const [returnLocationId, setReturnLocationId] = useState(locations[0]?.id ?? 0)
  const [pickupAt, setPickupAt] = useState(defaults.pickupAt)
  const [returnAt, setReturnAt] = useState(defaults.returnAt)
  const [selectedExtras, setSelectedExtras] = useState<Record<number, number>>({})
  const [options, setOptions] = useState<ModelOption[] | null>(null)
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [modelId, setModelId] = useState<number | null>(null)
  const [source, setSource] = useState<'phone' | 'walk_in' | 'corporate'>('phone')
  const [locale, setLocale] = useState<'tr' | 'en' | 'de' | 'ru'>('tr')
  const [payment, setPayment] = useState<'office' | 'bank_transfer'>('office')
  const [flightNumber, setFlightNumber] = useState('')
  const [note, setNote] = useState('')
  const [confirmNow, setConfirmNow] = useState(true)
  const [pending, startTransition] = useTransition()
  const requestId = useRef(0)

  const validDates = Boolean(pickupAt && returnAt && returnAt > pickupAt)
  const extrasList = useMemo(
    () => Object.entries(selectedExtras).filter(([, quantity]) => quantity > 0).map(([extraId, quantity]) => ({ extraId: Number(extraId), quantity })),
    [selectedExtras],
  )

  // Refresh availability + prices whenever the window or extras change (debounced, latest wins).
  useEffect(() => {
    if (!validDates || !pickupLocationId || !returnLocationId) return
    const current = ++requestId.current
    const timer = setTimeout(async () => {
      setLoadingOptions(true)
      const result = await getModelOptionsAction({
        pickupLocationId,
        returnLocationId,
        pickupAt: fromDateTimeLocal(pickupAt),
        returnAt: fromDateTimeLocal(returnAt),
        extras: extrasList,
      })
      if (current !== requestId.current) return
      setLoadingOptions(false)
      if (result.ok) setOptions(result.data)
      else toast.error(result.message)
    }, 350)
    return () => clearTimeout(timer)
  }, [validDates, pickupLocationId, returnLocationId, pickupAt, returnAt, extrasList])

  const selected = options?.find((option) => option.id === modelId) ?? null
  const money = (value: number) => formatMoney(value, currency, lang)

  const submit = () => {
    if (!customer && !newCustomer) return void toast.error(t(copy.missingCustomer))
    if (newCustomer && (!newCustomer.firstName || !newCustomer.lastName || !newCustomer.email || !newCustomer.phone)) {
      return void toast.error(t(copy.missingFields))
    }
    if (!validDates) return void toast.error(t(copy.invalidDates))
    if (!modelId) return void toast.error(t(copy.missingVehicle))

    startTransition(async () => {
      const result = await createReservationAction({
        customerId: customer?.id ?? null,
        newCustomer: newCustomer
          ? {
              firstName: newCustomer.firstName,
              lastName: newCustomer.lastName,
              email: newCustomer.email,
              phone: newCustomer.phone,
              country: newCustomer.country || 'TR',
              birthDate: newCustomer.birthDate || undefined,
              licenseNumber: newCustomer.licenseNumber || undefined,
              licenseIssuedAt: newCustomer.licenseIssuedAt || undefined,
            }
          : null,
        vehicleModelId: modelId,
        window: { pickupLocationId, returnLocationId, pickupAt: fromDateTimeLocal(pickupAt), returnAt: fromDateTimeLocal(returnAt), extras: extrasList },
        source,
        status: confirmNow ? 'confirmed' : 'pending',
        preferredPaymentMethod: payment,
        flightNumber,
        internalNote: note,
        locale,
      })
      if (!result.ok) return void toast.error(result.message)
      toast.success(t(copy.created))
      router.push(`/admin/reservations/${result.data.id}`)
    })
  }

  const field = (key: keyof NewCustomer, label: AdminText, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="grid gap-2">
      <Label htmlFor={`customer-${key}`}>{t(label)}</Label>
      <Input
        id={`customer-${key}`}
        value={newCustomer?.[key] ?? ''}
        onChange={(event) => setNewCustomer((current) => ({ ...(current ?? emptyCustomer), [key]: event.target.value }))}
        {...props}
      />
    </div>
  )
  const dateField = (key: keyof NewCustomer, label: AdminText, years: { from: number; to: number }) => (
    <div className="grid gap-2">
      <Label htmlFor={`customer-${key}`}>{t(label)}</Label>
      <DatePicker
        id={`customer-${key}`}
        years={years}
        clearable
        value={newCustomer?.[key] as string | undefined}
        onChange={(value) => setNewCustomer((current) => ({ ...(current ?? emptyCustomer), [key]: value }))}
      />
    </div>
  )

  return (
    <div className="grid gap-6 p-4 md:p-6 xl:grid-cols-3">
      <div className="flex flex-col gap-6 xl:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>{t(copy.customer)}</CardTitle>
            <CardDescription>{t(copy.customerHint)}</CardDescription>
          </CardHeader>
          <CardContent>
            {newCustomer ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{t(copy.newCustomer)}</Badge>
                  <Button variant="ghost" size="sm" onClick={() => setNewCustomer(null)}>
                    <X />
                    {t(copy.backToSearch)}
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {field('firstName', copy.firstName, { autoFocus: true })}
                  {field('lastName', copy.lastName)}
                  {field('phone', copy.phone, { type: 'tel', placeholder: '+90 5xx xxx xx xx' })}
                  {field('email', copy.email, { type: 'email' })}
                  <div className="grid gap-2">
                    <Label>{t(copy.country)}</Label>
                    <Select value={newCustomer.country} onValueChange={(country) => setNewCustomer({ ...newCustomer, country })}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRY_SUGGESTIONS.map(([code, name]) => (
                          <SelectItem key={code} value={code}>
                            {name[lang]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {dateField('birthDate', copy.birthDate, BIRTH_YEARS)}
                  {field('licenseNumber', copy.licenseNumber)}
                  {dateField('licenseIssuedAt', copy.licenseIssuedAt, PAST_YEARS)}
                </div>
              </div>
            ) : (
              <CustomerPicker
                value={customer}
                onSelect={setCustomer}
                onCreateNew={(query) => {
                  setCustomer(null)
                  const isEmail = query.includes('@')
                  const isPhone = /^[+\d\s()-]{6,}$/.test(query)
                  const [firstName = '', ...rest] = isEmail || isPhone ? [] : query.trim().split(/\s+/)
                  setNewCustomer({
                    ...emptyCustomer,
                    firstName,
                    lastName: rest.join(' '),
                    email: isEmail ? query.trim() : '',
                    phone: isPhone ? query.trim() : '',
                  })
                }}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t(copy.rental)}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>{t(copy.pickupLocation)}</Label>
              <Select
                value={String(pickupLocationId)}
                onValueChange={(value) => {
                  if (returnLocationId === pickupLocationId) setReturnLocationId(Number(value))
                  setPickupLocationId(Number(value))
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={String(location.id)}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>{t(copy.returnLocation)}</Label>
              <Select value={String(returnLocationId)} onValueChange={(value) => setReturnLocationId(Number(value))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={String(location.id)}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pickup-at">{t(copy.pickupAt)}</Label>
              <DateTimePicker id="pickup-at" value={pickupAt} onChange={setPickupAt} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="return-at">{t(copy.returnAt)}</Label>
              <DateTimePicker id="return-at" value={returnAt} min={pickupAt} invalid={!validDates} onChange={setReturnAt} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {t(copy.vehicle)}
              {loadingOptions && <Loader2 className="text-muted-foreground size-4 animate-spin" />}
            </CardTitle>
            <CardDescription>{t(copy.vehicleHint)}</CardDescription>
          </CardHeader>
          <CardContent>
            {!options ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[0, 1, 2, 3].map((index) => (
                  <Skeleton key={index} className="h-24" />
                ))}
              </div>
            ) : (
              <div className={cn('grid gap-3 sm:grid-cols-2 transition-opacity', loadingOptions && 'opacity-60')}>
                {options.map((option) => {
                  const disabled = option.availableUnits < 1 || !option.quote
                  const active = option.id === modelId
                  const perDay = option.quote ? Math.round(option.quote.baseTotal / option.quote.rentalDays) : null
                  return (
                    <button
                      key={option.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => setModelId(option.id)}
                      className={cn(
                        'flex gap-3 rounded-lg border p-3 text-left transition-colors',
                        active ? 'border-primary bg-primary/5 ring-primary ring-1' : 'hover:bg-muted/50',
                        disabled && 'cursor-not-allowed opacity-50 hover:bg-transparent',
                      )}
                    >
                      <div className="bg-muted flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md">
                        {option.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                          <img src={option.imageUrl} alt="" className="size-full object-cover" />
                        ) : (
                          <CarFront className="text-muted-foreground size-6" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{option.name}</p>
                            <p className="text-muted-foreground text-xs">{option.category}</p>
                          </div>
                          {option.availableUnits < 1 ? (
                            <Badge variant="outline" className="border-rose-500/30 text-rose-600">
                              {t(copy.soldOut)}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="tabular-nums">
                              {option.availableUnits} {t(copy.left)}
                            </Badge>
                          )}
                        </div>
                        {option.quote && (
                          <p className="mt-2 text-sm">
                            <span className="font-semibold tabular-nums">{money(option.quote.total)}</span>
                            <span className="text-muted-foreground">
                              {' '}
                              · {option.quote.rentalDays} {t(copy.days)} · {perDay != null && money(perDay)} {t(copy.perDay)}
                            </span>
                          </p>
                        )}
                        {option.violations.length > 0 && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="size-3" />
                            {option.violations.map((code) => t(violationCopy[code])).join(', ')}
                          </p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {extras.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t(copy.extras)}</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {extras.map((extra) => {
                const quantity = selectedExtras[extra.id] ?? 0
                const setQuantity = (next: number) => setSelectedExtras((current) => ({ ...current, [extra.id]: Math.max(0, Math.min(extra.maxQuantity, next)) }))
                return (
                  <div key={extra.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{extra.name}</p>
                      <p className="text-muted-foreground text-sm">
                        {money(extra.price)} {extra.pricingType === 'per_day' ? t(copy.perDay) : `· ${t(copy.perRental)}`}
                      </p>
                    </div>
                    {extra.maxQuantity === 1 ? (
                      <Switch checked={quantity > 0} onCheckedChange={(checked) => setQuantity(checked ? 1 : 0)} />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="size-8" disabled={quantity === 0} onClick={() => setQuantity(quantity - 1)}>
                          <Minus />
                        </Button>
                        <span className="w-6 text-center tabular-nums">{quantity}</span>
                        <Button variant="outline" size="icon" className="size-8" disabled={quantity >= extra.maxQuantity} onClick={() => setQuantity(quantity + 1)}>
                          <Plus />
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t(copy.other)}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>{t(copy.source)}</Label>
              <Select value={source} onValueChange={(value) => setSource(value as typeof source)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['phone', 'walk_in', 'corporate'] as const).map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(optionLabels.reservationSource[value])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>{t(copy.payment)}</Label>
              <Select value={payment} onValueChange={(value) => setPayment(value as typeof payment)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['office', 'bank_transfer'] as const).map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(optionLabels.preferredPaymentMethod[value])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>{t(copy.language)}</Label>
              <Select value={locale} onValueChange={(value) => setLocale(value as typeof locale)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tr">Türkçe</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="ru">Русский</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="flight">{t(copy.flight)}</Label>
              <Input id="flight" value={flightNumber} onChange={(event) => setFlightNumber(event.target.value.toUpperCase())} placeholder="TK 1234" />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="note">{t(copy.note)}</Label>
              <Textarea id="note" rows={2} value={note} onChange={(event) => setNote(event.target.value)} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card className="sticky top-20">
          <CardHeader>
            <CardTitle>{t(copy.summary)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1 text-sm">
              <p className="font-medium">{customer?.fullName ?? (newCustomer ? `${newCustomer.firstName} ${newCustomer.lastName}`.trim() || t(copy.newCustomer) : '—')}</p>
              {validDates && (
                <p className="text-muted-foreground flex flex-wrap items-center gap-1.5">
                  {formatDateTime(fromDateTimeLocal(pickupAt), lang)} <ArrowRight className="size-3" /> {formatDateTime(fromDateTimeLocal(returnAt), lang)}
                </p>
              )}
              {selected && <p>{selected.name}</p>}
            </div>
            <Separator />
            {selected?.quote ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t(copy.rentalPrice)} · {selected.quote.rentalDays} {t(copy.days)}
                  </span>
                  <span className="tabular-nums">{money(selected.quote.baseTotal)}</span>
                </div>
                {selected.quote.extras.map((extra) => (
                  <div key={extra.extraId} className="flex justify-between">
                    <span className="text-muted-foreground">
                      {extra.name} × {extra.quantity}
                    </span>
                    <span className="tabular-nums">{money(extra.total)}</span>
                  </div>
                ))}
                {selected.quote.transferFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t(copy.transferFee)}</span>
                    <span className="tabular-nums">{money(selected.quote.transferFee)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-base font-semibold">
                  <span>{t(copy.total)}</span>
                  <span className="tabular-nums">{money(selected.quote.total)}</span>
                </div>
                {selected.quote.deposit > 0 && (
                  <div className="text-muted-foreground flex justify-between">
                    <span>{t(copy.deposit)}</span>
                    <span className="tabular-nums">{money(selected.quote.deposit)}</span>
                  </div>
                )}
                {selected.violations.length > 0 && (
                  <p className="flex items-start gap-1.5 rounded-md bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                    {t(copy.warnings)}: {selected.violations.map((code) => t(violationCopy[code])).join(', ')}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">{t(copy.noSelection)}</p>
            )}
            <Separator />
            <label className="flex items-start justify-between gap-3">
              <span>
                <span className="text-sm font-medium">{t(copy.confirmNow)}</span>
                <span className="text-muted-foreground block text-xs">{t(copy.confirmHint)}</span>
              </span>
              <Switch checked={confirmNow} onCheckedChange={setConfirmNow} />
            </label>
            <Button className="w-full" size="lg" disabled={pending} onClick={submit}>
              {pending && <Loader2 className="animate-spin" />}
              {t(copy.create)}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
