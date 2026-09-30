'use client'

import { ArrowLeft, Ban, CalendarPlus, Car, CheckCircle2, KeyRound, MoreHorizontal, Pencil, Undo2, UserX } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { text } from '@/i18n/admin'

import { formatMoney } from '../../format'
import { useAdminLang, useT } from '../../lang-context'
import { PageHeader } from '../../shell/page-header'
import { DeskStatusBadge, PaymentSummaryBadge } from '../desk-status'
import type { ReservationDetail } from '../detail-data'
import { CustomerCard, HandoversCard, InfoCard, NotesCard, PaymentsCard, PenaltiesCard, PriceCard, RentalCard, TimelineCard } from './cards'
import { EditReservationSheet } from './edit-sheet'
import { HandoverSheet } from './handover-sheet'
import { PaymentDialog } from './payment-dialog'
import { StatusDialog } from './status-dialog'
import { VehiclePickerDialog } from './vehicle-picker-dialog'

const copy = {
  back: text('Reservations', 'Rezervasyonlar'),
  confirm: text('Confirm', 'Onayla'),
  assign: text('Assign vehicle', 'Araç ata'),
  handOver: text('Hand over car', 'Teslim et'),
  receive: text('Receive car', 'İade al'),
  changeVehicle: text('Change vehicle', 'Aracı değiştir'),
  backToPending: text('Undo confirmation', 'Onayı geri al'),
  noShow: text('Customer did not come', 'Müşteri gelmedi'),
  cancel: text('Cancel reservation', 'Rezervasyonu iptal et'),
  edit: text('Edit', 'Düzenle'),
  extend: text('Extend', 'Uzat'),
}

type Dialog =
  | { kind: 'vehicle'; mode: 'confirm' | 'assign' }
  | { kind: 'status'; status: 'cancelled' | 'no_show' | 'pending' }
  | { kind: 'payment' }
  | { kind: 'handover'; type: 'pickup' | 'return' }
  | { kind: 'edit' }
  | null

export function ReservationDetailView({ detail }: { detail: ReservationDetail }) {
  const t = useT()
  const lang = useAdminLang()
  const [dialog, setDialog] = useState<Dialog>(null)
  const close = (open: boolean) => !open && setDialog(null)
  const { status } = detail
  const open = status === 'pending' || status === 'confirmed' || status === 'active'
  const canAssign = status === 'pending' || status === 'confirmed'
  const pickupMileage = detail.handovers.find((handover) => handover.type === 'pickup')?.mileageKm ?? null

  const primary =
    status === 'pending' ? (
      <Button onClick={() => setDialog({ kind: 'vehicle', mode: 'confirm' })}>
        <CheckCircle2 />
        {t(copy.confirm)}
      </Button>
    ) : status === 'confirmed' && !detail.vehicle ? (
      <Button onClick={() => setDialog({ kind: 'vehicle', mode: 'assign' })}>
        <Car />
        {t(copy.assign)}
      </Button>
    ) : status === 'confirmed' ? (
      <Button onClick={() => setDialog({ kind: 'handover', type: 'pickup' })}>
        <KeyRound />
        {t(copy.handOver)}
      </Button>
    ) : status === 'active' ? (
      <Button onClick={() => setDialog({ kind: 'handover', type: 'return' })}>
        <Undo2 />
        {t(copy.receive)}
      </Button>
    ) : null

  const menuItems = [
    status === 'confirmed' && detail.vehicle && { key: 'vehicle', icon: Car, label: copy.changeVehicle, onSelect: () => setDialog({ kind: 'vehicle', mode: 'assign' }) },
    status === 'confirmed' && { key: 'pending', icon: Undo2, label: copy.backToPending, onSelect: () => setDialog({ kind: 'status', status: 'pending' }) },
    status === 'confirmed' && { key: 'no_show', icon: UserX, label: copy.noShow, onSelect: () => setDialog({ kind: 'status', status: 'no_show' }) },
  ].filter(Boolean) as { key: string; icon: typeof Car; label: ReturnType<typeof text>; onSelect: () => void }[]
  const canCancel = detail.transitions.includes('cancelled')

  return (
    <>
      <PageHeader
        title={detail.code}
        actions={
          <>
            {open && (
              <Button variant="outline" onClick={() => setDialog({ kind: 'edit' })}>
                {status === 'active' ? <CalendarPlus /> : <Pencil />}
                {t(status === 'active' ? copy.extend : copy.edit)}
              </Button>
            )}
            {primary}
            {(menuItems.length > 0 || canCancel) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {menuItems.map((item) => (
                    <DropdownMenuItem key={item.key} onSelect={item.onSelect}>
                      <item.icon />
                      {t(item.label)}
                    </DropdownMenuItem>
                  ))}
                  {canCancel && (
                    <>
                      {menuItems.length > 0 && <DropdownMenuSeparator />}
                      <DropdownMenuItem variant="destructive" onSelect={() => setDialog({ kind: 'status', status: 'cancelled' })}>
                        <Ban />
                        {t(copy.cancel)}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </>
        }
      />

      <div className="flex flex-col gap-6 p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" className="-ml-2" asChild>
            <Link href="/admin/reservations">
              <ArrowLeft />
              {t(copy.back)}
            </Link>
          </Button>
          <DeskStatusBadge status={detail.desk} now={detail.now} />
          <PaymentSummaryBadge summary={detail.paymentSummary} currency={detail.pricing.currency} />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="flex flex-col gap-6 xl:col-span-2">
            <RentalCard detail={detail} onAssign={canAssign ? () => setDialog({ kind: 'vehicle', mode: status === 'pending' ? 'confirm' : 'assign' }) : undefined} />
            <div className="grid gap-6 lg:grid-cols-2">
              <CustomerCard detail={detail} />
              <PriceCard detail={detail} editable={open} />
            </div>
            <PaymentsCard detail={detail} onAdd={status !== 'cancelled' && status !== 'no_show' ? () => setDialog({ kind: 'payment' }) : undefined} />
            <HandoversCard detail={detail} />
            <PenaltiesCard detail={detail} />
          </div>
          <div className="flex flex-col gap-6">
            <TimelineCard detail={detail} />
            <NotesCard detail={detail} />
            <InfoCard detail={detail} />
          </div>
        </div>
      </div>

      <VehiclePickerDialog
        reservationId={detail.id}
        mode={dialog?.kind === 'vehicle' ? dialog.mode : 'assign'}
        currentVehicleId={detail.vehicle?.id ?? null}
        open={dialog?.kind === 'vehicle'}
        onOpenChange={close}
      />
      {dialog?.kind === 'edit' && <EditReservationSheet detail={detail} onOpenChange={close} />}
      {dialog?.kind === 'status' && <StatusDialog reservationId={detail.id} status={dialog.status} open onOpenChange={close} />}
      {dialog?.kind === 'payment' && (
        <PaymentDialog
          reservationId={detail.id}
          balance={detail.balance}
          currency={detail.pricing.currency}
          preferred={detail.preferredPaymentMethod}
          open
          onOpenChange={close}
        />
      )}
      {dialog?.kind === 'handover' && (
        <HandoverSheet
          reservationId={detail.id}
          type={dialog.type}
          defaultMileage={dialog.type === 'pickup' ? (detail.vehicle?.mileageKm ?? 0) : (pickupMileage ?? 0)}
          pickupMileage={dialog.type === 'return' ? pickupMileage : null}
          pickupFuel={dialog.type === 'return' ? (detail.handovers.find((handover) => handover.type === 'pickup')?.fuelLevel ?? null) : null}
          balanceDue={dialog.type === 'return' && detail.balance > 0 ? formatMoney(detail.balance, detail.pricing.currency, lang) : null}
          open
          onOpenChange={close}
        />
      )}
    </>
  )
}
