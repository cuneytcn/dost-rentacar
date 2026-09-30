import { slugParamSchema } from '@rent/shared'

import { getLocale, ok, route } from '@/lib/api'
import { getPayloadClient } from '@/lib/payload'
import { getVehicleModelBySlug } from '@/services/public-catalog'

export const GET = route<{ slug: string }>(async (request, { params }) => {
  const { slug } = slugParamSchema.parse(await params)
  const payload = await getPayloadClient()
  return ok(await getVehicleModelBySlug(payload, slug, getLocale(request)), { cacheSeconds: 300 })
})
