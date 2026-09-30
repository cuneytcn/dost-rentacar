'use client'

import { FileText, Loader2, Paperclip, X } from 'lucide-react'
import { useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { PAYMENT_METHODS, type PaymentMethod } from '@rent/shared'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { optionLabels, text } from '@/i18n/admin'
import { cn } from '@/lib/utils'

import { formatMoney } from '../../format'
import { useAdminLang, useT } from '../../lang-context'
import { DateTimePicker } from '../../shared/date-picker'
import { fromDateTimeLocal, toDateTimeLocal } from '@/lib/local-datetime'
import { MoneyInput } from '../../shared/money-input'
import { resizeImage } from '@/lib/resize-image'

import { uploadFileAction } from '../../resources/actions'
import { addPaymentAction } from '../actions'

const copy = {
  title: text('Record payment', 'Ödeme gir'),
  description: text('Balance due', 'Kalan tutar'),
  amount: text('Amount', 'Tutar'),
  method: text('Method', 'Yöntem'),
  date: text('Date', 'Tarih'),
  reference: text('Reference / receipt no.', 'Referans / dekont no'),
  fullBalance: text('Full balance', 'Kalanın tamamı'),
  save: text('Save payment', 'Ödemeyi kaydet'),
  saved: text('Payment recorded', 'Ödeme kaydedildi'),
  invalidAmount: text('Enter an amount greater than zero.', 'Sıfırdan büyük bir tutar girin.'),
  proof: text('Receipt (optional)', 'Dekont (isteğe bağlı)'),
  attach: text('Attach receipt', 'Dekont ekle'),
}

export function PaymentDialog({
  reservationId,
  balance,
  currency,
  preferred,
  open,
  onOpenChange,
}: {
  reservationId: number
  balance: number
  currency: string
  preferred: 'office' | 'bank_transfer'
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useT()
  const lang = useAdminLang()
  const [amount, setAmount] = useState<number | null>(balance || null)
  const [amountKey, setAmountKey] = useState(0)
  const [method, setMethod] = useState<PaymentMethod>(preferred === 'bank_transfer' ? 'bank_transfer' : 'office_card')
  const [paidAt, setPaidAt] = useState(() => toDateTimeLocal(new Date()))
  const [reference, setReference] = useState('')
  const [proof, setProof] = useState<File | null>(null)
  const proofInput = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()

  const submit = () => {
    if (!amount || amount <= 0) {
      toast.error(t(copy.invalidAmount))
      return
    }
    startTransition(async () => {
      let proofId: number | undefined
      if (proof) {
        const formData = new FormData()
        formData.set('collection', 'documents')
        formData.set('file', proof.type.startsWith('image/') ? await resizeImage(proof) : proof)
        formData.set('label', reference ? `${reference} · ${proof.name}` : proof.name)
        const upload = await uploadFileAction(formData)
        if (!upload.ok) return void toast.error(upload.message)
        proofId = upload.data.id
      }
      const result = await addPaymentAction({ id: reservationId, amount, method, paidAt: fromDateTimeLocal(paidAt), reference, proofId })
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      toast.success(t(copy.saved))
      onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t(copy.title)}</DialogTitle>
          <DialogDescription>
            {t(copy.description)}: <span className="text-foreground font-medium">{formatMoney(balance, currency, lang)}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="payment-amount">{t(copy.amount)}</Label>
              {balance > 0 && (
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground text-xs underline-offset-2 hover:underline"
                  onClick={() => {
                    setAmount(balance)
                    setAmountKey((key) => key + 1)
                  }}
                >
                  {t(copy.fullBalance)}
                </button>
              )}
            </div>
            <MoneyInput key={amountKey} id="payment-amount" value={amount} onChange={setAmount} currency={currency} autoFocus />
          </div>
          <div className="grid gap-2">
            <Label>{t(copy.method)}</Label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setMethod(option)}
                  className={cn(
                    'rounded-md border px-2 py-2 text-sm transition-colors',
                    method === option ? 'border-primary bg-primary/5 ring-primary font-medium ring-1' : 'hover:bg-muted/50',
                  )}
                >
                  {t(optionLabels.paymentMethod[option])}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="payment-date">{t(copy.date)}</Label>
              <DateTimePicker id="payment-date" value={paidAt} onChange={setPaidAt} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="payment-reference">{t(copy.reference)}</Label>
              <Input id="payment-reference" value={reference} onChange={(event) => setReference(event.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>{t(copy.proof)}</Label>
            {proof ? (
              <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                <FileText className="text-muted-foreground size-4 shrink-0" />
                <span className="truncate">{proof.name}</span>
                <button type="button" className="text-muted-foreground hover:text-foreground ml-auto" onClick={() => setProof(null)}>
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <Button type="button" variant="outline" className="justify-start font-normal" onClick={() => proofInput.current?.click()}>
                <Paperclip />
                {t(copy.attach)}
              </Button>
            )}
            <input
              ref={proofInput}
              type="file"
              accept="image/*,application/pdf"
              hidden
              onChange={(event) => {
                setProof(event.target.files?.[0] ?? null)
                event.target.value = ''
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            {t(copy.save)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
