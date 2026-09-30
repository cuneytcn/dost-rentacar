'use client'

import { Loader2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { text } from '@/i18n/admin'

import { useT } from '../../lang-context'
import { changeStatusAction } from '../actions'

const copy = {
  cancelled: {
    title: text('Cancel reservation?', 'Rezervasyon iptal edilsin mi?'),
    description: text('The customer gets a cancellation email. This cannot be undone.', 'Müşteriye iptal e-postası gider. Bu işlem geri alınamaz.'),
    confirm: text('Cancel reservation', 'Rezervasyonu iptal et'),
    done: text('Reservation cancelled', 'Rezervasyon iptal edildi'),
  },
  no_show: {
    title: text('Mark as no-show?', 'Gelmedi olarak işaretlensin mi?'),
    description: text('Use this when the customer did not come to pick up the car. The vehicle becomes free again.', 'Müşteri aracı teslim almaya gelmediyse kullanın. Araç tekrar boşa çıkar.'),
    confirm: text('Mark no-show', 'Gelmedi olarak işaretle'),
    done: text('Marked as no-show', 'Gelmedi olarak işaretlendi'),
  },
  pending: {
    title: text('Move back to pending?', 'Onay geri alınsın mı?'),
    description: text('The reservation goes back to "awaiting confirmation".', 'Rezervasyon tekrar "onay bekliyor" durumuna döner.'),
    confirm: text('Move back', 'Geri al'),
    done: text('Moved back to pending', 'Onay geri alındı'),
  },
  reason: text('Reason (internal)', 'Sebep (iç not)'),
  back: text('Back', 'Vazgeç'),
}

export function StatusDialog({
  reservationId,
  status,
  open,
  onOpenChange,
}: {
  reservationId: number
  status: 'cancelled' | 'no_show' | 'pending'
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useT()
  const [reason, setReason] = useState('')
  const [pending, startTransition] = useTransition()
  const content = copy[status]

  const submit = () =>
    startTransition(async () => {
      const result = await changeStatusAction({ id: reservationId, status, reason })
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      toast.success(t(content.done))
      onOpenChange(false)
    })

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t(content.title)}</AlertDialogTitle>
          <AlertDialogDescription>{t(content.description)}</AlertDialogDescription>
        </AlertDialogHeader>
        {status === 'cancelled' && (
          <div className="grid gap-2">
            <Label htmlFor="cancel-reason">{t(copy.reason)}</Label>
            <Textarea id="cancel-reason" value={reason} onChange={(event) => setReason(event.target.value)} rows={3} />
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{t(copy.back)}</AlertDialogCancel>
          <Button variant={status === 'pending' ? 'default' : 'destructive'} disabled={pending} onClick={submit}>
            {pending && <Loader2 className="animate-spin" />}
            {t(content.confirm)}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
