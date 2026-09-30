import { reservationCancelRequestSchema } from '@rent/shared'

import { getLocale, ok, parseBody, route } from '@/lib/api'
import { getPayloadClient } from '@/lib/payload'
import { cancelReservation } from '@/services/reservations'

export const POST = route(async (request) => {
  const input = await parseBody(request, reservationCancelRequestSchema)
  const payload = await getPayloadClient()
  return ok(await cancelReservation(payload, input, { locale: getLocale(request) }))
})
