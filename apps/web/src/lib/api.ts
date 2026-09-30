import { NextResponse, type NextRequest } from 'next/server'
import { z, ZodError } from 'zod'

import { DEFAULT_LOCALE, localeSchema, type ErrorResponse, type Locale } from '@rent/shared'

import { ServiceError } from '@/services/errors'

import { isExclusionViolation } from './db'

export function ok<T>(data: T, init?: ResponseInit & { cacheSeconds?: number }): NextResponse<{ data: T }> {
  const headers = new Headers(init?.headers)
  if (init?.cacheSeconds) {
    headers.set('Cache-Control', `public, s-maxage=${init.cacheSeconds}, stale-while-revalidate=${init.cacheSeconds * 5}`)
  } else {
    headers.set('Cache-Control', 'no-store')
  }
  return NextResponse.json({ data }, { ...init, headers })
}

export function fail(status: number, error: ErrorResponse['error']): NextResponse<ErrorResponse> {
  return NextResponse.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } })
}

type Handler<P> = (request: NextRequest, context: { params: Promise<P> }) => Promise<Response>

/** Wraps a route handler with consistent JSON error handling. */
export function route<P = Record<string, never>>(handler: Handler<P>): Handler<P> {
  return async (request, context) => {
    try {
      return await handler(request, context)
    } catch (error) {
      return toErrorResponse(error)
    }
  }
}

export function toErrorResponse(error: unknown): NextResponse<ErrorResponse> {
  if (error instanceof ZodError) {
    return fail(400, {
      code: 'validation_error',
      message: 'Invalid request',
      details: error.issues.map(({ path, message, code }) => ({ path: path.join('.'), message, code })),
    })
  }
  if (error instanceof ServiceError) {
    return fail(error.status, { code: error.code, message: error.message, details: error.details })
  }
  if (isExclusionViolation(error)) {
    return fail(409, { code: 'conflict', message: 'The vehicle is already booked for this period' })
  }
  console.error('[api] unhandled error', error)
  return fail(500, { code: 'internal_error', message: 'Something went wrong' })
}

export function parseQuery<S extends z.ZodType>(request: NextRequest, schema: S): z.output<S> {
  return schema.parse(Object.fromEntries(request.nextUrl.searchParams))
}

export async function parseBody<S extends z.ZodType>(request: NextRequest, schema: S): Promise<z.output<S>> {
  const body = await request.json().catch(() => {
    throw new ServiceError('validation_error', 'Request body must be valid JSON')
  })
  return schema.parse(body)
}

export function getLocale(request: NextRequest): Locale {
  const parsed = localeSchema.safeParse(request.nextUrl.searchParams.get('locale'))
  return parsed.success ? parsed.data : DEFAULT_LOCALE
}

export function getClientIp(request: NextRequest): string | undefined {
  return request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined
}
