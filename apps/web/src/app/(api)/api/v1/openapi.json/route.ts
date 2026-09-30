import { ok, route } from '@/lib/api'
import { buildOpenApiDocument } from '@/lib/openapi'

export const GET = route(async (request) => {
  const document = buildOpenApiDocument(process.env.NEXT_PUBLIC_SERVER_URL || request.nextUrl.origin)
  return Response.json(document, { headers: ok(null, { cacheSeconds: 3600 }).headers })
})
