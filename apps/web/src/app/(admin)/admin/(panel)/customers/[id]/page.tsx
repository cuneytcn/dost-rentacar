import { text } from '@/i18n/admin'
import { adminTitle } from '@/features/admin/i18n'
import { notFound } from 'next/navigation'

import { requireStaff } from '@/features/admin/auth/session'
import { CustomerDetailView } from '@/features/admin/customers/customer-detail-view'
import { getCustomerDetail } from '@/features/admin/customers/data'

export const generateMetadata = () => adminTitle(text('Customer', 'Müşteri'))

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireStaff()
  const id = Number((await params).id)
  if (!Number.isInteger(id) || id <= 0) notFound()
  return <CustomerDetailView detail={await getCustomerDetail(user, id)} />
}
