import { requireStaff } from '@/features/admin/auth/session'
import { CalendarView } from '@/features/admin/calendar/calendar-view'
import { getCalendarData } from '@/features/admin/calendar/data'
import { adminTitle, getTranslator } from '@/features/admin/i18n'
import { PageHeader } from '@/features/admin/shell/page-header'
import { text } from '@/i18n/admin'

export const generateMetadata = () => adminTitle(text('Calendar', 'Doluluk takvimi'))

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; days?: string; location?: string }>
}) {
  const user = await requireStaff()
  const [{ t }, data] = await Promise.all([getTranslator(), getCalendarData(user, await searchParams)])
  return (
    <>
      <PageHeader
        title={t(text('Occupancy calendar', 'Doluluk takvimi'))}
        description={t(text('Reservations and maintenance per vehicle', 'Araç bazında rezervasyonlar ve bakım kapatmaları'))}
      />
      <CalendarView data={data} />
    </>
  )
}
