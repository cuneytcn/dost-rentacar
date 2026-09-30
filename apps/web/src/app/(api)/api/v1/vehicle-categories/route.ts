import { getLocale, ok, route } from '@/lib/api'
import { getPayloadClient } from '@/lib/payload'
import { listVehicleCategories } from '@/services/public-catalog'

export const GET = route(async (request) => {
  const payload = await getPayloadClient()
  return ok(await listVehicleCategories(payload, getLocale(request)), { cacheSeconds: 300 })
})
