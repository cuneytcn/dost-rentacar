import { APIError, ValidationError } from 'payload'
import { ZodError } from 'zod'

import { isExclusionViolation } from '@/lib/db'
import { ServiceError } from '@/services/errors'

import { getAdminLang } from '../i18n'
import { localizeError } from './error-messages'

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; message: string; fieldErrors?: Record<string, string> }

/**
 * Runs a server action body and converts expected errors (Payload validation/API errors,
 * business errors, Zod) into a serializable result the client can show.
 */
export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  const result = await runActionRaw(fn)
  if (result.ok) return result
  const lang = await getAdminLang()
  return {
    ok: false,
    message: localizeError(result.message, lang),
    fieldErrors: result.fieldErrors
      ? Object.fromEntries(Object.entries(result.fieldErrors).map(([path, message]) => [path, localizeError(message, lang)]))
      : undefined,
  }
}

async function runActionRaw<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() }
  } catch (error) {
    if (error instanceof ValidationError) {
      const errors = (error.data?.errors ?? []) as { path: string; message: string }[]
      return {
        ok: false,
        message: errors.map((entry) => entry.message).join(' ') || error.message,
        fieldErrors: Object.fromEntries(errors.map((entry) => [entry.path, entry.message])),
      }
    }
    if (error instanceof ZodError) {
      return {
        ok: false,
        message: 'Invalid input',
        fieldErrors: Object.fromEntries(error.issues.map((issue) => [issue.path.join('.'), issue.message])),
      }
    }
    if (error instanceof ServiceError) return { ok: false, message: error.message }
    if (isExclusionViolation(error)) return { ok: false, message: 'The vehicle is already booked for this period' }
    if (error instanceof APIError && error.isPublic) return { ok: false, message: error.message }
    if (error instanceof APIError && error.status < 500) return { ok: false, message: error.message }
    // Next.js redirect/notFound are thrown as errors and must propagate.
    if (error instanceof Error && 'digest' in error && String((error as { digest: unknown }).digest).startsWith('NEXT_')) throw error
    console.error('[admin action] unexpected error', error)
    return { ok: false, message: 'Something went wrong. Please try again.' }
  }
}
