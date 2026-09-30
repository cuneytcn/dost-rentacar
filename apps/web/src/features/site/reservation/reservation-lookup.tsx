'use client'

import { CalendarDays, Car, Loader2, MapPin, Search, UserRound } from 'lucide-react'
import { useState } from 'react'

import type { ReservationSummary } from '@rent/shared'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

import { postApi, violationCodes } from '../api'
import { formatDateTime } from '../format'
import { useSite } from '../site-context'

const STATUS_TONE: Record<ReservationSummary['status'], string> = {
  pending: 'bg-amber-50 text-amber-800 ring-amber-200',
  confirmed: 'bg-brand-50 text-brand-700 ring-brand-200',
  active: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  completed: 'bg-slate-100 text-slate-700 ring-slate-200',
  cancelled: 'bg-red-50 text-red-700 ring-red-200',
  no_show: 'bg-red-50 text-red-700 ring-red-200',
}

export function ReservationLookup({ initialCode }: { initialCode: string }) {
  const { m, locale, money, violation } = useSite()
  const [code, setCode] = useState(initialCode)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reservation, setReservation] = useState<ReservationSummary | null>(null)
  const [reason, setReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const lookup = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!code.trim() || !email.trim()) return setError(m.reservation.notFound)
    setLoading(true)
    setError(null)
    const result = await postApi<ReservationSummary>('/reservations/lookup', { code: code.trim(), email: email.trim() }, locale)
    setLoading(false)
    if (result.ok) setReservation(result.data)
    else setError(result.error.code === 'not_found' || result.error.code === 'validation_error' ? m.reservation.notFound : m.errors.internal_error)
  }

  const cancel = async () => {
    if (!reservation) return
    setCancelling(true)
    const result = await postApi<ReservationSummary>('/reservations/cancel', { code: reservation.code, email: email.trim(), reason: reason.trim() || undefined }, locale)
    setCancelling(false)
    if (result.ok) {
      setReservation(result.data)
      setNotice(m.reservation.cancelled)
    } else {
      const codes = violationCodes(result.error)
      setNotice(codes.length ? codes.map((item) => violation(item)).join(' ') : m.reservation.cannotCancel)
    }
  }

  if (!reservation) {
    return (
      <form onSubmit={lookup} className="mx-auto max-w-md space-y-4 rounded-3xl border bg-white p-6 sm:p-8">
        <div className="grid gap-2">
          <Label htmlFor="lookup-code" className="text-brand-900 font-semibold">
            {m.reservation.code}
          </Label>
          <Input
            id="lookup-code"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            autoComplete="off"
            className="h-12 rounded-xl font-mono text-lg tracking-wider uppercase"
            placeholder="ABC12345"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="lookup-email" className="text-brand-900 font-semibold">
            {m.reservation.email}
          </Label>
          <Input id="lookup-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="h-12 rounded-xl" />
        </div>
        {error && (
          <p role="alert" className="bg-destructive/5 text-destructive rounded-xl px-4 py-3 text-sm font-medium">
            {error}
          </p>
        )}
        <Button type="submit" disabled={loading} className="bg-brand-600 hover:bg-brand-700 h-12 w-full rounded-xl text-base font-bold">
          {loading ? <Loader2 className="animate-spin" /> : <Search />}
          {m.reservation.lookup}
        </Button>
      </form>
    )
  }

  const closed = reservation.status === 'cancelled' || reservation.status === 'no_show'
  const due = closed ? 0 : Math.max(0, reservation.total - reservation.paidTotal)
  const rows = [
    { icon: CalendarDays, label: m.reservation.pickup, value: formatDateTime(reservation.pickupAt, locale), sub: reservation.pickupLocation.name },
    { icon: CalendarDays, label: m.reservation.return, value: formatDateTime(reservation.returnAt, locale), sub: reservation.returnLocation.name },
    { icon: Car, label: m.reservation.car, value: reservation.vehicleModel.name, sub: null },
    { icon: UserRound, label: m.reservation.driver, value: reservation.customerName, sub: null },
  ]

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {notice && (
        <p role="status" className="bg-brand-50 text-brand-800 rounded-2xl px-5 py-4 text-sm font-semibold">
          {notice}
        </p>
      )}
      <div className="overflow-hidden rounded-3xl border bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b p-6">
          <div>
            <p className="text-muted-foreground text-xs font-bold uppercase">{m.reservation.code}</p>
            <p className="text-brand-950 font-mono text-2xl font-extrabold tracking-wider">{reservation.code}</p>
          </div>
          <span className={cn('rounded-full px-3.5 py-1.5 text-sm font-bold ring-1', STATUS_TONE[reservation.status])}>{m.reservation.status[reservation.status]}</span>
        </div>
        <dl className="grid gap-5 p-6 sm:grid-cols-2">
          {rows.map(({ icon: Icon, label, value, sub }) => (
            <div key={label} className="flex gap-3">
              <span className="bg-brand-50 text-brand-600 flex size-10 shrink-0 items-center justify-center rounded-xl">
                <Icon className="size-5" />
              </span>
              <div>
                <dt className="text-muted-foreground text-xs font-semibold">{label}</dt>
                <dd className="text-brand-950 font-bold">{value}</dd>
                {sub && (
                  <dd className="text-brand-900/70 flex items-center gap-1 text-sm">
                    <MapPin className="size-3.5" />
                    {sub}
                  </dd>
                )}
              </div>
            </div>
          ))}
        </dl>
        <div className="bg-surface grid gap-3 border-t p-6 text-sm sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground text-xs font-semibold">{m.reservation.total}</p>
            <p className="text-brand-950 text-lg font-extrabold tabular-nums">{money(reservation.total, reservation.currency)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-semibold">{m.reservation.paid}</p>
            <p className="text-brand-950 text-lg font-extrabold tabular-nums">{money(reservation.paidTotal, reservation.currency)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-semibold">{m.reservation.due}</p>
            <p className={cn('text-lg font-extrabold tabular-nums', due > 0 ? 'text-amber-700' : 'text-success')}>{money(due, reservation.currency)}</p>
          </div>
          <p className="text-muted-foreground sm:col-span-3">
            {m.reservation.paymentMethod[reservation.preferredPaymentMethod]} · {m.reservation.payment[reservation.paymentStatus]}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button
          variant="outline"
          className="h-11 rounded-full bg-white font-semibold"
          onClick={() => {
            setReservation(null)
            setNotice(null)
          }}
        >
          {m.reservation.another}
        </Button>
        {reservation.canCancel && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/5 h-11 rounded-full bg-white font-semibold">
                {m.reservation.cancel}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{m.reservation.cancelTitle}</AlertDialogTitle>
                <AlertDialogDescription>{m.reservation.cancelText}</AlertDialogDescription>
              </AlertDialogHeader>
              <div className="grid gap-2">
                <Label htmlFor="cancel-reason">{m.reservation.cancelReason}</Label>
                <Textarea id="cancel-reason" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>{m.reservation.keep}</AlertDialogCancel>
                <AlertDialogAction onClick={cancel} disabled={cancelling} variant="destructive">
                  {cancelling && <Loader2 className="animate-spin" />}
                  {m.reservation.cancelConfirm}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  )
}
