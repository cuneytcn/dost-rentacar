import { adminTitle } from '@/features/admin/i18n'
import { notFound } from 'next/navigation'

import { requireStaff } from '@/features/admin/auth/session'
import { assertResourceAccess, getResourceForm } from '@/features/admin/resources/data'
import { getResource } from '@/features/admin/resources/registry'
import { ResourceFormView } from '@/features/admin/resources/resource-form-view'
import { text } from '@/i18n/admin'

export const generateMetadata = () => adminTitle(text('New', 'Yeni kayıt'))

export default async function NewResourcePage({
  params,
  searchParams,
}: {
  params: Promise<{ resource: string }>
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const user = await requireStaff()
  const resource = getResource((await params).resource)
  assertResourceAccess(resource, user)
  if (resource.type !== 'collection' || resource.canCreate === false) notFound()
  const prefill = await searchParams
  const reservationId = Number(prefill.reservation)
  return (
    <ResourceFormView
      path={resource.path}
      data={await getResourceForm(user, resource, null, prefill)}
      backHref={Number.isInteger(reservationId) && reservationId > 0 ? `/admin/reservations/${reservationId}` : undefined}
      backLabel={Number.isInteger(reservationId) && reservationId > 0 ? text('Reservation', 'Rezervasyon') : undefined}
    />
  )
}
