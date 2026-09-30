import { reservationLookupRequestSchema } from '@rent/shared'

import { getLocale, ok, parseBody, route } from '@/lib/api'
import { getPayloadClient } from '@/lib/payload'
import { lookupReservation } from '@/services/reservations'

/** POST so the email never ends up in URLs or access logs. */
export const POST = route(async (request) => {
  const input = await parseBody(request, reservationLookupRequestSchema)
  const payload = await getPayloadClient()
  return ok(await lookupReservation(payload, input, { locale: getLocale(request) }))
})
