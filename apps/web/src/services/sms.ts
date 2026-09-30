import type { Payload } from 'payload'

/**
 * Provider-agnostic SMS sending. Only the console driver exists until a provider
 * (e.g. Netgsm, İleti Merkezi) is chosen; add its driver here and select it with SMS_PROVIDER.
 */
export type SmsMessage = { to: string; text: string }

export interface SmsSender {
  readonly name: string
  send(message: SmsMessage): Promise<void>
}

class ConsoleSmsSender implements SmsSender {
  readonly name = 'console'
  constructor(private readonly payload: Payload) {}

  async send({ to, text }: SmsMessage): Promise<void> {
    this.payload.logger.info({ to, text }, '[sms:console] message not sent (no SMS provider configured)')
  }
}

export function getSmsSender(payload: Payload): SmsSender {
  const provider = process.env.SMS_PROVIDER || 'console'
  switch (provider) {
    case 'console':
      return new ConsoleSmsSender(payload)
    default:
      throw new Error(`Unknown SMS_PROVIDER "${provider}"`)
  }
}

/** Normalizes to digits with country code, e.g. "+90 (555) 111-22-33" -> "905551112233". */
export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, '').replace(/^00/, '')
}
