'use client'

import { AlertOctagon, Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { text } from '@/i18n/admin'
import { cn } from '@/lib/utils'

import { formatDate } from '../format'
import { useAdminLang, useT } from '../lang-context'
import { EmptyState } from '../shared/empty-state'
import { SearchInput } from '../shared/search-input'
import { TablePagination } from '../shared/table-pagination'
import { useQueryParams } from '../shared/use-query-params'
import type { CustomerListData } from './data'

const copy = {
  all: text('All', 'Tümü'),
  blacklisted: text('Blacklisted', 'Kara liste'),
  search: text('Search name, email, phone, ID or license…', 'Ad, e-posta, telefon, kimlik veya ehliyet ara…'),
  name: text('Customer', 'Müşteri'),
  contact: text('Contact', 'İletişim'),
  country: text('Country', 'Ülke'),
  rentals: text('Rentals', 'Kiralama'),
  lastRental: text('Last rental', 'Son kiralama'),
  since: text('Customer since', 'Kayıt'),
  empty: text('No customers found', 'Müşteri bulunamadı'),
  emptyHint: text('Customers are created automatically with reservations.', 'Müşteriler rezervasyonla birlikte otomatik oluşur.'),
}

export function CustomersTable({ data }: { data: CustomerListData }) {
  const t = useT()
  const lang = useAdminLang()
  const router = useRouter()
  const { update, pending } = useQueryParams()

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={data.filter} onValueChange={(value) => update({ filter: value === 'all' ? null : value })}>
          <TabsList>
            <TabsTrigger value="all">{t(copy.all)}</TabsTrigger>
            <TabsTrigger value="blacklisted">{t(copy.blacklisted)}</TabsTrigger>
          </TabsList>
        </Tabs>
        <SearchInput placeholder={t(copy.search)} className="w-full sm:w-96" />
      </div>
      <Card className={cn('overflow-hidden py-0 transition-opacity', pending && 'opacity-60')}>
        {data.rows.length === 0 ? (
          <EmptyState icon={Users} title={t(copy.empty)} description={t(copy.emptyHint)} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="pl-4">{t(copy.name)}</TableHead>
                <TableHead>{t(copy.contact)}</TableHead>
                <TableHead>{t(copy.country)}</TableHead>
                <TableHead className="text-right">{t(copy.rentals)}</TableHead>
                <TableHead>{t(copy.lastRental)}</TableHead>
                <TableHead className="pr-4">{t(copy.since)}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((row) => (
                <TableRow key={row.id} className="cursor-pointer" onClick={() => router.push(`/admin/customers/${row.id}`)}>
                  <TableCell className="pl-4">
                    <Link href={`/admin/customers/${row.id}`} className="font-medium hover:underline" onClick={(event) => event.stopPropagation()}>
                      {row.fullName}
                    </Link>
                    {row.isBlacklisted && (
                      <Badge variant="destructive" className="ml-2 h-5 gap-1 px-1.5">
                        <AlertOctagon className="size-3" />
                        {t(copy.blacklisted)}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>{row.phone}</div>
                    <div className="text-muted-foreground text-xs">{row.email}</div>
                  </TableCell>
                  <TableCell>{row.country ?? '—'}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.rentals}</TableCell>
                  <TableCell className="tabular-nums">{formatDate(row.lastRentalAt, lang)}</TableCell>
                  <TableCell className="text-muted-foreground pr-4 tabular-nums">{formatDate(row.createdAt, lang)}</TableCell>
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
