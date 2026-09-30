import type { AdminLang } from './lang'

/**
 * Localized URL segments for the staff panel. Route folders (and every link in code) use the
 * English segment; `proxy.ts` rewrites localized URLs to them and redirects so the address bar
 * always matches the panel language. Both spellings keep working, so shared links never break.
 */
const SEGMENTS: Record<string, Record<Exclude<AdminLang, 'en'>, string>> = {
  login: { tr: 'giris' },
  calendar: { tr: 'takvim' },
  reservations: { tr: 'rezervasyonlar' },
  customers: { tr: 'musteriler' },
  handovers: { tr: 'teslim-iade' },
  penalties: { tr: 'cezalar' },
  'corporate-requests': { tr: 'kurumsal-talepler' },
  'vehicle-models': { tr: 'arac-modelleri' },
  vehicles: { tr: 'araclar' },
  'vehicle-blocks': { tr: 'arac-kapatmalari' },
  'vehicle-categories': { tr: 'arac-siniflari' },
  locations: { tr: 'subeler' },
  seasons: { tr: 'sezonlar' },
  extras: { tr: 'ek-hizmetler' },
  'transfer-fees': { tr: 'farkli-sube-ucretleri' },
  pages: { tr: 'sayfalar' },
  faqs: { tr: 'sss' },
  media: { tr: 'gorseller' },
  documents: { tr: 'belgeler' },
  users: { tr: 'kullanicilar' },
  settings: { tr: 'ayarlar' },
  'exchange-rates': { tr: 'doviz-kurlari' },
  new: { tr: 'yeni' },
}

const TO_INTERNAL = new Map(Object.entries(SEGMENTS).flatMap(([internal, localized]) => Object.values(localized).map((value) => [value, internal] as const)))

const BASE = '/admin'

function split(path: string): string[] | null {
  if (path !== BASE && !path.startsWith(`${BASE}/`)) return null
  return path.slice(BASE.length).split('/').filter(Boolean)
}

/** `/admin/rezervasyonlar/yeni` → `/admin/reservations/new`. Non-panel paths are returned unchanged. */
export function toInternalAdminPath(path: string): string {
  const segments = split(path)
  if (!segments) return path
  return [BASE, ...segments.map((segment) => TO_INTERNAL.get(segment) ?? segment)].join('/')
}

/** `/admin/reservations/new` → `/admin/rezervasyonlar/yeni` for Turkish. Accepts either spelling. */
export function toLocalizedAdminPath(path: string, lang: AdminLang): string {
  const [pathname = '', query] = path.split('?')
  const segments = split(toInternalAdminPath(pathname))
  if (!segments) return path
  const localized = [BASE, ...segments.map((segment) => (lang === 'en' ? segment : (SEGMENTS[segment]?.[lang] ?? segment)))].join('/')
  return query ? `${localized}?${query}` : localized
}
