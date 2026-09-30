import { getLocale, ok, route } from '@/lib/api'
import { getPayloadClient } from '@/lib/payload'
import { listExtras } from '@/services/public-catalog'

export const GET = route(async (request) => {
  const payload = await getPayloadClient()
  return ok(await listExtras(payload, getLocale(request)), { cacheSeconds: 300 })
})
