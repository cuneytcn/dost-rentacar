import { requireStaff } from '@/features/admin/auth/session'
import { adminTitle, getTranslator } from '@/features/admin/i18n'
import { getReservationList, type ReservationListParams } from '@/features/admin/reservations/list-data'
import { ReservationsTable } from '@/features/admin/reservations/reservations-table'
import { PageHeader } from '@/features/admin/shell/page-header'
import { text } from '@/i18n/admin'

export const generateMetadata = () => adminTitle(text('Reservations', 'Rezervasyonlar'))

export default async function ReservationsPage({ searchParams }: { searchParams: Promise<ReservationListParams> }) {
  const user = await requireStaff()
  const [{ t }, data] = await Promise.all([getTranslator(), getReservationList(user, await searchParams)])
  return (
    <>
      <PageHeader title={t(text('Reservations', 'Rezervasyonlar'))} />
      <ReservationsTable data={data} />
    </>
  )
}
