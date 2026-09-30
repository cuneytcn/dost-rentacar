import { NextResponse, type NextRequest } from 'next/server'

import { ADMIN_LANG_COOKIE } from '@/features/admin/lang'
import { toInternalAdminPath, toLocalizedAdminPath } from '@/features/admin/routes'
import { sitePath, toInternalSitePath } from '@/features/site/routes'

/**
 * Localized URLs for both the staff panel (/admin/rezervasyonlar ↔ /admin/reservations) and the
 * public site (/araclar, /en/cars, /de/fahrzeuge …; Turkish has no prefix). Localized URLs are
 * rewritten to the English route folders; other spellings are redirected so every page has one URL
 * per language.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  return pathname === '/admin' || pathname.startsWith('/admin/') ? adminProxy(request) : siteProxy(request)
}

function adminProxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const lang = request.cookies.get(ADMIN_LANG_COOKIE)?.value === 'en' ? 'en' : 'tr'
  const internal = toInternalAdminPath(pathname)
  const expected = toLocalizedAdminPath(internal, lang)

  // Only navigations are redirected; server actions POST to the current URL and must not bounce.
  if (request.method === 'GET' && expected !== pathname) {
    return NextResponse.redirect(new URL(`${expected}${search}`, request.url))
  }
  if (internal !== pathname) {
    return NextResponse.rewrite(new URL(`${internal}${search}`, request.url))
  }
  return NextResponse.next()
}

function siteProxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const internal = toInternalSitePath(pathname)
  const [, locale = '', ...rest] = internal.split('/')
  const expected = sitePath(locale as Parameters<typeof sitePath>[0], `/${rest.join('/')}`)

  if (request.method === 'GET' && expected !== pathname) {
    return NextResponse.redirect(new URL(`${expected}${search}`, request.url), 308)
  }
  return internal !== pathname ? NextResponse.rewrite(new URL(`${internal}${search}`, request.url)) : NextResponse.next()
}

export const config = {
  // Everything except API routes, Next internals, generated metadata images (icon, apple-icon,
  // opengraph-image) and files with an extension (media, robots.txt, sitemap.xml, manifest).
  matcher: ['/((?!api/|_next/|icon|apple-icon|.*opengraph-image|.*\\.[a-zA-Z0-9]+$).*)'],
}
