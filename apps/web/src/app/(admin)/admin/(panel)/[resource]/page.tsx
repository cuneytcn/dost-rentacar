import type { Metadata } from 'next'

import { requireStaff } from '@/features/admin/auth/session'
import { getTranslator } from '@/features/admin/i18n'
import { assertResourceAccess, getResourceForm, getResourceList } from '@/features/admin/resources/data'
import { getResource } from '@/features/admin/resources/registry'
import { ResourceFormView } from '@/features/admin/resources/resource-form-view'
import { ResourceListView } from '@/features/admin/resources/resource-list-view'
import { PageHeader } from '@/features/admin/shell/page-header'
import { text } from '@/i18n/admin'

type Props = { params: Promise<{ resource: string }>; searchParams: Promise<Record<string, string | undefined>> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resource = getResource((await params).resource)
  const { t } = await getTranslator()
  return { title: resource ? t(resource.labels.plural) : t(text('Not found', 'Bulunamadı')) }
}

export default async function ResourcePage({ params, searchParams }: Props) {
  const user = await requireStaff()
  const resource = getResource((await params).resource)
  assertResourceAccess(resource, user)
  const { t } = await getTranslator()

  if (resource.type === 'global') {
    return <ResourceFormView path={resource.path} data={await getResourceForm(user, resource, null)} />
  }
  const data = await getResourceList(user, resource, await searchParams)
  return (
    <>
      <PageHeader title={t(resource.labels.plural)} description={resource.description ? t(resource.description) : undefined} />
      <ResourceListView path={resource.path} data={data} />
    </>
  )
}
