import { createReservationRequestSchema } from '@rent/shared'

import { getClientIp, ok, parseBody, route } from '@/lib/api'
import { getPayloadClient } from '@/lib/payload'
import { verifyCaptcha } from '@/services/captcha'
import { createReservation } from '@/services/reservations'

export const POST = route(async (request) => {
  const input = await parseBody(request, createReservationRequestSchema)
  await verifyCaptcha(input.captchaToken, getClientIp(request))
  const payload = await getPayloadClient()
  const reservation = await createReservation(payload, input, { source: 'web' })
  return ok(reservation, { status: 201 })
})
