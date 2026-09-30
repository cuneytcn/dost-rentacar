import { quoteRequestSchema } from '@rent/shared'

import { getLocale, ok, parseBody, route } from '@/lib/api'
import { getPayloadClient } from '@/lib/payload'
import { getActiveVehicleModel } from '@/services/catalog'
import { loadQuoteEnvironment, quoteForModel } from '@/services/quote'

/** Price for one model with extras. Rule violations are returned, not thrown, so the UI can explain them. */
export const POST = route(async (request) => {
  const input = await parseBody(request, quoteRequestSchema)
  const locale = getLocale(request)
  const payload = await getPayloadClient()
  const env = await loadQuoteEnvironment(payload, input, { locale })
  const model = await getActiveVehicleModel(payload, input.vehicleModelId, { locale })
  const { quote, violations } = quoteForModel(env, model)
  return ok({ quote, violations })
})
