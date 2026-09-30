import { ServiceError } from './errors'

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/**
 * Verifies a Cloudflare Turnstile token. Skipped when TURNSTILE_SECRET_KEY is not set
 * (local development). A mobile app will need its own attestation instead.
 */
export async function verifyCaptcha(token: string | undefined, ip?: string): Promise<void> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return
  if (!token) throw new ServiceError('captcha_failed', 'Captcha token is missing')

  const body = new URLSearchParams({ secret, response: token })
  if (ip) body.set('remoteip', ip)
  const response = await fetch(VERIFY_URL, { method: 'POST', body })
  const result = (await response.json()) as { success: boolean }
  if (!result.success) throw new ServiceError('captcha_failed', 'Captcha verification failed')
}
