'use client'

import { Check, Copy, IdCard, Landmark, MailCheck } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import type { PublicSettings, ReservationSummary } from '@rent/shared'

import { Button } from '@/components/ui/button'

import { useSite } from '../site-context'

type Props = { reservation: ReservationSummary; email: string; bankAccounts: PublicSettings['bankAccounts']; exchangeRates: PublicSettings['exchangeRates'] }

export function BookingConfirmation({ reservation, email, bankAccounts, exchangeRates }: Props) {
  const { m, href, fmt, money } = useSite()
  const [copied, setCopied] = useState<string | null>(null)
  const transfer = reservation.preferredPaymentMethod === 'bank_transfer'

  const copy = async (value: string) => {
    await navigator.clipboard?.writeText(value).catch(() => undefined)
    setCopied(value)
    setTimeout(() => setCopied(null), 1500)
  }

  const steps = [
    ...(reservation.status === 'pending' ? [{ icon: MailCheck, text: m.booking.nextPending }] : []),
    transfer ? { icon: Landmark, text: m.booking.nextTransfer } : { icon: IdCard, text: m.booking.nextOffice },
    ...(transfer ? [{ icon: IdCard, text: m.booking.nextDocuments }] : []),
  ]
  /** Total in the account's currency; converted amounts are rounded to whole units like the rest of the site. */
  const amountIn = (currency: string) => {
    if (currency === reservation.currency) return money(reservation.total, reservation.currency)
    const rate = exchangeRates.find((entry) => entry.currency === currency)?.rate
    return rate ? `≈ ${money(Math.round((reservation.total * rate) / 100) * 100, currency as typeof reservation.currency)}` : null
  }

  return (
    <div className="bg-surface">
      <div className="container-site py-12 sm:py-20">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="rounded-3xl border bg-white p-6 text-center sm:p-10">
            <span className="bg-success/10 text-success mx-auto flex size-16 items-center justify-center rounded-full">
              <Check className="size-8" strokeWidth={3} />
            </span>
            <h1 className="text-brand-950 mt-5 text-3xl font-extrabold">{m.booking.successTitle}</h1>
            <p className="text-muted-foreground mx-auto mt-3 max-w-md leading-relaxed">{fmt(m.booking.successText, { email })}</p>
            <div className="bg-brand-50 mx-auto mt-6 inline-flex items-center gap-3 rounded-2xl px-5 py-3">
              <div className="text-left">
                <p className="text-brand-600 text-xs font-bold uppercase">{m.booking.code}</p>
                <p className="text-brand-950 font-mono text-2xl font-extrabold tracking-wider">{reservation.code}</p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => copy(reservation.code)} aria-label={m.booking.code}>
                {copied === reservation.code ? <Check className="text-success" /> : <Copy />}
              </Button>
            </div>
            <p className="text-brand-950 mt-6 text-sm">
              {reservation.vehicleModel.name} · {m.booking.total}: <span className="font-bold tabular-nums">{money(reservation.total, reservation.currency)}</span>
            </p>
          </div>

          <div className="rounded-3xl border bg-white p-6 sm:p-8">
            <h2 className="text-brand-950 text-lg font-extrabold">{m.booking.nextSteps}</h2>
            <ul className="mt-4 space-y-4">
              {steps.map(({ icon: Icon, text }) => (
                <li key={text} className="flex gap-3">
                  <span className="bg-brand-50 text-brand-600 flex size-9 shrink-0 items-center justify-center rounded-xl">
                    <Icon className="size-5" />
                  </span>
                  <p className="text-brand-900 pt-1.5 text-sm leading-relaxed">{text}</p>
                </li>
              ))}
            </ul>
            {transfer && bankAccounts.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="text-brand-950 text-sm font-bold">{m.booking.bankDetails}</h3>
                {bankAccounts.map((account) => (
                  <div key={account.iban} className="bg-surface rounded-2xl p-4 text-sm">
                    <p className="text-brand-950 font-bold">
                      {account.bankName} · {account.currency}
                    </p>
                    <p className="text-muted-foreground mt-1">
                      {m.booking.accountHolder}: {account.accountHolder}
                    </p>
                    {amountIn(account.currency) && (
                      <p className="text-brand-950 mt-1">
                        {m.booking.transferAmount}: <span className="font-bold tabular-nums">{amountIn(account.currency)}</span>
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <code className="text-brand-950 font-mono text-sm font-semibold break-all">{account.iban}</code>
                      <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => copy(account.iban)} aria-label="IBAN">
                        {copied === account.iban ? <Check className="text-success" /> : <Copy />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild className="h-11 rounded-full px-6 font-bold">
              <Link href={href(`/reservation?code=${reservation.code}`)}>{m.booking.manage}</Link>
            </Button>
            <Button asChild variant="outline" className="h-11 rounded-full bg-white px-6 font-bold">
              <Link href={href('/')}>{m.booking.backHome}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
