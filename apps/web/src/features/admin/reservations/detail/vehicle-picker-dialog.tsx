'use client'

import { Check, Loader2, MapPin, Wrench } from 'lucide-react'
import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { text } from '@/i18n/admin'
import { cn } from '@/lib/utils'

import { intlLocale } from '../../lang'
import { useAdminLang, useT } from '../../lang-context'
import { assignVehicleAction, confirmReservationAction, getVehicleOptionsAction, type VehicleOption } from '../actions'

const copy = {
  confirmTitle: text('Confirm reservation', 'Rezervasyonu onayla'),
  confirmDescription: text(
    'Pick the car that will be handed over. You can also confirm now and assign a plate later.',
    'Teslim edilecek aracı seçin. İsterseniz şimdi onaylayıp plakayı sonra da atayabilirsiniz.',
  ),
  assignTitle: text('Assign vehicle', 'Araç ata'),
  assignDescription: text('Only cars that are free for this period can be selected.', 'Sadece bu tarihlerde boş olan araçlar seçilebilir.'),
  sameModel: text('Booked model', 'Rezerve edilen model'),
  otherModels: text('Other models', 'Diğer modeller'),
  free: text('Free', 'Boş'),
  busy: text('Booked', 'Dolu'),
  blocked: text('Maintenance', 'Bakımda'),
  otherLocation: text('at another location', 'başka şubede'),
  confirmOnly: text('Confirm without vehicle', 'Araçsız onayla'),
  confirmWith: text('Confirm with selected car', 'Seçili araçla onayla'),
  assign: text('Assign', 'Ata'),
  unassign: text('Remove vehicle', 'Aracı kaldır'),
  confirmed: text('Reservation confirmed', 'Rezervasyon onaylandı'),
  assigned: text('Vehicle updated', 'Araç güncellendi'),
  noVehicles: text('No active vehicles.', 'Aktif araç yok.'),
}

export function VehiclePickerDialog({
  reservationId,
  mode,
  currentVehicleId,
  open,
  onOpenChange,
}: {
  reservationId: number
  mode: 'confirm' | 'assign'
  currentVehicleId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useT()
  const lang = useAdminLang()
  const [options, setOptions] = useState<VehicleOption[] | null>(null)
  const [selected, setSelected] = useState<number | null>(currentVehicleId)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) return
    let active = true
    void getVehicleOptionsAction(reservationId).then((result) => {
      if (!active) return
      if (result.ok) setOptions(result.data)
      else toast.error(result.message)
    })
    return () => {
      active = false
    }
  }, [open, reservationId])

  const submit = (vehicleId: number | null) =>
    startTransition(async () => {
      const result =
        mode === 'confirm' ? await confirmReservationAction({ id: reservationId, vehicleId }) : await assignVehicleAction({ id: reservationId, vehicleId })
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      toast.success(t(mode === 'confirm' ? copy.confirmed : copy.assigned))
      onOpenChange(false)
    })

  const groups = options ? [
    { label: copy.sameModel, items: options.filter((option) => option.sameModel) },
    { label: copy.otherModels, items: options.filter((option) => !option.sameModel) },
  ].filter((group) => group.items.length > 0) : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t(mode === 'confirm' ? copy.confirmTitle : copy.assignTitle)}</DialogTitle>
          <DialogDescription>{t(mode === 'confirm' ? copy.confirmDescription : copy.assignDescription)}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="-mx-6 max-h-[55vh] px-6">
          {!options ? (
            <div className="space-y-2">
              {[0, 1, 2].map((index) => (
                <Skeleton key={index} className="h-14 w-full" />
              ))}
            </div>
          ) : options.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">{t(copy.noVehicles)}</p>
          ) : (
            <div className="space-y-4">
              {groups.map((group) => (
                <div key={group.label.en} className="space-y-2">
                  <p className="text-muted-foreground text-xs font-medium uppercase">{t(group.label)}</p>
                  {group.items.map((option) => {
                    const disabled = option.availability.status !== 'free' && option.id !== currentVehicleId
                    const isSelected = selected === option.id
                    return (
                      <button
                        key={option.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => setSelected(isSelected ? null : option.id)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                          isSelected ? 'border-primary bg-primary/5 ring-primary ring-1' : 'hover:bg-muted/50',
                          disabled && 'cursor-not-allowed opacity-50 hover:bg-transparent',
                        )}
                      >
                        <div className={cn('flex size-5 items-center justify-center rounded-full border', isSelected && 'border-primary bg-primary text-primary-foreground')}>
                          {isSelected && <Check className="size-3" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold">{option.plate}</span>
                            <span className="text-muted-foreground truncate text-sm">{option.model}</span>
                          </div>
                          <div className="text-muted-foreground flex items-center gap-1 text-xs">
                            <MapPin className="size-3" />
                            {option.location}
                            {!option.atPickupLocation && <span className="text-amber-600 dark:text-amber-400">· {t(copy.otherLocation)}</span>}
                            <span>· {option.mileageKm.toLocaleString(intlLocale(lang))} km</span>
                          </div>
                        </div>
                        {option.availability.status === 'free' ? (
                          <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                            {t(copy.free)}
                          </Badge>
                        ) : option.availability.status === 'blocked' ? (
                          <Badge variant="outline" className="gap-1 border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300">
                            <Wrench className="size-3" />
                            {t(copy.blocked)}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 font-mono text-rose-700 dark:text-rose-300">
                            {t(copy.busy)} · {option.availability.reservationCode}
                          </Badge>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <DialogFooter className="gap-2 sm:justify-between">
          {mode === 'confirm' ? (
            <Button variant="ghost" disabled={pending} onClick={() => submit(null)}>
              {t(copy.confirmOnly)}
            </Button>
          ) : currentVehicleId ? (
            <Button variant="ghost" disabled={pending} onClick={() => submit(null)}>
              {t(copy.unassign)}
            </Button>
          ) : (
            <span />
          )}
          <Button disabled={pending || !selected || (mode === 'assign' && selected === currentVehicleId)} onClick={() => submit(selected)}>
            {pending && <Loader2 className="animate-spin" />}
            {t(mode === 'confirm' ? copy.confirmWith : copy.assign)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
