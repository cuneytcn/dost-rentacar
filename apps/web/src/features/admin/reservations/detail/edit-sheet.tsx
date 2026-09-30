'use client'

import { Info, Loader2, Lock, Minus, Plus, Trash2, UserPlus } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { optionLabels, text } from '@/i18n/admin'

import { formatMoney } from '../../format'
import { useAdminLang, useT } from '../../lang-context'
import { BIRTH_YEARS, DatePicker, DateTimePicker } from '../../shared/date-picker'
import { fromDateTimeLocal, toDateTimeLocal } from '@/lib/local-datetime'
import { updateReservationAction } from '../actions'
import type { ReservationDetail } from '../detail-data'

const copy = {
  title: text('Edit reservation', 'Rezervasyonu düzenle'),
  titleActive: text('Extend or change rental', 'Kiralamayı uzat / değiştir'),
  description: text('Dates, locations, vehicle, extras and drivers.', 'Tarih, şube, araç, ek hizmet ve sürücüler.'),
  pickupLocked: text('The car has been handed over, so pickup details can no longer change.', 'Araç teslim edildiği için alış bilgileri artık değiştirilemez.'),
  repriceNote: text(
    'Changing dates, locations, the model or extras recalculates the price with current rates. The discount is kept.',
    'Tarih, şube, model veya ek hizmet değişirse fiyat güncel tarifeyle yeniden hesaplanır. İndirim korunur.',
  ),
  pickupLocation: text('Pickup location', 'Alış şubesi'),
  returnLocation: text('Return location', 'İade şubesi'),
  pickupAt: text('Pickup', 'Alış'),
  returnAt: text('Return', 'İade'),
  model: text('Vehicle model', 'Araç modeli'),
  extras: text('Extras', 'Ek hizmetler'),
  perDay: text('/ day', '/ gün'),
  perRental: text('per rental', 'kiralama başına'),
  drivers: text('Additional drivers', 'Ek sürücüler'),
  addDriver: text('Add driver', 'Sürücü ekle'),
  driverName: text('Full name', 'Ad soyad'),
  driverLicense: text('License no.', 'Ehliyet no'),
  driverBirth: text('Birth date', 'Doğum tarihi'),
  flight: text('Flight number', 'Uçuş no'),
  payment: text('Preferred payment', 'Ödeme tercihi'),
  save: text('Save changes', 'Değişiklikleri kaydet'),
  saved: text('Reservation updated', 'Rezervasyon güncellendi'),
  newTotal: text('New total', 'Yeni toplam'),
  invalidDates: text('Return must be after pickup.', 'İade, alıştan sonra olmalı.'),
  driverRequired: text('Enter a name for every driver.', 'Her sürücü için ad soyad girin.'),
}

type Driver = { key: number; fullName: string; licenseNumber: string; birthDate: string }

export function EditReservationSheet({ detail, onOpenChange }: { detail: ReservationDetail; onOpenChange: (open: boolean) => void }) {
  const t = useT()
  const lang = useAdminLang()
  const locked = detail.status === 'active'
  const [pickupLocationId, setPickupLocationId] = useState(detail.pickupLocation.id)
  const [returnLocationId, setReturnLocationId] = useState(detail.returnLocation.id)
  const [pickupAt, setPickupAt] = useState(toDateTimeLocal(detail.pickupAt))
  const [returnAt, setReturnAt] = useState(toDateTimeLocal(detail.returnAt))
  const [vehicleModelId, setVehicleModelId] = useState(detail.vehicleModel.id)
  const [extras, setExtras] = useState<Record<number, number>>(Object.fromEntries(detail.extrasSelection.map((row) => [row.extraId, row.quantity])))
  const [drivers, setDrivers] = useState<Driver[]>(
    detail.additionalDrivers.map((driver, index) => ({
      key: index,
      fullName: driver.fullName,
      licenseNumber: driver.licenseNumber ?? '',
      birthDate: driver.birthDate ?? '',
    })),
  )
  const [flightNumber, setFlightNumber] = useState(detail.flightNumber ?? '')
  const [payment, setPayment] = useState(detail.preferredPaymentMethod)
  const [pending, startTransition] = useTransition()
  const { locations, vehicleModels, extras: extraOptions } = detail.editOptions

  const submit = () => {
    if (returnAt <= pickupAt) return void toast.error(t(copy.invalidDates))
    if (drivers.some((driver) => !driver.fullName.trim())) return void toast.error(t(copy.driverRequired))
    startTransition(async () => {
      const result = await updateReservationAction({
        id: detail.id,
        pickupLocationId,
        returnLocationId,
        pickupAt: fromDateTimeLocal(pickupAt),
        returnAt: fromDateTimeLocal(returnAt),
        vehicleModelId,
        extras: Object.entries(extras)
          .filter(([, quantity]) => quantity > 0)
          .map(([extraId, quantity]) => ({ extraId: Number(extraId), quantity })),
        additionalDrivers: drivers.map(({ fullName, licenseNumber, birthDate }) => ({ fullName, licenseNumber, birthDate })),
        flightNumber,
        preferredPaymentMethod: payment,
      })
      if (!result.ok) return void toast.error(result.message)
      toast.success(
        result.data.recalculated
          ? `${t(copy.saved)} · ${t(copy.newTotal)}: ${formatMoney(result.data.total, detail.pricing.currency, lang)}`
          : t(copy.saved),
      )
      onOpenChange(false)
    })
  }

  const locationSelect = (value: number, onChange: (id: number) => void, disabled?: boolean) => (
    <Select value={String(value)} onValueChange={(next) => onChange(Number(next))} disabled={disabled}>
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
  )

  return (
    <Sheet open onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle>{t(locked ? copy.titleActive : copy.title)}</SheetTitle>
          <SheetDescription>{t(copy.description)}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          {locked && (
            <Alert>
              <Lock />
              <AlertDescription>{t(copy.pickupLocked)}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>{t(copy.pickupLocation)}</Label>
              {locationSelect(pickupLocationId, setPickupLocationId, locked)}
            </div>
            <div className="grid gap-2">
              <Label>{t(copy.returnLocation)}</Label>
              {locationSelect(returnLocationId, setReturnLocationId)}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-pickup">{t(copy.pickupAt)}</Label>
              <DateTimePicker id="edit-pickup" value={pickupAt} disabled={locked} onChange={setPickupAt} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-return">{t(copy.returnAt)}</Label>
              <DateTimePicker id="edit-return" min={pickupAt} value={returnAt} onChange={setReturnAt} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>{t(copy.model)}</Label>
            <Select value={String(vehicleModelId)} onValueChange={(value) => setVehicleModelId(Number(value))} disabled={locked}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {vehicleModels.map((model) => (
                  <SelectItem key={model.id} value={String(model.id)}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>{t(copy.extras)}</Label>
            <div className="divide-y rounded-lg border">
              {extraOptions.map((extra) => {
                const quantity = extras[extra.id] ?? 0
                const set = (next: number) => setExtras((current) => ({ ...current, [extra.id]: Math.max(0, Math.min(extra.maxQuantity, next)) }))
                return (
                  <div key={extra.id} className="flex items-center gap-3 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{extra.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {formatMoney(extra.price, detail.pricing.currency, lang)} {extra.pricingType === 'per_day' ? t(copy.perDay) : `· ${t(copy.perRental)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="icon" className="size-7" disabled={quantity === 0} onClick={() => set(quantity - 1)}>
                        <Minus />
                      </Button>
                      <span className="w-5 text-center text-sm tabular-nums">{quantity}</span>
                      <Button type="button" variant="outline" size="icon" className="size-7" disabled={quantity >= extra.maxQuantity} onClick={() => set(quantity + 1)}>
                        <Plus />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t(copy.drivers)}</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={drivers.length >= 5}
                onClick={() => setDrivers((current) => [...current, { key: Date.now(), fullName: '', licenseNumber: '', birthDate: '' }])}
              >
                <UserPlus />
                {t(copy.addDriver)}
              </Button>
            </div>
            {drivers.map((driver) => {
              const update = (patch: Partial<Driver>) => setDrivers((current) => current.map((item) => (item.key === driver.key ? { ...item, ...patch } : item)))
              return (
                <div key={driver.key} className="bg-muted/30 grid grid-cols-[1fr_auto] items-start gap-2 rounded-lg border p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Input className="col-span-2" placeholder={t(copy.driverName)} value={driver.fullName} onChange={(event) => update({ fullName: event.target.value })} />
                    <Input placeholder={t(copy.driverLicense)} value={driver.licenseNumber} onChange={(event) => update({ licenseNumber: event.target.value })} />
                    <DatePicker placeholder={t(copy.driverBirth)} years={BIRTH_YEARS} value={driver.birthDate} onChange={(value) => update({ birthDate: value })} />
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => setDrivers((current) => current.filter((item) => item.key !== driver.key))}>
                    <Trash2 />
                  </Button>
                </div>
              )
            })}
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="edit-flight">{t(copy.flight)}</Label>
              <Input id="edit-flight" value={flightNumber} onChange={(event) => setFlightNumber(event.target.value.toUpperCase())} placeholder="TK 1234" />
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
          </div>

          <p className="text-muted-foreground flex items-start gap-2 text-xs">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            {t(copy.repriceNote)}
          </p>
        </div>

        <SheetFooter className="border-t">
          <Button size="lg" onClick={submit} disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            {t(copy.save)}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
