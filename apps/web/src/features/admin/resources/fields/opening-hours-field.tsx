'use client'

import { Copy } from 'lucide-react'

import { WEEKDAYS, type Weekday } from '@rent/shared'

import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { optionLabels, text } from '@/i18n/admin'
import { cn } from '@/lib/utils'

import { useT } from '../../lang-context'
import { TimeSelect } from '../../shared/date-picker'

type Slot = { day: Weekday; opensAt: string; closesAt: string }

const copy = {
  closed: text('Closed', 'Kapalı'),
  copyMonday: text('Copy Monday to all days', 'Pazartesiyi tüm günlere kopyala'),
}

const DEFAULT_SLOT = { opensAt: '08:00', closesAt: '20:00' }

/** One row per weekday; a missing day means closed (same semantics as the pricing rules). */
export function OpeningHoursField({ value, onChange, disabled }: { value: Slot[]; onChange: (value: Slot[]) => void; disabled?: boolean }) {
  const t = useT()
  const byDay = new Map(value.map((slot) => [slot.day, slot]))
  const set = (day: Weekday, slot: Omit<Slot, 'day'> | null) => {
    const next = WEEKDAYS.flatMap((weekday) => {
      if (weekday === day) return slot ? [{ day, ...slot }] : []
      const existing = byDay.get(weekday)
      return existing ? [existing] : []
    })
    onChange(next)
  }
  const monday = byDay.get('mon')

  return (
    <div className="space-y-3">
      <div className="divide-y rounded-lg border">
        {WEEKDAYS.map((day) => {
          const slot = byDay.get(day)
          return (
            <div key={day} className="grid grid-cols-[7rem_auto_1fr] items-center gap-4 px-3 py-2">
              <span className="text-sm font-medium">{t(optionLabels.weekday[day])}</span>
              <Switch checked={Boolean(slot)} disabled={disabled} onCheckedChange={(open) => set(day, open ? { ...DEFAULT_SLOT, ...(monday ?? {}) } : null)} />
              {slot ? (
                <div className="flex items-center gap-2">
                  <TimeSelect disabled={disabled} value={slot.opensAt} onChange={(value) => set(day, { opensAt: value, closesAt: slot.closesAt })} />
                  <span className="text-muted-foreground">–</span>
                  <TimeSelect disabled={disabled} value={slot.closesAt} onChange={(value) => set(day, { opensAt: slot.opensAt, closesAt: value })} />
                </div>
              ) : (
                <span className={cn('text-muted-foreground text-sm')}>{t(copy.closed)}</span>
              )}
            </div>
          )
        })}
      </div>
      {monday && !disabled && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange(WEEKDAYS.map((day) => ({ day, opensAt: monday.opensAt, closesAt: monday.closesAt })))}
        >
          <Copy />
          {t(copy.copyMonday)}
        </Button>
      )}
    </div>
  )
}
