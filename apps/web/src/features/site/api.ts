import type { ErrorResponse } from '@rent/shared'

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ErrorResponse['error'] }

/** Calls the public REST API (the same endpoints a mobile app uses). */
export async function postApi<T>(path: string, body: unknown, locale?: string): Promise<ApiResult<T>> {
  try {
    const response = await fetch(`/api/v1${path}${locale ? `?locale=${locale}` : ''}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = (await response.json().catch(() => null)) as { data?: T; error?: ErrorResponse['error'] } | null
    if (response.ok && json && 'data' in json) return { ok: true, data: json.data as T }
    return { ok: false, error: json?.error ?? { code: 'internal_error', message: response.statusText } }
  } catch {
    return { ok: false, error: { code: 'internal_error', message: 'Network error' } }
  }
}

/** Field paths from a `validation_error` response (`customer.email` → `email`). */
export function fieldErrors(error: ErrorResponse['error']): Set<string> {
  const details = Array.isArray(error.details) ? (error.details as { path?: string }[]) : []
  return new Set(details.map((detail) => (detail.path ?? '').split('.').pop() ?? '').filter(Boolean))
}

/** Rule violation codes from a `rule_violation` response. */
export function violationCodes(error: ErrorResponse['error']): string[] {
  const violations = (error.details as { violations?: { code: string }[] } | undefined)?.violations
  return violations?.map((violation) => violation.code) ?? []
}
