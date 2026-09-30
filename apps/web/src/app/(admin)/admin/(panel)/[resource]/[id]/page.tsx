import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { requireStaff } from '@/features/admin/auth/session'
import { getTranslator } from '@/features/admin/i18n'
import { assertResourceAccess, getResourceForm } from '@/features/admin/resources/data'
import { getResource } from '@/features/admin/resources/registry'
import { ResourceFormView } from '@/features/admin/resources/resource-form-view'
import { text } from '@/i18n/admin'

type Props = { params: Promise<{ resource: string; id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resource = getResource((await params).resource)
  const { t } = await getTranslator()
  return { title: resource ? t(resource.labels.singular) : t(text('Not found', 'Bulunamadı')) }
}

export default async function EditResourcePage({ params }: Props) {
  const user = await requireStaff()
  const { resource: path, id: rawId } = await params
  const resource = getResource(path)
  assertResourceAccess(resource, user)
  const id = Number(rawId)
  if (resource.type !== 'collection' || resource.form.sections.length === 0 || !Number.isInteger(id) || id <= 0) notFound()
  return <ResourceFormView path={resource.path} data={await getResourceForm(user, resource, id)} />
}
