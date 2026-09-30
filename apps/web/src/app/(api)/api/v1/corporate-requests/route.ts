import { corporateRequestInputSchema } from '@rent/shared'

import { getClientIp, ok, parseBody, route } from '@/lib/api'
import { getPayloadClient } from '@/lib/payload'
import { verifyCaptcha } from '@/services/captcha'
import { createCorporateRequest } from '@/services/corporate-requests'

export const POST = route(async (request) => {
  const input = await parseBody(request, corporateRequestInputSchema)
  await verifyCaptcha(input.captchaToken, getClientIp(request))
  const payload = await getPayloadClient()
  return ok(await createCorporateRequest(payload, input), { status: 201 })
})
