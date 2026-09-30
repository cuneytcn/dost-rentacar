'use client'

import { ArrowDown, ArrowUp, Check, ImageOff, Inbox, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { text, type AdminText } from '@/i18n/admin'
import { cn } from '@/lib/utils'

import { formatDate, formatDateTime, formatMoney } from '../format'
import { intlLocale, type AdminLang } from '../lang'
import { useAdminLang, useT } from '../lang-context'
import { EmptyState } from '../shared/empty-state'
import { SearchInput } from '../shared/search-input'
import { StatusText } from '../shared/status-badge'
import { TablePagination } from '../shared/table-pagination'
import { useQueryParams } from '../shared/use-query-params'
import type { CellValue, ResourceListData } from './data'
import { getResource } from './registry'
import type { CollectionResource, ColumnDef, ColumnKind } from './types'

const copy = {
  all: text('All', 'Tümü'),
  active: text('Active', 'Aktif'),
  inactive: text('Inactive', 'Pasif'),
  search: text('Search…', 'Ara…'),
  new: text('New', 'Yeni'),
  empty: text('Nothing here yet', 'Henüz kayıt yok'),
  emptyFiltered: text('Try another filter or clear the search.', 'Başka bir filtre deneyin veya aramayı temizleyin.'),
  any: text('All', 'Tümü'),
  clear: text('Clear filters', 'Filtreleri temizle'),
}

const RIGHT_ALIGNED: ColumnKind[] = ['number', 'money', 'percent']

function Cell({
  kind,
  value,
  options,
  path,
  currency,
  lang,
  t,
}: {
  kind: ColumnKind
  value: CellValue
  options?: Record<string, AdminText>
  path: string
  currency: string
  lang: AdminLang
  t: (value: AdminText) => string
}) {
  if (value === null || value === undefined || value === '') {
    if (kind === 'image') {
      return (
        <div className="bg-muted text-muted-foreground flex h-9 w-12 items-center justify-center rounded-md">
          <ImageOff className="size-4" />
        </div>
      )
    }
    return <span className="text-muted-foreground">—</span>
  }
  switch (kind) {
    case 'mono':
      return <span className="font-mono">{String(value)}</span>
    case 'number':
      return <span className="tabular-nums">{Number(value).toLocaleString(intlLocale(lang))}</span>
    case 'money':
      return <span className="tabular-nums">{formatMoney(Number(value), currency, lang)}</span>
    case 'percent': {
      const number = Number(value)
      return <span className="tabular-nums">{`${number > 0 ? '+' : number < 0 ? '−' : ''}${Math.abs(number)}%`}</span>
    }
    case 'badge':
      return <span>{options?.[String(value)] ? t(options[String(value)]!) : String(value)}</span>
    case 'boolean':
      if (path === 'isActive') {
        return <StatusText dot={value ? 'bg-emerald-500' : 'bg-zinc-400'} label={t(value ? copy.active : copy.inactive)} />
      }
      return value ? <Check className="size-4 text-emerald-600" /> : <span className="text-muted-foreground">—</span>
    case 'date':
      return <span className="tabular-nums">{formatDate(String(value).length === 10 ? `${value}T12:00:00Z` : String(value), lang)}</span>
    case 'datetime':
      return <span className="tabular-nums">{formatDateTime(String(value), lang)}</span>
    case 'image':
      return (
        // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
        <img src={String(value)} alt="" className="h-9 w-12 rounded-md border object-cover" />
      )
    default:
      return <span>{String(value)}</span>
  }
}

function SortableHead({ column, sort, className }: { column: ColumnDef; sort: string; className?: string }) {
  const t = useT()
  const { update } = useQueryParams()
  const active = sort.replace(/^-/, '') === column.path
  const descending = sort.startsWith('-')
  const right = RIGHT_ALIGNED.includes(column.kind)
  if (column.kind === 'image') return <TableHead className={cn('w-16', className)}>{t(column.label)}</TableHead>
  return (
    <TableHead className={cn(right && 'text-right', className)}>
      <button
        type="button"
        className={cn('hover:text-foreground inline-flex items-center gap-1', right && 'flex-row-reverse', active && 'text-foreground')}
        onClick={() => update({ sort: active && !descending ? `-${column.path}` : column.path })}
      >
        {t(column.label)}
        {active && (descending ? <ArrowDown className="size-3.5" /> : <ArrowUp className="size-3.5" />)}
      </button>
    </TableHead>
  )
}

export function ResourceListView({ path, data }: { path: string; data: ResourceListData }) {
  const resource = getResource(path) as CollectionResource
  const t = useT()
  const lang = useAdminLang()
  const router = useRouter()
  const { update, get, pending } = useQueryParams()
  const { columns } = resource.list
  const filtered = Boolean(get('q') || resource.list.filters?.some((filter) => get(filter.name)))

  // A left-aligned column right after a right-aligned one gets extra room.
  const gapAfterRight = (index: number) => index > 0 && RIGHT_ALIGNED.includes(columns[index - 1]!.kind) && !RIGHT_ALIGNED.includes(columns[index]!.kind)
  const edge = (index: number) => cn(index === 0 && 'pl-4', index === columns.length - 1 && 'pr-4', gapAfterRight(index) && 'pl-8')

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        {resource.list.activeTabs && (
          <Tabs value={data.activeTab} onValueChange={(value) => update({ active: value === 'all' ? null : value })}>
            <TabsList>
              <TabsTrigger value="all">{t(copy.all)}</TabsTrigger>
              <TabsTrigger value="active">{t(copy.active)}</TabsTrigger>
              <TabsTrigger value="inactive">{t(copy.inactive)}</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
        {resource.list.searchFields.length > 0 && <SearchInput placeholder={t(copy.search)} className="w-full sm:w-72" />}
        {resource.list.filters?.map((filter) => (
          <Select key={filter.name} value={get(filter.name) || 'all'} onValueChange={(value) => update({ [filter.name]: value === 'all' ? null : value })}>
            <SelectTrigger className="w-44">
              <span className="text-muted-foreground mr-1">{t(filter.label)}:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t(copy.any)}</SelectItem>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(option.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
        {filtered && (
          <Button variant="ghost" onClick={() => update(Object.fromEntries([['q', null], ...(resource.list.filters ?? []).map((filter) => [filter.name, null])]))}>
            {t(copy.clear)}
          </Button>
        )}
        {data.permissions.create && (
          <Button className="ml-auto" asChild>
            <Link href={`/admin/${path}/new`}>
              <Plus />
              {t(copy.new)}
            </Link>
          </Button>
        )}
      </div>

      <Card className={cn('overflow-hidden py-0 transition-opacity', pending && 'opacity-60')}>
        {data.rows.length === 0 ? (
          <EmptyState icon={Inbox} title={t(copy.empty)} description={filtered ? t(copy.emptyFiltered) : undefined} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                {columns.map((column, index) => (
                  <SortableHead key={column.path} column={column} sort={data.sort} className={edge(index)} />
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((row) => (
                <TableRow key={row.id} className={cn(row.href && 'cursor-pointer')} onClick={() => row.href && router.push(row.href)}>
                  {columns.map((column, index) => {
                    const right = RIGHT_ALIGNED.includes(column.kind)
                    const secondary = column.secondary ? row.cells[`${column.path}__secondary`] : undefined
                    return (
                      <TableCell key={column.path} className={cn(right && 'text-right', edge(index), index === 0 && 'font-medium')}>
                        <Cell kind={column.kind} value={row.cells[column.path] ?? null} options={column.options} path={column.path} currency={data.currency} lang={lang} t={t} />
                        {column.secondary && (
                          <div className="text-muted-foreground text-xs font-normal">
                            <Cell
                              kind={column.secondary.kind}
                              value={secondary ?? null}
                              options={column.secondary.options}
                              path={column.secondary.path}
                              currency={data.currency}
                              lang={lang}
                              t={t}
                            />
                          </div>
                        )}
                      </TableCell>
                    )
                  })}
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
