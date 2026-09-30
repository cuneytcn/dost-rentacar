import { cookies } from 'next/headers'

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { isAdminUser } from '@/access'
import { requireStaff } from '@/features/admin/auth/session'
import { AppSidebar } from '@/features/admin/shell/app-sidebar'
import { getPayloadClient } from '@/lib/payload'

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff()
  const payload = await getPayloadClient()
  const scoped = { overrideAccess: false, user } as const
  const [settings, pending, corporate, cookieStore] = await Promise.all([
    payload.findGlobal({ slug: 'settings', depth: 0 }),
    payload.count({ collection: 'reservations', where: { status: { equals: 'pending' } }, ...scoped }),
    payload.count({ collection: 'corporate-requests', where: { status: { equals: 'new' } }, ...scoped }),
    cookies(),
  ])

  return (
    <SidebarProvider defaultOpen={cookieStore.get('sidebar_state')?.value !== 'false'}>
      <AppSidebar
        companyName={settings.companyName}
        isAdmin={isAdminUser(user)}
        badges={{ pendingReservations: pending.totalDocs, newCorporateRequests: corporate.totalDocs }}
        user={{ name: user.name, email: user.email, role: user.role }}
      />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
