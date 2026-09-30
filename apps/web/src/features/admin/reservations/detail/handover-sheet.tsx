'use client'

import { AlertTriangle, Camera, Fuel, Gauge, Loader2, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { DAMAGE_AREAS, FUEL_LEVELS, type DamageArea, type FuelLevel } from '@rent/shared'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { optionLabels, text } from '@/i18n/admin'
import { resizeImage } from '@/lib/resize-image'
import { cn } from '@/lib/utils'

import { intlLocale } from '../../lang'
import { useAdminLang, useT } from '../../lang-context'
import { DateTimePicker } from '../../shared/date-picker'
import { fromDateTimeLocal, toDateTimeLocal } from '@/lib/local-datetime'
import { recordHandoverAction } from '../actions'

const copy = {
  pickupTitle: text('Hand over the car', 'Aracı teslim et'),
  pickupDescription: text('Record the car’s condition before the customer drives away.', 'Müşteri aracı almadan önce aracın durumunu kaydedin.'),
  returnTitle: text('Receive the car', 'Aracı iade al'),
  returnDescription: text('Check the car and note anything new since pickup.', 'Aracı kontrol edin ve teslimden bu yana oluşan değişiklikleri not edin.'),
  mileage: text('Mileage (km)', 'Kilometre'),
  pickupMileage: text('At pickup', 'Teslimde'),
  driven: text('driven', 'yol'),
  fuel: text('Fuel level', 'Yakıt seviyesi'),
  date: text('Date & time', 'Tarih ve saat'),
  damages: text('Damages', 'Hasarlar'),
  damagesHint: text('Existing scratches and dents, so they are not charged later.', 'Mevcut çizik ve göçükler; sonradan müşteriye yansıtılmaması için.'),
  addDamage: text('Add damage', 'Hasar ekle'),
  area: text('Area', 'Bölge'),
  description: text('Description', 'Açıklama'),
  isNew: text('New', 'Yeni'),
  photos: text('Photos', 'Fotoğraflar'),
  photosHint: text('All four sides, dashboard (km + fuel) and any damage.', 'Dört taraf, gösterge paneli (km + yakıt) ve hasarlar.'),
  addPhotos: text('Add photos', 'Fotoğraf ekle'),
  notes: text('Notes', 'Notlar'),
  savePickup: text('Complete handover', 'Teslimi tamamla'),
  saveReturn: text('Complete return', 'İadeyi tamamla'),
  savedPickup: text('Car handed over — rental started', 'Araç teslim edildi, kiralama başladı'),
  savedReturn: text('Car received — rental completed', 'Araç iade alındı, kiralama tamamlandı'),
  mileageLow: text('Mileage is lower than at pickup.', 'Kilometre teslimdekinden düşük.'),
  atPickup: text('At pickup', 'Teslimde'),
  balanceTitle: text('Payment outstanding', 'Kalan ödeme var'),
  balanceText: text('Collect the remaining amount before the customer leaves.', 'Müşteri ayrılmadan önce kalan tutarı tahsil edin.'),
}

type DamageRow = { key: number; area: DamageArea; description: string; isNew: boolean }
type PhotoItem = { key: number; file: File; preview: string }

export function HandoverSheet({
  reservationId,
  type,
  defaultMileage,
  pickupMileage,
  pickupFuel,
  balanceDue,
  open,
  onOpenChange,
}: {
  reservationId: number
  type: 'pickup' | 'return'
  defaultMileage: number
  pickupMileage: number | null
  pickupFuel: FuelLevel | null
  balanceDue: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useT()
  const lang = useAdminLang()
  const [mileage, setMileage] = useState(String(defaultMileage ?? ''))
  const [fuel, setFuel] = useState<FuelLevel>(pickupFuel ?? 'full')
  const [performedAt, setPerformedAt] = useState(() => toDateTimeLocal(new Date()))
  const [damages, setDamages] = useState<DamageRow[]>([])
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [notes, setNotes] = useState('')
  const [pending, startTransition] = useTransition()
  const fileInput = useRef<HTMLInputElement>(null)
  const nextKey = useRef(0)

  // Revoke preview URLs only on unmount (removal revokes its own URL).
  const photosRef = useRef(photos)
  useEffect(() => {
    photosRef.current = photos
  }, [photos])
  useEffect(() => () => photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.preview)), [])

  const mileageNumber = Number(mileage)
  const driven = pickupMileage != null && mileage ? mileageNumber - pickupMileage : null

  const addPhotos = async (files: FileList | null) => {
    if (!files) return
    const resized = await Promise.all([...files].map((file) => resizeImage(file)))
    setPhotos((current) => [...current, ...resized.map((file) => ({ key: nextKey.current++, file, preview: URL.createObjectURL(file) }))])
  }

  const submit = () => {
    if (type === 'return' && pickupMileage != null && mileageNumber < pickupMileage) {
      toast.error(t(copy.mileageLow))
      return
    }
    const formData = new FormData()
    formData.set('reservationId', String(reservationId))
    formData.set('type', type)
    formData.set('mileageKm', mileage)
    formData.set('fuelLevel', fuel)
    formData.set('performedAt', fromDateTimeLocal(performedAt))
    formData.set('notes', notes)
    formData.set('damages', JSON.stringify(damages.filter((row) => row.description.trim()).map(({ area, description, isNew }) => ({ area, description, isNew }))))
    photos.forEach((photo) => formData.append('photos', photo.file))

    startTransition(async () => {
      const result = await recordHandoverAction(formData)
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      toast.success(t(type === 'pickup' ? copy.savedPickup : copy.savedReturn))
      onOpenChange(false)
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle>{t(type === 'pickup' ? copy.pickupTitle : copy.returnTitle)}</SheetTitle>
          <SheetDescription>{t(type === 'pickup' ? copy.pickupDescription : copy.returnDescription)}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          {balanceDue && (
            <Alert className="border-amber-500/40 bg-amber-500/5 text-amber-900 dark:text-amber-200">
              <AlertTriangle />
              <AlertTitle>
                {t(copy.balanceTitle)}: {balanceDue}
              </AlertTitle>
              <AlertDescription className="text-amber-800/80 dark:text-amber-200/80">{t(copy.balanceText)}</AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="handover-km" className="flex items-center gap-1.5">
                <Gauge className="size-3.5" />
                {t(copy.mileage)}
              </Label>
              <Input id="handover-km" inputMode="numeric" value={mileage} onChange={(event) => setMileage(event.target.value.replace(/\D/g, ''))} className="tabular-nums" />
              {pickupMileage != null && (
                <p className={cn('text-xs', driven != null && driven < 0 ? 'text-destructive' : 'text-muted-foreground')}>
                  {t(copy.pickupMileage)}: {pickupMileage.toLocaleString(intlLocale(lang))} km
                  {driven != null && driven >= 0 && ` · ${driven.toLocaleString(intlLocale(lang))} km ${t(copy.driven)}`}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="handover-date">{t(copy.date)}</Label>
              <DateTimePicker id="handover-date" value={performedAt} onChange={setPerformedAt} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="flex items-center gap-1.5">
              <Fuel className="size-3.5" />
              {t(copy.fuel)}
            </Label>
            <div className="grid grid-cols-5 gap-1.5">
              {FUEL_LEVELS.map((level, index) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFuel(level)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-md border px-1 py-2 text-xs transition-colors',
                    fuel === level ? 'border-primary bg-primary/5 ring-primary font-medium ring-1' : 'hover:bg-muted/50',
                  )}
                >
                  <div className="bg-muted flex h-1.5 w-full overflow-hidden rounded-full">
                    <div className="bg-primary" style={{ width: `${(index / (FUEL_LEVELS.length - 1)) * 100}%` }} />
                  </div>
                  {t(optionLabels.fuelLevel[level])}
                  {pickupFuel === level && <span className="text-muted-foreground text-[10px]">{t(copy.atPickup)}</span>}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Label>{t(copy.damages)}</Label>
                <p className="text-muted-foreground mt-1 text-xs">{t(copy.damagesHint)}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDamages((rows) => [...rows, { key: nextKey.current++, area: 'front', description: '', isNew: type === 'return' }])}
              >
                <Plus />
                {t(copy.addDamage)}
              </Button>
            </div>
            {damages.map((row) => (
              <div key={row.key} className="bg-muted/30 grid grid-cols-[8rem_1fr_auto] items-center gap-2 rounded-lg border p-2">
                <Select value={row.area} onValueChange={(area) => setDamages((rows) => rows.map((item) => (item.key === row.key ? { ...item, area: area as DamageArea } : item)))}>
                  <SelectTrigger className="bg-background h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAMAGE_AREAS.map((area) => (
                      <SelectItem key={area} value={area}>
                        {t(optionLabels.damageArea[area])}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder={t(copy.description)}
                  value={row.description}
                  className="bg-background h-9"
                  onChange={(event) => setDamages((rows) => rows.map((item) => (item.key === row.key ? { ...item, description: event.target.value } : item)))}
                />
                <div className="flex items-center gap-1">
                  {type === 'return' && (
                    <label className="flex items-center gap-1.5 px-1 text-xs">
                      <Checkbox
                        checked={row.isNew}
                        onCheckedChange={(checked) => setDamages((rows) => rows.map((item) => (item.key === row.key ? { ...item, isNew: checked === true } : item)))}
                      />
                      {t(copy.isNew)}
                    </label>
                  )}
                  <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => setDamages((rows) => rows.filter((item) => item.key !== row.key))}>
                    <Trash2 />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Label>{t(copy.photos)}</Label>
                <p className="text-muted-foreground mt-1 text-xs">{t(copy.photosHint)}</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
                <Camera />
                {t(copy.addPhotos)}
              </Button>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                hidden
                onChange={(event) => {
                  void addPhotos(event.target.files)
                  event.target.value = ''
                }}
              />
            </div>
            {photos.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {photos.map((photo) => (
                  <div key={photo.key} className="group relative aspect-square overflow-hidden rounded-md border">
                    {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
                    <img src={photo.preview} alt="" className="size-full object-cover" />
                    <button
                      type="button"
                      className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => {
                        URL.revokeObjectURL(photo.preview)
                        setPhotos((items) => items.filter((item) => item.key !== photo.key))
                      }}
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="handover-notes">{t(copy.notes)}</Label>
            <Textarea id="handover-notes" rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>
        </div>

        <SheetFooter className="border-t">
          <Button onClick={submit} disabled={pending || !mileage} size="lg">
            {pending && <Loader2 className="animate-spin" />}
            {t(type === 'pickup' ? copy.savePickup : copy.saveReturn)}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
