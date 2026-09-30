import type { MetadataRoute } from 'next'

import { siteUrl } from '@/lib/urls'

export default function robots(): MetadataRoute.Robots {
  // Booking steps opt out with a noindex meta tag; a path rule would also match look-alike URLs.
  return { rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api'] }, sitemap: siteUrl('/sitemap.xml') }
}
