'use client'

import { Check, ChevronsUpDown, Languages, LogOut, Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar'
import { optionLabels, text } from '@/i18n/admin'

import { logoutAction, setAdminLangAction } from '../auth/actions'
import { useAdminLang, useT } from '../lang-context'
import { toLocalizedAdminPath } from '../routes'

export type NavUserProps = { name: string; email: string; role: 'admin' | 'staff' }

const copy = {
  theme: text('Theme', 'Tema'),
  light: text('Light', 'Açık'),
  dark: text('Dark', 'Koyu'),
  system: text('System', 'Sistem'),
  language: text('Language', 'Dil'),
  logout: text('Log out', 'Çıkış yap'),
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
}

export function NavUser({ name, email, role }: NavUserProps) {
  const { isMobile } = useSidebar()
  const { theme, setTheme } = useTheme()
  const lang = useAdminLang()
  const t = useT()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  // Switching language also moves the address bar to that language's URL.
  const changeLang = (next: 'tr' | 'en') =>
    startTransition(async () => {
      await setAdminLangAction(next)
      const query = searchParams.toString()
      router.replace(toLocalizedAdminPath(query ? `${pathname}?${query}` : pathname, next))
      router.refresh()
    })

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg">{initials(name)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{name}</span>
                <span className="text-muted-foreground truncate text-xs">{t(optionLabels.userRole[role])}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-56 rounded-lg" side={isMobile ? 'bottom' : 'right'} align="end" sideOffset={4}>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="size-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">{initials(name)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{name}</span>
                  <span className="text-muted-foreground truncate text-xs">{email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Sun />
                  {t(copy.theme)}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {(
                    [
                      ['light', Sun, copy.light],
                      ['dark', Moon, copy.dark],
                      ['system', Monitor, copy.system],
                    ] as const
                  ).map(([value, Icon, label]) => (
                    <DropdownMenuItem key={value} onClick={() => setTheme(value)}>
                      <Icon />
                      {t(label)}
                      {theme === value && <Check className="ml-auto" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Languages />
                  {t(copy.language)}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {(
                    [
                      ['tr', 'Türkçe'],
                      ['en', 'English'],
                    ] as const
                  ).map(([value, label]) => (
                    <DropdownMenuItem key={value} onClick={() => changeLang(value)}>
                      {label}
                      {lang === value && <Check className="ml-auto" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => startTransition(() => logoutAction())}>
              <LogOut />
              {t(copy.logout)}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
