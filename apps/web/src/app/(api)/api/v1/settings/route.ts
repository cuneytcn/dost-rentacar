import { getLocale, ok, route } from '@/lib/api'
import { getPayloadClient } from '@/lib/payload'
import { getPublicSettings } from '@/services/public-catalog'

export const GET = route(async (request) => {
  const payload = await getPayloadClient()
  return ok(await getPublicSettings(payload, getLocale(request)), { cacheSeconds: 300 })
})
