import { availabilityQuerySchema } from '@rent/shared'

import { getLocale, ok, parseQuery, route } from '@/lib/api'
import { getPayloadClient } from '@/lib/payload'
import { searchAvailability } from '@/services/public-catalog'

export const GET = route(async (request) => {
  const query = parseQuery(request, availabilityQuerySchema)
  const payload = await getPayloadClient()
  return ok(await searchAvailability(payload, query, query.locale ?? getLocale(request)))
})
