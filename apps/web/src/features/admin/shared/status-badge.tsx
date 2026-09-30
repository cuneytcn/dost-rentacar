'use client'

import { Badge } from '@/components/ui/badge'
import { optionLabels } from '@/i18n/admin'
import { cn } from '@/lib/utils'
import type { Reservation } from '@/payload-types'

import { useT } from '../lang-context'

const reservationStyles: Record<Reservation['status'], string> = {
  pending: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  confirmed: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  active: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  completed: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300',
  cancelled: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  no_show: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
}

const paymentStyles: Record<Reservation['paymentStatus'], string> = {
  unpaid: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  partial: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  paid: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  refunded: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300',
}

export const reservationStatusDot: Record<Reservation['status'], string> = {
  pending: 'bg-amber-500',
  confirmed: 'bg-sky-500',
  active: 'bg-emerald-500',
  completed: 'bg-zinc-400',
  cancelled: 'bg-rose-500',
  no_show: 'bg-rose-500',
}

export function ReservationStatusBadge({ status, className }: { status: Reservation['status']; className?: string }) {
  const t = useT()
  return (
    <Badge variant="outline" className={cn('gap-1.5 font-medium', reservationStyles[status], className)}>
      <span className={cn('size-1.5 rounded-full', reservationStatusDot[status])} />
      {t(optionLabels.reservationStatus[status])}
    </Badge>
  )
}

export function PaymentStatusBadge({ status, className }: { status: Reservation['paymentStatus']; className?: string }) {
  const t = useT()
  return (
    <Badge variant="outline" className={cn('font-medium', paymentStyles[status], className)}>
      {t(optionLabels.paymentStatus[status])}
    </Badge>
  )
}

const paymentDot: Record<Reservation['paymentStatus'], string> = {
  unpaid: 'bg-rose-500',
  partial: 'bg-amber-500',
  paid: 'bg-emerald-500',
  refunded: 'bg-zinc-400',
}

/** Table variant: coloured dot + label, no box, so labels of different lengths still line up. */
export function StatusText({ dot, label, className }: { dot: string; label: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-sm whitespace-nowrap', className)}>
      <span className={cn('size-2 shrink-0 rounded-full', dot)} />
      {label}
    </span>
  )
}

export function ReservationStatusText({ status }: { status: Reservation['status'] }) {
  const t = useT()
  return <StatusText dot={reservationStatusDot[status]} label={t(optionLabels.reservationStatus[status])} />
}

export function PaymentStatusText({ status }: { status: Reservation['paymentStatus'] }) {
  const t = useT()
  return <StatusText dot={paymentDot[status]} label={t(optionLabels.paymentStatus[status])} />
}
