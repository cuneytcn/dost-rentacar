import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { requireStaff } from '@/features/admin/auth/session'
import { getReservationDetail } from '@/features/admin/reservations/detail-data'
import { ReservationDetailView } from '@/features/admin/reservations/detail/reservation-detail-view'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return { title: `#${(await params).id}` }
}

export default async function ReservationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireStaff()
  const id = Number((await params).id)
  if (!Number.isInteger(id) || id <= 0) notFound()
  const detail = await getReservationDetail(user, id)
  return <ReservationDetailView detail={detail} />
}
