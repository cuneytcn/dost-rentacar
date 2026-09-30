'use client'

import { ArrowDown, ArrowUp, CalendarCheck, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { optionLabels, text } from '@/i18n/admin'
import { cn } from '@/lib/utils'

import { formatDateTime, formatMoney } from '../format'
import { useAdminLang, useT } from '../lang-context'
import { DateRangePicker } from '../shared/date-picker'
import { EmptyState } from '../shared/empty-state'
import { SearchInput } from '../shared/search-input'
import { DeskStatusCell, PaymentSummaryText } from './desk-status'
import { TablePagination } from '../shared/table-pagination'
import { useQueryParams } from '../shared/use-query-params'
import { RESERVATION_TABS, type ReservationTab } from './constants'
import type { ReservationListData } from './list-data'

const tabLabels: Record<ReservationTab, ReturnType<typeof text>> = {
  all: text('All', 'Tümü'),
  pending: text('Awaiting confirmation', 'Onay bekleyen'),
  confirmed: text('Awaiting pickup', 'Teslim bekleyen'),
  active: text('With customer', 'Müşteride'),
  completed: text('Returned', 'İade alınan'),
  cancelled: text('Cancelled', 'İptal'),
}

const copy = {
  search: text('Search code, customer, phone or plate…', 'Kod, müşteri, telefon veya plaka ara…'),
  allLocations: text('All locations', 'Tüm şubeler'),
  anyPayment: text('Any payment status', 'Tüm ödeme durumları'),
  from: text('Pickup from', 'Alış başlangıç'),
  to: text('Pickup to', 'Alış bitiş'),
  code: text('Reservation', 'Rezervasyon'),
  customer: text('Customer', 'Müşteri'),
  vehicle: text('Vehicle', 'Araç'),
  pickup: text('Pickup', 'Alış'),
  return: text('Return', 'İade'),
  total: text('Total', 'Tutar'),
  payment: text('Payment', 'Ödeme'),
  status: text('Status', 'Durum'),
  noPlate: text('No plate yet', 'Plaka atanmadı'),
  days: text('days', 'gün'),
  empty: text('No reservations found', 'Rezervasyon bulunamadı'),
  emptyHint: text('Try another tab or clear the filters.', 'Başka bir sekme deneyin veya filtreleri temizleyin.'),
  clear: text('Clear filters', 'Filtreleri temizle'),
  create: text('New reservation', 'Yeni rezervasyon'),
}

function SortableHead({ field, sort, children, className }: { field: string; sort: string; children: React.ReactNode; className?: string }) {
  const { update } = useQueryParams()
  const active = sort.replace(/^-/, '') === field
  const descending = sort.startsWith('-')
  return (
    <TableHead className={className}>
      <button
        type="button"
        className={cn('hover:text-foreground inline-flex items-center gap-1', active && 'text-foreground')}
        onClick={() => update({ sort: active && !descending ? `-${field}` : field })}
      >
        {children}
        {active && (descending ? <ArrowDown className="size-3.5" /> : <ArrowUp className="size-3.5" />)}
      </button>
    </TableHead>
  )
}

export function ReservationsTable({ data }: { data: ReservationListData }) {
  const t = useT()
  const lang = useAdminLang()
  const router = useRouter()
  const { update, get, pending } = useQueryParams()
  const hasFilters = Boolean(get('q') || get('location') || get('payment') || get('from') || get('to'))

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* On phones the status tabs scroll sideways instead of wrapping over the button. */}
        <Tabs value={data.tab} onValueChange={(value) => update({ tab: value === 'all' ? null : value, sort: null })} className="max-w-full min-w-0 overflow-x-auto">
          <TabsList>
            {RESERVATION_TABS.map((tab) => (
              <TabsTrigger key={tab} value={tab} className="gap-2">
                {t(tabLabels[tab])}
                <Badge variant={tab === 'pending' && data.tabCounts.pending > 0 ? 'default' : 'secondary'} className="h-5 min-w-5 rounded-full px-1.5 tabular-nums">
                  {data.tabCounts[tab]}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button asChild>
          <Link href="/admin/reservations/new">
            <Plus />
            {t(copy.create)}
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder={t(copy.search)} className="w-full sm:w-80" />
        {data.locations.length > 1 && (
          <Select value={get('location') || 'all'} onValueChange={(value) => update({ location: value === 'all' ? null : value })}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t(copy.allLocations)}</SelectItem>
              {data.locations.map((location) => (
                <SelectItem key={location.id} value={String(location.id)}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={get('payment') || 'all'} onValueChange={(value) => update({ payment: value === 'all' ? null : value })}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t(copy.anyPayment)}</SelectItem>
            {(['unpaid', 'partial', 'paid', 'refunded'] as const).map((status) => (
              <SelectItem key={status} value={status}>
                {t(optionLabels.paymentStatus[status])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DateRangePicker className="w-64" from={get('from')} to={get('to')} onChange={(range) => update(range)} />
        {hasFilters && (
          <Button variant="ghost" onClick={() => update({ q: null, location: null, payment: null, from: null, to: null })}>
            {t(copy.clear)}
          </Button>
        )}
      </div>

      <Card className={cn('overflow-hidden py-0 transition-opacity', pending && 'opacity-60')}>
        {data.rows.length === 0 ? (
          <EmptyState icon={CalendarCheck} title={t(copy.empty)} description={t(copy.emptyHint)} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <SortableHead field="code" sort={data.sort} className="pl-4">
                  {t(copy.code)}
                </SortableHead>
                <TableHead>{t(copy.customer)}</TableHead>
                <TableHead>{t(copy.vehicle)}</TableHead>
                <SortableHead field="pickupAt" sort={data.sort}>
                  {t(copy.pickup)}
                </SortableHead>
                <SortableHead field="returnAt" sort={data.sort}>
                  {t(copy.return)}
                </SortableHead>
                <SortableHead field="pricing.total" sort={data.sort} className="text-right [&>button]:flex-row-reverse">
                  {t(copy.total)}
                </SortableHead>
                <TableHead className="pr-4 pl-8">{t(copy.status)}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((row) => (
                <TableRow key={row.id} className="cursor-pointer" onClick={() => router.push(`/admin/reservations/${row.id}`)}>
                  <TableCell className="pl-4">
                    <Link href={`/admin/reservations/${row.id}`} className="font-mono text-sm font-semibold hover:underline" onClick={(event) => event.stopPropagation()}>
                      {row.code}
                    </Link>
                    <div className="text-muted-foreground text-xs">{t(optionLabels.reservationSource[row.source])}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{row.customerName}</div>
                    <div className="text-muted-foreground text-xs">{row.customerPhone}</div>
                  </TableCell>
                  <TableCell>
                    <div>{row.vehicleModel}</div>
                    {row.plate ? (
                      <div className="text-muted-foreground font-mono text-xs">{row.plate}</div>
                    ) : (
                      <div className="text-xs text-amber-600 dark:text-amber-400">{t(copy.noPlate)}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="tabular-nums">{formatDateTime(row.pickupAt, lang)}</div>
                    <div className="text-muted-foreground text-xs">{row.pickupLocation}</div>
                  </TableCell>
                  <TableCell>
                    <div className="tabular-nums">{formatDateTime(row.returnAt, lang)}</div>
                    <div className="text-muted-foreground text-xs">
                      {row.returnLocation} · {row.rentalDays} {t(copy.days)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-medium tabular-nums">{formatMoney(row.total, row.currency, lang)}</div>
                    <PaymentSummaryText summary={row.payment} currency={row.currency} className="tabular-nums" />
                  </TableCell>
                  <TableCell className="pr-4 pl-8">
                    <DeskStatusCell status={row.desk} now={data.now} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      <TablePagination page={data.page} totalPages={data.totalPages} totalDocs={data.totalDocs} />
    </div>
  )
}
