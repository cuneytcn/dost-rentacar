'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { text } from '@/i18n/admin'

import { useT } from '../lang-context'
import { useQueryParams } from './use-query-params'

const copy = {
  of: text('of', '/'),
  results: text('results', 'kayıt'),
  previous: text('Previous', 'Önceki'),
  next: text('Next', 'Sonraki'),
}

export function TablePagination({ page, totalPages, totalDocs }: { page: number; totalPages: number; totalDocs: number }) {
  const t = useT()
  const { update, pending } = useQueryParams()
  return (
    <div className="text-muted-foreground flex items-center justify-between gap-4 px-1 text-sm">
      <span className="tabular-nums">
        {totalDocs} {t(copy.results)}
      </span>
      <div className="flex items-center gap-2">
        <span className="tabular-nums">
          {page} {t(copy.of)} {Math.max(totalPages, 1)}
        </span>
        <Button variant="outline" size="icon" className="size-8" disabled={page <= 1 || pending} onClick={() => update({ page: page - 1 })} aria-label={t(copy.previous)}>
          <ChevronLeft />
        </Button>
        <Button variant="outline" size="icon" className="size-8" disabled={page >= totalPages || pending} onClick={() => update({ page: page + 1 })} aria-label={t(copy.next)}>
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}
