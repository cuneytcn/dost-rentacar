import { requireStaff } from '@/features/admin/auth/session'
import { CustomersTable } from '@/features/admin/customers/customers-table'
import { getCustomerList } from '@/features/admin/customers/data'
import { adminTitle, getTranslator } from '@/features/admin/i18n'
import { PageHeader } from '@/features/admin/shell/page-header'
import { text } from '@/i18n/admin'

export const generateMetadata = () => adminTitle(text('Customers', 'Müşteriler'))

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; filter?: string; page?: string }> }) {
  const user = await requireStaff()
  const [{ t }, data] = await Promise.all([getTranslator(), getCustomerList(user, await searchParams)])
  return (
    <>
      <PageHeader title={t(text('Customers', 'Müşteriler'))} />
      <CustomersTable data={data} />
    </>
  )
}
