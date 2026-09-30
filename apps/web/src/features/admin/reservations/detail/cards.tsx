'use client'

import {
  AlertOctagon,
  ArrowRight,
  Ban,
  BellRing,
  CalendarPlus,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FileText,
  Gauge,
  KeyRound,
  Mail,
  Pencil,
  Phone,
  Plane,
  Plus,
  RotateCcw,
  Trash2,
  Undo2,
} from 'lucide-react'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { optionLabels, text } from '@/i18n/admin'
import { cn } from '@/lib/utils'

import { formatDate, formatDateTime, formatMoney } from '../../format'
import { intlLocale } from '../../lang'
import { useAdminLang, useT } from '../../lang-context'
import { MoneyInput } from '../../shared/money-input'
import { PaymentStatusBadge } from '../../shared/status-badge'
import { removePaymentAction, updateDiscountAction, updateInternalNoteAction } from '../actions'
import type { HandoverView, ReservationDetail, TimelineEvent } from '../detail-data'

const copy = {
  pickup: text('Pickup', 'Alış'),
  return: text('Return', 'İade'),
  days: text('days', 'gün'),
  bookedModel: text('Booked model', 'Rezerve edilen model'),
  vehicle: text('Vehicle', 'Araç'),
  noVehicle: text('No vehicle assigned yet', 'Henüz araç atanmadı'),
  assign: text('Assign', 'Ata'),
  change: text('Change', 'Değiştir'),
  upgrade: text('Different model', 'Farklı model'),
  flight: text('Flight', 'Uçuş'),
  customer: text('Customer', 'Müşteri'),
  profile: text('Profile', 'Profil'),
  age: text('Age', 'Yaş'),
  birthDate: text('Birth date', 'Doğum tarihi'),
  document: text('ID / passport', 'Kimlik / pasaport'),
  license: text('Driving license', 'Ehliyet'),
  issued: text('issued', 'veriliş'),
  country: text('Country', 'Ülke'),
  blacklisted: text('Blacklisted customer', 'Kara listedeki müşteri'),
  underAge: text('Younger than the model’s minimum driver age', 'Modelin minimum sürücü yaşından küçük'),
  additionalDrivers: text('Additional drivers', 'Ek sürücüler'),
  price: text('Price', 'Fiyat'),
  priceDescription: text('Locked in; recalculated only when the booking changes', 'Sabit fiyat; sadece rezervasyon değişirse yeniden hesaplanır'),
  rental: text('Rental', 'Kiralama'),
  perDay: text('/ day', '/ gün'),
  transferFee: text('One-way fee', 'Farklı şube ücreti'),
  discount: text('Discount', 'İndirim'),
  total: text('Total', 'Toplam'),
  deposit: text('Deposit (held at pickup)', 'Depozito (teslimde alınır)'),
  shownAs: text('Customer saw', 'Müşteriye gösterilen'),
  save: text('Save', 'Kaydet'),
  cancel: text('Cancel', 'Vazgeç'),
  saved: text('Saved', 'Kaydedildi'),
  payments: text('Payments', 'Ödemeler'),
  paid: text('Paid', 'Ödenen'),
  balance: text('Balance due', 'Kalan'),
  addPayment: text('Record payment', 'Ödeme gir'),
  noPayments: text('No payments yet.', 'Henüz ödeme yok.'),
  preferred: text('Customer prefers', 'Müşteri tercihi'),
  removePayment: text('Payment removed', 'Ödeme silindi'),
  receipt: text('Receipt', 'Dekont'),
  handovers: text('Pickup & return', 'Teslim ve iade'),
  handoverPickup: text('Handed over', 'Teslim edildi'),
  handoverReturn: text('Returned', 'İade alındı'),
  fuel: text('Fuel', 'Yakıt'),
  by: text('by', ''),
  driven: text('driven', 'yol yapıldı'),
  newDamage: text('new', 'yeni'),
  timeline: text('History', 'Geçmiş'),
  notes: text('Notes', 'Notlar'),
  customerNote: text('From the customer', 'Müşteriden'),
  internalNote: text('Internal note', 'İç not'),
  internalHint: text('Only visible to staff', 'Sadece personel görür'),
  details: text('Details', 'Detaylar'),
  source: text('Source', 'Kaynak'),
  language: text('Language', 'Dil'),
  created: text('Created', 'Oluşturuldu'),
  penalties: text('Charges', 'Ek ücretler'),
  penaltiesTitle: text('Charges & fines', 'Ek ücretler ve cezalar'),
  penaltiesHint: text('Extra km, missing fuel, damage, tolls or traffic fines for this rental.', 'Bu kiralamaya ait fazla km, eksik yakıt, hasar, HGS veya trafik cezaları.'),
  addPenalty: text('Add charge', 'Ek ücret ekle'),
  noPenalties: text('No charges.', 'Ek ücret yok.'),
}

const timelineCopy: Record<TimelineEvent['kind'], ReturnType<typeof text>> = {
  created: text('Reservation created', 'Rezervasyon oluşturuldu'),
  confirmed: text('Confirmed', 'Onaylandı'),
  payment: text('Payment received', 'Ödeme alındı'),
  pickup: text('Car handed over', 'Araç teslim edildi'),
  return: text('Car returned', 'Araç iade alındı'),
  cancelled: text('Cancelled', 'İptal edildi'),
  reminder: text('Pickup reminder sent', 'Teslim hatırlatması gönderildi'),
}

const timelineIcons: Record<TimelineEvent['kind'], React.ComponentType<{ className?: string }>> = {
  created: CalendarPlus,
  confirmed: CheckCircle2,
  payment: CreditCard,
  pickup: KeyRound,
  return: RotateCcw,
  cancelled: Ban,
  reminder: BellRing,
}

function Row({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-baseline justify-between gap-4 py-1.5 text-sm', className)}>
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  )
}

function RentalPoint({ label, at, location, lang, timeZone }: { label: string; at: string; location: string; lang: 'tr' | 'en'; timeZone: string }) {
  const date = new Intl.DateTimeFormat(intlLocale(lang), { weekday: 'short', day: 'numeric', month: 'long', timeZone }).format(new Date(at))
  const time = new Intl.DateTimeFormat(intlLocale(lang), { timeStyle: 'short', timeZone }).format(new Date(at))
  return (
    <div className="min-w-0 flex-1">
      <p className="text-muted-foreground text-xs font-medium uppercase">{label}</p>
      <p className="mt-1 text-lg font-semibold">{date}</p>
      <p className="text-2xl font-semibold tabular-nums">{time}</p>
      <p className="text-muted-foreground mt-1 truncate text-sm">{location}</p>
    </div>
  )
}

export function RentalCard({ detail, onAssign }: { detail: ReservationDetail; onAssign?: () => void }) {
  const t = useT()
  const lang = useAdminLang()
  const point = { lang, timeZone: detail.timeZone }

  return (
    <Card>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-4">
          <RentalPoint {...point} label={t(copy.pickup)} at={detail.pickupAt} location={detail.pickupLocation.name} />
          <div className="flex flex-col items-center gap-1 px-2">
            <Badge variant="secondary" className="tabular-nums">
              {detail.pricing.rentalDays} {t(copy.days)}
            </Badge>
            <ArrowRight className="text-muted-foreground size-5" />
          </div>
          <RentalPoint {...point} label={t(copy.return)} at={detail.returnAt} location={detail.returnLocation.name} />
        </div>
        <Separator />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-xs font-medium uppercase">{t(copy.bookedModel)}</p>
            <p className="mt-1 font-medium">{detail.vehicleModel.name}</p>
            <p className="text-muted-foreground text-sm">
              {[detail.vehicleModel.category, t(optionLabels.transmission[detail.vehicleModel.transmission]), t(optionLabels.fuelType[detail.vehicleModel.fuelType])]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-medium uppercase">{t(copy.vehicle)}</p>
            {detail.vehicle ? (
              <div className="mt-1 flex items-center gap-2">
                <span className="bg-muted rounded-md border px-2 py-0.5 font-mono text-sm font-semibold">{detail.vehicle.plate}</span>
                {detail.vehicle.isUpgrade && <Badge variant="outline">{t(copy.upgrade)}</Badge>}
                {onAssign && (
                  <Button variant="ghost" size="sm" className="ml-auto h-7" onClick={onAssign}>
                    <Pencil />
                    {t(copy.change)}
                  </Button>
                )}
              </div>
            ) : (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm text-amber-600 dark:text-amber-400">{t(copy.noVehicle)}</span>
                {onAssign && (
                  <Button variant="outline" size="sm" className="ml-auto h-7" onClick={onAssign}>
                    {t(copy.assign)}
                  </Button>
                )}
              </div>
            )}
            {detail.vehicle && (
              <p className="text-muted-foreground mt-1 text-sm">
                {detail.vehicle.model} · {detail.vehicle.mileageKm.toLocaleString(intlLocale(lang))} km
              </p>
            )}
          </div>
        </div>
        {detail.flightNumber && (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Plane className="size-4" />
            {t(copy.flight)}: <span className="text-foreground font-mono">{detail.flightNumber}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function CustomerCard({ detail }: { detail: ReservationDetail }) {
  const t = useT()
  const lang = useAdminLang()
  const { customer } = detail
  const underAge = customer.age != null && customer.age < detail.vehicleModel.minDriverAge
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(copy.customer)}</CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/customers/${customer.id}`}>
              {t(copy.profile)}
              <ExternalLink />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        {customer.isBlacklisted && (
          <Alert variant="destructive">
            <AlertOctagon />
            <AlertTitle>{t(copy.blacklisted)}</AlertTitle>
            {customer.blacklistReason && <AlertDescription>{customer.blacklistReason}</AlertDescription>}
          </Alert>
        )}
        <div>
          <p className="text-lg font-semibold">{customer.fullName}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={`tel:${customer.phone}`}>
                <Phone />
                {customer.phone}
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={`mailto:${customer.email}`}>
                <Mail />
                {customer.email}
              </a>
            </Button>
          </div>
        </div>
        <div className="divide-y">
          <Row label={t(copy.birthDate)}>
            {customer.birthDate ? (
              <span className={cn(underAge && 'text-destructive font-medium')} title={underAge ? t(copy.underAge) : undefined}>
                {formatDate(`${customer.birthDate}T12:00:00Z`, lang)} · {t(copy.age)} {customer.age}
              </span>
            ) : (
              '—'
            )}
          </Row>
          <Row label={t(copy.country)}>{customer.country ?? '—'}</Row>
          <Row label={t(copy.document)}>
            {customer.idDocumentNumber ? (
              <span className="font-mono">
                {customer.idDocumentType ? `${t(optionLabels.idDocumentType[customer.idDocumentType])} · ` : ''}
                {customer.idDocumentNumber}
              </span>
            ) : (
              '—'
            )}
          </Row>
          <Row label={t(copy.license)}>
            {customer.licenseNumber ? (
              <span>
                <span className="font-mono">{customer.licenseNumber}</span>
                {customer.licenseCountry && ` (${customer.licenseCountry})`}
                {customer.licenseIssuedAt && <span className="text-muted-foreground"> · {t(copy.issued)} {formatDate(`${customer.licenseIssuedAt}T12:00:00Z`, lang)}</span>}
              </span>
            ) : (
              '—'
            )}
          </Row>
        </div>
        {detail.additionalDrivers.length > 0 && (
          <div>
            <p className="text-muted-foreground mb-1 text-xs font-medium uppercase">{t(copy.additionalDrivers)}</p>
            {detail.additionalDrivers.map((driver) => (
              <p key={driver.fullName} className="text-sm">
                {driver.fullName}
                {driver.licenseNumber && <span className="text-muted-foreground font-mono"> · {driver.licenseNumber}</span>}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/** Groups consecutive days with the same rate: "3 × €32,00". */
function groupRates(days: { date: string; amount: number }[]) {
  const groups: { count: number; amount: number }[] = []
  for (const day of days) {
    const last = groups.at(-1)
    if (last && last.amount === day.amount) last.count++
    else groups.push({ count: 1, amount: day.amount })
  }
  return groups
}

export function PriceCard({ detail, editable }: { detail: ReservationDetail; editable: boolean }) {
  const t = useT()
  const lang = useAdminLang()
  const [editing, setEditing] = useState(false)
  const [discount, setDiscount] = useState<number | null>(detail.pricing.discount)
  const [pending, startTransition] = useTransition()
  const { pricing } = detail
  const money = (value: number) => formatMoney(value, pricing.currency, lang)

  const saveDiscount = () =>
    startTransition(async () => {
      const result = await updateDiscountAction({ id: detail.id, discount: discount ?? 0 })
      if (!result.ok) return void toast.error(result.message)
      toast.success(t(copy.saved))
      setEditing(false)
    })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(copy.price)}</CardTitle>
        <CardDescription>{t(copy.priceDescription)}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          <div className="py-1.5">
            <Row label={t(copy.rental)} className="py-0">
              <span className="tabular-nums">{money(pricing.baseTotal)}</span>
            </Row>
            <div className="text-muted-foreground mt-0.5 space-y-0.5 text-xs">
              {groupRates(pricing.dailyBreakdown).map((group, index) => (
                <p key={index} className="tabular-nums">
                  {group.count} × {money(group.amount)} {t(copy.perDay)}
                </p>
              ))}
            </div>
          </div>
          {detail.extras.map((extra, index) => (
            <Row key={index} label={`${extra.name} × ${extra.quantity}${extra.chargedDays ? ` · ${extra.chargedDays} ${t(copy.days)}` : ''}`}>
              <span className="tabular-nums">{money(extra.total)}</span>
            </Row>
          ))}
          {pricing.transferFee > 0 && (
            <Row label={t(copy.transferFee)}>
              <span className="tabular-nums">{money(pricing.transferFee)}</span>
            </Row>
          )}
          <div className="py-1.5">
            {editing ? (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">{t(copy.discount)}</span>
                <MoneyInput value={discount} onChange={setDiscount} currency={pricing.currency} className="ml-auto w-36" autoFocus />
                <Button size="sm" onClick={saveDiscount} disabled={pending}>
                  {t(copy.save)}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                  {t(copy.cancel)}
                </Button>
              </div>
            ) : (
              <Row label={t(copy.discount)} className="py-0">
                <span className="inline-flex items-center gap-1 tabular-nums">
                  {pricing.discount > 0 ? `−${money(pricing.discount)}` : '—'}
                  {editable && (
                    <Button variant="ghost" size="icon" className="size-6" onClick={() => setEditing(true)}>
                      <Pencil className="size-3" />
                    </Button>
                  )}
                </span>
              </Row>
            )}
          </div>
          <Row label={t(copy.total)} className="py-3 text-base font-semibold">
            <span className="tabular-nums">{money(pricing.total)}</span>
          </Row>
          {pricing.deposit > 0 && (
            <Row label={t(copy.deposit)}>
              <span className="tabular-nums">{money(pricing.deposit)}</span>
            </Row>
          )}
          {detail.display && (
            <Row label={t(copy.shownAs)}>
              <span className="text-muted-foreground tabular-nums">{formatMoney(detail.display.total, detail.display.currency, lang)}</span>
            </Row>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function PaymentsCard({ detail, onAdd }: { detail: ReservationDetail; onAdd?: () => void }) {
  const t = useT()
  const lang = useAdminLang()
  const [pending, startTransition] = useTransition()
  const money = (value: number) => formatMoney(value, detail.pricing.currency, lang)
  const progress = detail.pricing.total > 0 ? Math.min(100, (detail.paidTotal / detail.pricing.total) * 100) : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t(copy.payments)}
          <PaymentStatusBadge status={detail.paymentStatus} />
        </CardTitle>
        <CardDescription>
          {t(copy.preferred)}: {t(optionLabels.preferredPaymentMethod[detail.preferredPaymentMethod])}
        </CardDescription>
        {onAdd && (
          <CardAction>
            <Button size="sm" variant="outline" onClick={onAdd}>
              <Plus />
              {t(copy.addPayment)}
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>
              <span className="text-muted-foreground">{t(copy.paid)}: </span>
              <span className="font-medium tabular-nums">{money(detail.paidTotal)}</span>
            </span>
            <span>
              <span className="text-muted-foreground">{t(copy.balance)}: </span>
              <span className={cn('font-medium tabular-nums', detail.balance > 0 && 'text-amber-600 dark:text-amber-400')}>{money(detail.balance)}</span>
            </span>
          </div>
          <div className="bg-muted h-2 overflow-hidden rounded-full">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
        {detail.payments.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t(copy.noPayments)}</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {detail.payments.map((payment) => (
              <li key={payment.id} className="group flex items-center gap-3 px-3 py-2.5 text-sm">
                <CreditCard className="text-muted-foreground size-4" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{t(optionLabels.paymentMethod[payment.method])}</p>
                  <p className="text-muted-foreground text-xs">
                    {formatDateTime(payment.paidAt, lang)}
                    {payment.reference && ` · ${payment.reference}`}
                  </p>
                </div>
                {payment.proofUrl && (
                  <Button variant="ghost" size="icon" className="size-7" asChild>
                    <a href={payment.proofUrl} target="_blank" rel="noreferrer" aria-label={t(copy.receipt)} title={t(copy.receipt)}>
                      <FileText className="size-3.5" />
                    </a>
                  </Button>
                )}
                <span className="font-medium tabular-nums">{money(payment.amount)}</span>
                {onAdd && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 opacity-0 group-hover:opacity-100"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const result = await removePaymentAction({ id: detail.id, paymentId: payment.id })
                        if (result.ok) toast.success(t(copy.removePayment))
                        else toast.error(result.message)
                      })
                    }
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function HandoverBlock({ handover, pickupMileage }: { handover: HandoverView; pickupMileage: number | null }) {
  const t = useT()
  const lang = useAdminLang()
  const isPickup = handover.type === 'pickup'
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <div className={cn('flex size-8 items-center justify-center rounded-full', isPickup ? 'bg-emerald-500/10 text-emerald-600' : 'bg-sky-500/10 text-sky-600')}>
          {isPickup ? <KeyRound className="size-4" /> : <Undo2 className="size-4" />}
        </div>
        <div className="flex-1">
          <p className="font-medium">{t(isPickup ? copy.handoverPickup : copy.handoverReturn)}</p>
          <p className="text-muted-foreground text-xs">
            {formatDateTime(handover.performedAt, lang)}
            {handover.performedBy && ` · ${handover.performedBy}`}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <span className="flex items-center gap-1.5">
          <Gauge className="text-muted-foreground size-4" />
          <span className="tabular-nums">{handover.mileageKm.toLocaleString(intlLocale(lang))} km</span>
          {!isPickup && pickupMileage != null && (
            <span className="text-muted-foreground">
              ({(handover.mileageKm - pickupMileage).toLocaleString(intlLocale(lang))} km {t(copy.driven)})
            </span>
          )}
        </span>
        <span>
          <span className="text-muted-foreground">{t(copy.fuel)}: </span>
          {t(optionLabels.fuelLevel[handover.fuelLevel])}
        </span>
      </div>
      {handover.damages.length > 0 && (
        <ul className="space-y-1 text-sm">
          {handover.damages.map((damage, index) => (
            <li key={index} className="flex items-center gap-2">
              <Badge variant="outline">{t(optionLabels.damageArea[damage.area as keyof typeof optionLabels.damageArea])}</Badge>
              {damage.description}
              {damage.isNew && <Badge variant="destructive">{t(copy.newDamage)}</Badge>}
            </li>
          ))}
        </ul>
      )}
      {handover.photos.length > 0 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {handover.photos.map((photo) => (
            <a key={photo.url} href={photo.url} target="_blank" rel="noreferrer" className="aspect-square overflow-hidden rounded-md border">
              {/* eslint-disable-next-line @next/next/no-img-element -- private, auth-protected file */}
              <img src={photo.thumbnailUrl} alt="" className="size-full object-cover transition-transform hover:scale-105" />
            </a>
          ))}
        </div>
      )}
      {handover.notes && <p className="text-muted-foreground text-sm whitespace-pre-line">{handover.notes}</p>}
    </div>
  )
}

export function HandoversCard({ detail }: { detail: ReservationDetail }) {
  const t = useT()
  if (detail.handovers.length === 0) return null
  const pickupMileage = detail.handovers.find((handover) => handover.type === 'pickup')?.mileageKm ?? null
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(copy.handovers)}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {detail.handovers.map((handover) => (
          <HandoverBlock key={handover.id} handover={handover} pickupMileage={pickupMileage} />
        ))}
      </CardContent>
    </Card>
  )
}

export function TimelineCard({ detail }: { detail: ReservationDetail }) {
  const t = useT()
  const lang = useAdminLang()
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(copy.timeline)}</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="relative space-y-4 border-l pl-6">
          {detail.timeline.map((event, index) => {
            const Icon = timelineIcons[event.kind]
            return (
              <li key={index} className="relative">
                <span
                  className={cn(
                    'bg-background absolute top-0 -left-[35px] flex size-6 items-center justify-center rounded-full border',
                    event.kind === 'cancelled' && 'border-rose-500/40 text-rose-600',
                    event.kind === 'confirmed' && 'border-sky-500/40 text-sky-600',
                    event.kind === 'payment' && 'border-emerald-500/40 text-emerald-600',
                  )}
                >
                  <Icon className="size-3" />
                </span>
                <p className="text-sm font-medium">{t(timelineCopy[event.kind])}</p>
                <p className="text-muted-foreground text-xs">
                  {formatDateTime(event.at, lang)}
                  {event.kind === 'payment' && event.amount != null && ` · ${formatMoney(event.amount, detail.pricing.currency, lang)}`}
                  {event.kind === 'created' && event.detail && ` · ${t(optionLabels.reservationSource[event.detail as keyof typeof optionLabels.reservationSource])}`}
                  {(event.kind === 'pickup' || event.kind === 'return' || event.kind === 'cancelled') && event.detail && ` · ${event.detail}`}
                </p>
              </li>
            )
          })}
        </ol>
      </CardContent>
    </Card>
  )
}

export function NotesCard({ detail }: { detail: ReservationDetail }) {
  const t = useT()
  const [note, setNote] = useState(detail.internalNote ?? '')
  const [pending, startTransition] = useTransition()
  const dirty = note !== (detail.internalNote ?? '')
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(copy.notes)}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {detail.customerNote && (
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="text-muted-foreground mb-1 text-xs font-medium uppercase">{t(copy.customerNote)}</p>
            <p className="whitespace-pre-line">{detail.customerNote}</p>
          </div>
        )}
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium uppercase">
            {t(copy.internalNote)} · <span className="normal-case">{t(copy.internalHint)}</span>
          </p>
          <Textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} />
          {dirty && (
            <Button
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await updateInternalNoteAction({ id: detail.id, note })
                  if (result.ok) toast.success(t(copy.saved))
                  else toast.error(result.message)
                })
              }
            >
              {t(copy.save)}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function InfoCard({ detail }: { detail: ReservationDetail }) {
  const t = useT()
  const lang = useAdminLang()
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(copy.details)}</CardTitle>
      </CardHeader>
      <CardContent className="divide-y">
        <Row label={t(copy.source)}>{t(optionLabels.reservationSource[detail.source])}</Row>
        <Row label={t(copy.language)}>{detail.locale.toUpperCase()}</Row>
        <Row label={t(copy.created)}>{formatDateTime(detail.createdAt, lang)}</Row>
        {detail.penalties.length > 0 && (
          <Row label={t(copy.penalties)}>
            {formatMoney(
              detail.penalties.reduce((sum, penalty) => sum + penalty.amount, 0),
              detail.pricing.currency,
              lang,
            )}
          </Row>
        )}
      </CardContent>
    </Card>
  )
}

export function PenaltiesCard({ detail }: { detail: ReservationDetail }) {
  const t = useT()
  const lang = useAdminLang()
  const params = new URLSearchParams({ reservation: String(detail.id), ...(detail.vehicle ? { vehicle: String(detail.vehicle.id) } : {}) })
  const canAdd = detail.status === 'active' || detail.status === 'completed'
  if (!canAdd && detail.penalties.length === 0) return null
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(copy.penaltiesTitle)}</CardTitle>
        <CardDescription>{t(copy.penaltiesHint)}</CardDescription>
        {canAdd && (
          <CardAction>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/admin/penalties/new?${params.toString()}`}>
                <Plus />
                {t(copy.addPenalty)}
              </Link>
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {detail.penalties.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t(copy.noPenalties)}</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {detail.penalties.map((penalty) => (
              <li key={penalty.id}>
                <Link href={`/admin/penalties/${penalty.id}`} className="hover:bg-muted/50 grid grid-cols-[1fr_auto_8rem] items-center gap-4 px-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">{t(optionLabels.penaltyType[penalty.type])}</p>
                    <p className="text-muted-foreground text-xs">{formatDateTime(penalty.occurredAt, lang)}</p>
                  </div>
                  <span className="text-right font-medium tabular-nums">{formatMoney(penalty.amount, detail.pricing.currency, lang)}</span>
                  <span className="text-muted-foreground">{t(optionLabels.penaltyStatus[penalty.status])}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
