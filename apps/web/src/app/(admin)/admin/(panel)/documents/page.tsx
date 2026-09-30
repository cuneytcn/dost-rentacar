import { requireStaff } from '@/features/admin/auth/session'
import { adminTitle, getTranslator } from '@/features/admin/i18n'
import { getLibrary } from '@/features/admin/library/data'
import { LibraryView } from '@/features/admin/library/library-view'
import { PageHeader } from '@/features/admin/shell/page-header'
import { text } from '@/i18n/admin'

export const generateMetadata = () => adminTitle(text('Documents', 'Belgeler'))

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const user = await requireStaff()
  const [{ t }, data] = await Promise.all([getTranslator(), getLibrary(user, 'documents', await searchParams)])
  return (
    <>
      <PageHeader
        title={t(text('Documents', 'Belgeler'))}
        description={t(text('Private files: payment receipts, handover photos, fine notices. Only staff can open them.', 'Gizli dosyalar: dekontlar, teslim fotoğrafları, ceza tebligatları. Sadece personel açabilir.'))}
      />
      <LibraryView collection="documents" data={data} />
    </>
  )
}
