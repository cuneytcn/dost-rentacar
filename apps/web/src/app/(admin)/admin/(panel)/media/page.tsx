import { requireStaff } from '@/features/admin/auth/session'
import { adminTitle, getTranslator } from '@/features/admin/i18n'
import { getLibrary } from '@/features/admin/library/data'
import { LibraryView } from '@/features/admin/library/library-view'
import { PageHeader } from '@/features/admin/shell/page-header'
import { text } from '@/i18n/admin'

export const generateMetadata = () => adminTitle(text('Images', 'Görseller'))

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const user = await requireStaff()
  const [{ t }, data] = await Promise.all([getTranslator(), getLibrary(user, 'media', await searchParams)])
  return (
    <>
      <PageHeader title={t(text('Images', 'Görseller'))} description={t(text('Public images used on the website.', 'Web sitesinde kullanılan herkese açık görseller.'))} />
      <LibraryView collection="media" data={data} />
    </>
  )
}
