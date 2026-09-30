import {
  ArrowLeftRight,
  Building2,
  CalendarCheck,
  CalendarRange,
  Car,
  CarFront,
  CircleHelp,
  Coins,
  FileText,
  FolderLock,
  Images,
  LayoutDashboard,
  MapPin,
  PackagePlus,
  ReceiptText,
  Route,
  Settings,
  SunMedium,
  Tags,
  UserCog,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

import { text, type AdminText } from '@/i18n/admin'

export type NavItem = {
  href: string
  label: AdminText
  icon: LucideIcon
  /** Only administrators see it. */
  adminOnly?: boolean
  /** Screen not migrated to the new panel yet. */
  soon?: boolean
  badgeKey?: 'pendingReservations' | 'newCorporateRequests'
}

export type NavGroup = { label: AdminText; items: NavItem[] }

export const NAV: NavGroup[] = [
  {
    label: text('Overview', 'Genel'),
    items: [
      { href: '/admin', label: text('Dashboard', 'Anasayfa'), icon: LayoutDashboard },
      { href: '/admin/calendar', label: text('Occupancy calendar', 'Doluluk takvimi'), icon: CalendarRange },
    ],
  },
  {
    label: text('Operations', 'Operasyon'),
    items: [
      { href: '/admin/reservations', label: text('Reservations', 'Rezervasyonlar'), icon: CalendarCheck, badgeKey: 'pendingReservations' },
      { href: '/admin/customers', label: text('Customers', 'Müşteriler'), icon: Users },
      { href: '/admin/handovers', label: text('Handovers', 'Teslim / iade'), icon: ArrowLeftRight },
      { href: '/admin/penalties', label: text('Penalties & charges', 'Cezalar ve ek ücretler'), icon: ReceiptText },
      { href: '/admin/corporate-requests', label: text('Corporate requests', 'Kurumsal talepler'), icon: Building2, badgeKey: 'newCorporateRequests' },
    ],
  },
  {
    label: text('Fleet', 'Filo'),
    items: [
      { href: '/admin/vehicle-models', label: text('Vehicle models', 'Araç modelleri'), icon: CarFront },
      { href: '/admin/vehicles', label: text('Vehicles', 'Araçlar'), icon: Car },
      { href: '/admin/vehicle-blocks', label: text('Vehicle blocks', 'Araç kapatmaları'), icon: Wrench },
      { href: '/admin/vehicle-categories', label: text('Categories', 'Araç sınıfları'), icon: Tags },
      { href: '/admin/locations', label: text('Locations', 'Şubeler'), icon: MapPin },
    ],
  },
  {
    label: text('Pricing', 'Fiyatlandırma'),
    items: [
      { href: '/admin/seasons', label: text('Seasons', 'Sezonlar'), icon: SunMedium },
      { href: '/admin/extras', label: text('Extras', 'Ek hizmetler'), icon: PackagePlus },
      { href: '/admin/transfer-fees', label: text('One-way fees', 'Farklı şube ücretleri'), icon: Route },
    ],
  },
  {
    label: text('Content', 'İçerik'),
    items: [
      { href: '/admin/pages', label: text('Pages', 'Sayfalar'), icon: FileText },
      { href: '/admin/faqs', label: text('FAQs', 'SSS'), icon: CircleHelp },
      { href: '/admin/media', label: text('Images', 'Görseller'), icon: Images },
    ],
  },
  {
    label: text('System', 'Sistem'),
    items: [
      { href: '/admin/users', label: text('Users', 'Kullanıcılar'), icon: UserCog, adminOnly: true },
      { href: '/admin/settings', label: text('Settings', 'Ayarlar'), icon: Settings, adminOnly: true },
      { href: '/admin/exchange-rates', label: text('Exchange rates', 'Döviz kurları'), icon: Coins },
      { href: '/admin/documents', label: text('Documents', 'Belgeler'), icon: FolderLock },
    ],
  },
]

export function isActive(pathname: string, href: string): boolean {
  return href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`)
}
