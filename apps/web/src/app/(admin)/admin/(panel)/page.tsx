import { requireStaff } from '@/features/admin/auth/session'
import { getDashboardData } from '@/features/admin/dashboard/data'
import { DashboardView } from '@/features/admin/dashboard/dashboard-view'
import { adminTitle, getTranslator } from '@/features/admin/i18n'
import { PageHeader } from '@/features/admin/shell/page-header'
import { text } from '@/i18n/admin'

export const generateMetadata = () => adminTitle(text('Dashboard', 'Anasayfa'))

export default async function DashboardPage() {
  const user = await requireStaff()
  const [{ t }, data] = await Promise.all([getTranslator(), getDashboardData(user)])
  return (
    <>
      <PageHeader title={t(text('Dashboard', 'Anasayfa'))} />
      <DashboardView data={data} userName={user.name} />
    </>
  )
}
