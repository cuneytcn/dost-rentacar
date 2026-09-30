import { vehicleModelListQuerySchema } from '@rent/shared'

import { getLocale, ok, parseQuery, route } from '@/lib/api'
import { getPayloadClient } from '@/lib/payload'
import { listVehicleModels } from '@/services/public-catalog'

export const GET = route(async (request) => {
  const { category, featured } = parseQuery(request, vehicleModelListQuerySchema)
  const payload = await getPayloadClient()
  return ok(await listVehicleModels(payload, getLocale(request), { category, featured }), { cacheSeconds: 300 })
})
