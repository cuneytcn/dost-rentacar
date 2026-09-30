import type { ApiErrorCode } from '@rent/shared'

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  validation_error: 400,
  not_found: 404,
  not_available: 409,
  rule_violation: 422,
  captcha_failed: 403,
  conflict: 409,
  internal_error: 500,
}

/** Expected business error; route handlers turn it into a JSON error response. */
export class ServiceError extends Error {
  readonly status: number

  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'ServiceError'
    this.status = STATUS_BY_CODE[code]
  }
}
