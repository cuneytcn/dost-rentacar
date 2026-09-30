import type { MetadataRoute } from 'next'

import { DEFAULT_LOCALE } from '@rent/shared'

import { getSiteSettings } from '@/features/site/data'

// Rebuilt hourly so new cars and pages appear without a deploy.
export const revalidate = 3600

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSiteSettings(DEFAULT_LOCALE)
  return {
    name: settings.companyName,
    short_name: settings.companyName,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1a4582',
    lang: DEFAULT_LOCALE,
    icons: [
      { src: '/icon', sizes: '64x64', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  }
}
