import type { MetadataRoute } from 'next'

import { LOCALES } from '@rent/shared'

import { getPages, getVehicleModels } from '@/features/site/data'
import { sitePath } from '@/features/site/routes'
import { SERVICE_AREAS } from '@/features/site/service-areas'
import { siteUrl } from '@/lib/urls'

// Rebuilt hourly so new cars and pages appear without a deploy.
export const revalidate = 3600

/** Every public page in every language, with hreflang alternates. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [models, pages] = await Promise.all([getVehicleModels('tr'), getPages('tr')])
  const paths = [
    '/',
    '/cars',
    '/car-rental',
    ...SERVICE_AREAS.map((area) => `/car-rental/${area.slug}`),
    '/corporate',
    '/contact',
    '/faq',
    '/reservation',
    ...models.map((model) => `/cars/${model.slug}`),
    ...pages.map((page) => `/${page.slug}`),
  ]
  return paths.flatMap((path) =>
    LOCALES.map((locale) => ({
      url: siteUrl(sitePath(locale, path)),
      changeFrequency: path.startsWith('/cars') || path === '/' ? ('weekly' as const) : ('monthly' as const),
      priority: path === '/' ? 1 : path.startsWith('/car') ? 0.8 : 0.5,
      alternates: { languages: Object.fromEntries(LOCALES.map((option) => [option, siteUrl(sitePath(option, path))])) },
    })),
  )
}
