'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { text } from '@/i18n/admin'

import { useAdminHref, useT } from '../lang-context'
import { toInternalAdminPath } from '../routes'
import { isActive, NAV } from './nav'
import { NavUser, type NavUserProps } from './nav-user'

const soonLabel = text('soon', 'yakında')

export type SidebarBadges = { pendingReservations: number; newCorporateRequests: number }

export function AppSidebar({
  companyName,
  isAdmin,
  badges,
  user,
}: {
  companyName: string
  isAdmin: boolean
  badges: SidebarBadges
  user: NavUserProps
}) {
  const pathname = toInternalAdminPath(usePathname())
  const t = useT()
  const href = useAdminHref()
  // On phones the sidebar is a sheet; close it once a destination is chosen.
  const { isMobile, setOpenMobile } = useSidebar()
  const closeOnMobile = () => isMobile && setOpenMobile(false)

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={href('/admin')} onClick={closeOnMobile}>
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg text-sm font-bold">
                  {companyName.slice(0, 1)}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{companyName}</span>
                  <span className="text-muted-foreground truncate text-xs">{t(text('Staff panel', 'Yönetim paneli'))}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {NAV.map((group) => {
          const items = group.items.filter((item) => !item.adminOnly || isAdmin)
          if (items.length === 0) return null
          return (
            <SidebarGroup key={group.label.en}>
              <SidebarGroupLabel>{t(group.label)}</SidebarGroupLabel>
              <SidebarMenu>
                {items.map((item) => {
                  const badge = item.badgeKey ? badges[item.badgeKey] : 0
                  return (
                    <SidebarMenuItem key={item.href}>
                      {item.soon ? (
                        <SidebarMenuButton disabled tooltip={t(item.label)} className="opacity-50">
                          <item.icon />
                          <span>{t(item.label)}</span>
                          <Badge variant="outline" className="ml-auto h-5 px-1.5 text-[10px] font-normal">
                            {t(soonLabel)}
                          </Badge>
                        </SidebarMenuButton>
                      ) : (
                        <SidebarMenuButton asChild isActive={isActive(pathname, item.href)} tooltip={t(item.label)}>
                          <Link href={href(item.href)} onClick={closeOnMobile}>
                            <item.icon />
                            <span>{t(item.label)}</span>
                          </Link>
                        </SidebarMenuButton>
                      )}
                      {badge > 0 && !item.soon && <SidebarMenuBadge>{badge}</SidebarMenuBadge>}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroup>
          )
        })}
      </SidebarContent>
      <SidebarFooter>
        <NavUser {...user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
