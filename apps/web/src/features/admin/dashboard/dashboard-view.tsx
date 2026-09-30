'use client'

import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  Building2,
  CalendarClock,
  CarFront,
  ShieldAlert,
  Timer,
} from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { text, type AdminText } from '@/i18n/admin'
import { cn } from '@/lib/utils'
import type { VehicleDocumentField } from '@/services/vehicle-documents'

import { formatDate, formatMoney } from '../format'
import { useAdminLang, useT } from '../lang-context'
import { intlLocale } from '../lang'
import type { DashboardData, DashboardReservation } from './data'

const copy = {
  greeting: text('Welcome back', 'Tekrar hoş geldin'),
  pending: text('Awaiting confirmation', 'Onay bekleyen'),
  pendingHint: text('New requests from the website', 'Web sitesinden gelen talepler'),
  unassigned: text('Confirmed, no vehicle', 'Araç atanmamış'),
  unassignedHint: text('Assign a plate before pickup', 'Teslimden önce plaka atayın'),
  pickups: text('Pickups today', 'Bugünkü teslimler'),
  returns: text('Returns today', 'Bugünkü iadeler'),
  active: text('On rent now', 'Şu an kirada'),
  corporate: text('Corporate requests', 'Kurumsal talepler'),
  corporateHint: text('Waiting for an offer', 'Teklif bekliyor'),
  todayTitle: text("Today's movements", 'Bugünün hareketleri'),
  todayDescription: text('Cars going out and coming back today', 'Bugün çıkacak ve dönecek araçlar'),
  out: text('Pickup', 'Teslim'),
  in: text('Return', 'İade'),
  nothingToday: text('No pickups or returns today.', 'Bugün teslim veya iade yok.'),
  pendingTitle: text('Awaiting confirmation', 'Onay bekleyenler'),
  pendingDescription: text('Confirm and assign a vehicle', 'Onaylayıp araç atayın'),
  nothingPending: text('All caught up — no pending requests.', 'Bekleyen talep yok.'),
  documentsTitle: text('Vehicle documents', 'Araç belgeleri'),
  documentsDescription: text('Expiring within 30 days', '30 gün içinde bitenler'),
  noDocuments: text('No documents expiring soon.', 'Yakında biten belge yok.'),
  expired: text('Expired', 'Süresi doldu'),
  daysLeft: text('days left', 'gün kaldı'),
  today: text('Today', 'Bugün'),
  calendar: text('Occupancy calendar', 'Doluluk takvimi'),
  noPlate: text('No vehicle', 'Araç yok'),
}

const documentLabels: Record<VehicleDocumentField, AdminText> = {
  insuranceExpiresAt: text('Traffic insurance', 'Trafik sigortası'),
  cascoExpiresAt: text('Casco', 'Kasko'),
  inspectionExpiresAt: text('Inspection', 'Muayene'),
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'default',
}: {
  label: string
  value: number
  hint?: string
  icon: React.ComponentType<{ className?: string }>
  tone?: 'default' | 'warning' | 'info'
}) {
  return (
    <Card className="gap-3 py-5">
      <CardHeader className="px-5">
        <CardDescription className="flex items-center gap-2 text-sm">{label}</CardDescription>
        <CardAction>
          <div
            className={cn(
              'flex size-9 items-center justify-center rounded-lg',
              tone === 'warning' && value > 0 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-muted text-muted-foreground',
              tone === 'info' && value > 0 && 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
            )}
          >
            <Icon className="size-4" />
          </div>
        </CardAction>
        <CardTitle className="text-3xl font-semibold tabular-nums">{value}</CardTitle>
      </CardHeader>
      {hint && <CardContent className="text-muted-foreground px-5 text-xs">{hint}</CardContent>}
    </Card>
  )
}

function time(value: string, lang: 'tr' | 'en') {
  return new Intl.DateTimeFormat(intlLocale(lang), { timeStyle: 'short', timeZone: 'Europe/Istanbul' }).format(new Date(value))
}

function MovementRow({ reservation, direction }: { reservation: DashboardReservation; direction: 'out' | 'in' }) {
  const lang = useAdminLang()
  const t = useT()
  const at = direction === 'out' ? reservation.pickupAt : reservation.returnAt
  const location = direction === 'out' ? reservation.pickupLocation : reservation.returnLocation
  return (
    <Link
      href={`/admin/reservations/${reservation.id}`}
      className="hover:bg-muted/60 flex items-center gap-4 rounded-lg px-3 py-3 transition-colors"
    >
      <div
        className={cn(
          'flex size-10 shrink-0 flex-col items-center justify-center rounded-lg text-xs font-semibold tabular-nums',
          direction === 'out' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
        )}
      >
        {direction === 'out' ? <ArrowUpFromLine className="size-3.5" /> : <ArrowDownToLine className="size-3.5" />}
        {time(at, lang)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{reservation.customerName}</span>
          <span className="text-muted-foreground font-mono text-xs">{reservation.code}</span>
        </div>
        <div className="text-muted-foreground truncate text-sm">
          {reservation.vehicleModel} · {location}
        </div>
      </div>
      {reservation.plate ? (
        <Badge variant="secondary" className="font-mono">
          {reservation.plate}
        </Badge>
      ) : (
        <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300">
          {t(copy.noPlate)}
        </Badge>
      )}
    </Link>
  )
}

export function DashboardView({ data, userName }: { data: DashboardData; userName: string }) {
  const t = useT()
  const lang = useAdminLang()
  const movements = [
    ...data.pickupsToday.map((reservation) => ({ reservation, direction: 'out' as const, at: reservation.pickupAt })),
    ...data.returnsToday.map((reservation) => ({ reservation, direction: 'in' as const, at: reservation.returnAt })),
  ].sort((a, b) => a.at.localeCompare(b.at))

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm">
            {new Intl.DateTimeFormat(intlLocale(lang), { dateStyle: 'full', timeZone: 'Europe/Istanbul' }).format(new Date())}
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            {t(copy.greeting)}, {userName.split(' ')[0]}
          </h2>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/calendar">
            <CalendarClock />
            {t(copy.calendar)}
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label={t(copy.pending)} value={data.counts.pending} hint={t(copy.pendingHint)} icon={Timer} tone="warning" />
        <StatCard label={t(copy.unassigned)} value={data.counts.unassigned} hint={t(copy.unassignedHint)} icon={AlertTriangle} tone="warning" />
        <StatCard label={t(copy.pickups)} value={data.counts.pickupsToday} icon={ArrowUpFromLine} tone="info" />
        <StatCard label={t(copy.returns)} value={data.counts.returnsToday} icon={ArrowDownToLine} tone="info" />
        <StatCard label={t(copy.active)} value={data.counts.activeRentals} icon={CarFront} />
        <StatCard label={t(copy.corporate)} value={data.counts.newCorporate} hint={t(copy.corporateHint)} icon={Building2} tone="warning" />
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>{t(copy.todayTitle)}</CardTitle>
            <CardDescription>{t(copy.todayDescription)}</CardDescription>
          </CardHeader>
          <CardContent className="px-3">
            {movements.length === 0 ? (
              <p className="text-muted-foreground px-3 py-8 text-center text-sm">{t(copy.nothingToday)}</p>
            ) : (
              <div className="flex flex-col">
                {movements.map((movement) => (
                  <MovementRow key={`${movement.direction}-${movement.reservation.id}`} {...movement} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>{t(copy.pendingTitle)}</CardTitle>
            <CardDescription>{t(copy.pendingDescription)}</CardDescription>
          </CardHeader>
          <CardContent className="px-3">
            {data.pending.length === 0 ? (
              <p className="text-muted-foreground px-3 py-8 text-center text-sm">{t(copy.nothingPending)}</p>
            ) : (
              <div className="flex flex-col">
                {data.pending.map((reservation) => (
                  <Link
                    key={reservation.id}
                    href={`/admin/reservations/${reservation.id}`}
                    className="hover:bg-muted/60 flex items-center gap-3 rounded-lg px-3 py-3 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{reservation.customerName}</div>
                      <div className="text-muted-foreground truncate text-sm">
                        {reservation.vehicleModel} · {formatDate(reservation.pickupAt, lang)} → {formatDate(reservation.returnAt, lang)}
                      </div>
                    </div>
                    <div className="text-right text-sm font-medium tabular-nums">
                      {formatMoney(reservation.total, reservation.currency, lang)}
                    </div>
                    <ArrowRight className="text-muted-foreground size-4" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="size-4" />
            {t(copy.documentsTitle)}
          </CardTitle>
          <CardDescription>{t(copy.documentsDescription)}</CardDescription>
        </CardHeader>
        <CardContent>
          {data.expiringDocuments.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">{t(copy.noDocuments)}</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.expiringDocuments.map((item) => (
                <Link
                  key={`${item.vehicleId}-${item.document}`}
                  href={`/admin/vehicles/${item.vehicleId}`}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors',
                    item.daysLeft < 0
                      ? 'border-rose-500/40 bg-rose-500/5 hover:bg-rose-500/10'
                      : item.daysLeft <= 7
                        ? 'border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10'
                        : 'hover:bg-muted/60',
                  )}
                >
                  <div className="min-w-0">
                    <div className="font-mono text-sm font-semibold">{item.plate}</div>
                    <div className="text-muted-foreground text-sm">{t(documentLabels[item.document])}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm tabular-nums">{formatDate(`${item.expiresOn}T12:00:00Z`, lang)}</div>
                    <div
                      className={cn(
                        'text-xs font-medium',
                        item.daysLeft < 0 ? 'text-rose-600 dark:text-rose-400' : item.daysLeft <= 7 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground',
                      )}
                    >
                      {item.daysLeft < 0 ? t(copy.expired) : item.daysLeft === 0 ? t(copy.today) : `${item.daysLeft} ${t(copy.daysLeft)}`}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
