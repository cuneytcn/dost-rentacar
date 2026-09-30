import { requireStaff } from '@/features/admin/auth/session'
import { adminTitle, getTranslator } from '@/features/admin/i18n'
import { NewReservationForm } from '@/features/admin/reservations/new/new-reservation-form'
import { getNewReservationData } from '@/features/admin/reservations/new/page-data'
import { PageHeader } from '@/features/admin/shell/page-header'
import { text } from '@/i18n/admin'

export const generateMetadata = () => adminTitle(text('New reservation', 'Yeni rezervasyon'))

export default async function NewReservationPage() {
  const user = await requireStaff()
  const [{ t }, data] = await Promise.all([getTranslator(), getNewReservationData(user)])
  return (
    <>
      <PageHeader
        title={t(text('New reservation', 'Yeni rezervasyon'))}
        description={t(text('Phone and walk-in bookings', 'Telefon ve ofis rezervasyonları'))}
      />
      <NewReservationForm {...data} />
    </>
  )
}
