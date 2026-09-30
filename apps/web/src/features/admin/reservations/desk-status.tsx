'use client'

import { Badge } from '@/components/ui/badge'
import { text, type AdminText } from '@/i18n/admin'
import { cn } from '@/lib/utils'

import { formatMoney } from '../format'
import { intlLocale, type AdminLang } from '../lang'
import { useAdminLang, useT } from '../lang-context'
import { StatusText } from '../shared/status-badge'
import type { DeskMoment, DeskState, DeskStatus, DeskTone, PaymentSummary } from './status'

const stateLabels: Record<DeskState, AdminText> = {
  awaiting_confirmation: text('Awaiting confirmation', 'Onay bekliyor'),
  needs_vehicle: text('No vehicle yet', 'Araç atanmadı'),
  awaiting_pickup: text('Awaiting pickup', 'Teslim bekliyor'),
  with_customer: text('With customer', 'Müşteride'),
  returned: text('Returned', 'İade alındı'),
  cancelled: text('Cancelled', 'İptal edildi'),
  no_show: text('No-show', 'Gelmedi'),
}

const toneDot: Record<DeskTone, string> = {
  warning: 'bg-amber-500',
  info: 'bg-sky-500',
  success: 'bg-emerald-500',
  neutral: 'bg-zinc-400',
  danger: 'bg-rose-500',
}

const copy = {
  requested: text('requested {when}', '{when} geldi'),
  pickup: text('Pickup {when}', 'Teslim {when}'),
  pickupLate: text('Pickup {duration} late', 'Teslim {duration} gecikti'),
  returnAt: text('Return {when}', 'İade {when}'),
  returnLate: text('Return {duration} overdue', 'İade {duration} gecikti'),
  today: text('today', 'bugün'),
  tomorrow: text('tomorrow', 'yarın'),
  paid: text('Fully paid', 'Tamamı ödendi'),
  due: text('{amount} due', '{amount} kaldı'),
  refunded: text('Refunded', 'İade edildi'),
  nothing: text('No payment', 'Ödeme yok'),
}

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? '')

const DAY_MS = 86_400_000
const TIME_ZONE = 'Europe/Istanbul'

function localDay(value: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(value)
}

/** "today 10:00", "tomorrow 09:30", "in 3 days" (relative to the server-provided `now`). */
function when(at: Date, now: Date, lang: AdminLang, t: (value: AdminText) => string): string {
  const time = new Intl.DateTimeFormat(intlLocale(lang), { timeStyle: 'short', timeZone: TIME_ZONE }).format(at)
  if (localDay(at) === localDay(now)) return `${t(copy.today)} ${time}`
  if (localDay(at) === localDay(new Date(now.getTime() + DAY_MS))) return `${t(copy.tomorrow)} ${time}`
  const rtf = new Intl.RelativeTimeFormat(intlLocale(lang), { numeric: 'auto' })
  const diff = at.getTime() - now.getTime()
  if (Math.abs(diff) < DAY_MS) return rtf.format(Math.round(diff / 3_600_000), 'hour')
  return rtf.format(Math.round(diff / DAY_MS), 'day')
}

/** "2 hours", "3 days" */
function duration(ms: number, lang: AdminLang): string {
  const hours = Math.max(1, Math.round(ms / 3_600_000))
  const unit = hours < 48 ? 'hour' : 'day'
  const value = unit === 'hour' ? hours : Math.round(hours / 24)
  return new Intl.NumberFormat(intlLocale(lang), { style: 'unit', unit, unitDisplay: 'long' }).format(value)
}

export function momentText(moment: DeskMoment, now: Date, lang: AdminLang, t: (value: AdminText) => string): string | null {
  if (!moment) return null
  const at = new Date(moment.at)
  switch (moment.kind) {
    case 'requested':
      return fill(t(copy.requested), { when: new Intl.RelativeTimeFormat(intlLocale(lang), { numeric: 'auto' }).format(-Math.max(1, Math.round((now.getTime() - at.getTime()) / 3_600_000)), 'hour') })
    case 'pickup':
      return moment.overdue ? fill(t(copy.pickupLate), { duration: duration(now.getTime() - at.getTime(), lang) }) : fill(t(copy.pickup), { when: when(at, now, lang, t) })
    case 'return':
      return moment.overdue ? fill(t(copy.returnLate), { duration: duration(now.getTime() - at.getTime(), lang) }) : fill(t(copy.returnAt), { when: when(at, now, lang, t) })
    case 'returned':
      return new Intl.DateTimeFormat(intlLocale(lang), { dateStyle: 'medium', timeZone: TIME_ZONE }).format(at)
  }
}

export function deskStateLabel(state: DeskState, t: (value: AdminText) => string): string {
  return t(stateLabels[state])
}

/** Two-line status cell: next step, and the moment that matters (red when late). */
export function DeskStatusCell({ status, now }: { status: DeskStatus; now: string }) {
  const t = useT()
  const lang = useAdminLang()
  const detail = momentText(status.moment, new Date(now), lang, t)
  return (
    <div>
      <StatusText dot={toneDot[status.urgent ? 'danger' : status.tone]} label={t(stateLabels[status.state])} />
      {detail && <div className={cn('pl-4 text-xs', status.urgent ? 'font-medium text-rose-600 dark:text-rose-400' : 'text-muted-foreground')}>{detail}</div>}
    </div>
  )
}

/** Muted line under an amount: what is still owed, in money. */
export function PaymentSummaryText({ summary, currency, className }: { summary: PaymentSummary; currency: string; className?: string }) {
  const t = useT()
  const lang = useAdminLang()
  switch (summary.kind) {
    case 'paid':
      return <span className={cn('text-xs text-emerald-600 dark:text-emerald-400', className)}>{t(copy.paid)}</span>
    case 'due':
      return summary.amount > 0 ? (
        <span className={cn('text-xs font-medium text-amber-600 dark:text-amber-400', className)}>{fill(t(copy.due), { amount: formatMoney(summary.amount, currency, lang) })}</span>
      ) : (
        <span className={cn('text-muted-foreground text-xs', className)}>—</span>
      )
    case 'refunded':
      return <span className={cn('text-muted-foreground text-xs', className)}>{t(copy.refunded)}</span>
    case 'none':
      return <span className={cn('text-muted-foreground text-xs', className)}>{t(copy.nothing)}</span>
  }
}

const toneBadge: Record<DeskTone, string> = {
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  info: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  neutral: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300',
  danger: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
}

/** Page-header variant (stands alone, so a boxed badge is fine). */
export function DeskStatusBadge({ status, now }: { status: DeskStatus; now: string }) {
  const t = useT()
  const lang = useAdminLang()
  const detail = momentText(status.moment, new Date(now), lang, t)
  const tone = status.urgent ? 'danger' : status.tone
  return (
    <Badge variant="outline" className={cn('gap-1.5 font-medium', toneBadge[tone])}>
      <span className={cn('size-1.5 rounded-full', toneDot[tone])} />
      {t(stateLabels[status.state])}
      {detail && <span className="font-normal opacity-80">· {detail}</span>}
    </Badge>
  )
}

export function PaymentSummaryBadge({ summary, currency }: { summary: PaymentSummary; currency: string }) {
  const t = useT()
  const lang = useAdminLang()
  if (summary.kind === 'due' && summary.amount === 0) return null
  const tone = summary.kind === 'paid' ? 'success' : summary.kind === 'due' ? 'warning' : 'neutral'
  const label =
    summary.kind === 'paid'
      ? t(copy.paid)
      : summary.kind === 'due'
        ? fill(t(copy.due), { amount: formatMoney(summary.amount, currency, lang) })
        : summary.kind === 'refunded'
          ? t(copy.refunded)
          : t(copy.nothing)
  return (
    <Badge variant="outline" className={cn('font-medium tabular-nums', toneBadge[tone])}>
      {label}
    </Badge>
  )
}
