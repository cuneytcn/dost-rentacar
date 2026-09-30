import type { JobsConfig, TaskConfig } from 'payload'

import { refreshExchangeRates } from '@/services/exchange-rates'
import {
  sendCorporateRequestNotification,
  sendPickupReminders,
  sendReservationNotification,
  sendVehicleDocumentReminders,
} from '@/services/notifications'

/**
 * Background tasks run by Payload's job queue inside the long-running Next.js server.
 * Scheduled tasks are queued by the `schedule` crons (6-field, seconds first) and picked up by `autoRun`.
 * Set JOBS_AUTORUN=false on instances that must not process jobs (e.g. extra replicas).
 */

export const QUEUE = 'default'

const refreshExchangeRatesTask: TaskConfig<{ input: Record<string, never>; output: { status: string } }> = {
  slug: 'refreshExchangeRates',
  label: 'Refresh exchange rates',
  retries: 0, // next scheduled run retries anyway
  schedule: [{ cron: '0 */5 * * * *', queue: QUEUE }],
  outputSchema: [{ name: 'status', type: 'text', required: true }],
  handler: async ({ req }) => {
    const result = await refreshExchangeRates(req.payload)
    if (result.status === 'skipped') req.payload.logger.warn(`Exchange rate refresh skipped: ${result.reason}`)
    return { output: { status: result.status } }
  },
}

const sendReservationNotificationTask: TaskConfig<{
  input: { reservationId: number; audience: 'customer' | 'staff'; event: 'created' | 'confirmed' | 'cancelled' | 'reminder' }
  output: Record<string, never>
}> = {
  slug: 'sendReservationNotification',
  label: 'Send reservation notification',
  retries: 3,
  inputSchema: [
    { name: 'reservationId', type: 'number', required: true },
    { name: 'audience', type: 'select', options: ['customer', 'staff'], required: true },
    { name: 'event', type: 'select', options: ['created', 'confirmed', 'cancelled', 'reminder'], required: true },
  ],
  handler: async ({ input, req }) => {
    await sendReservationNotification(req.payload, input)
    return { output: {} }
  },
}

const sendCorporateRequestNotificationTask: TaskConfig<{
  input: { corporateRequestId: number }
  output: Record<string, never>
}> = {
  slug: 'sendCorporateRequestNotification',
  label: 'Send corporate request notification',
  retries: 3,
  inputSchema: [{ name: 'corporateRequestId', type: 'number', required: true }],
  handler: async ({ input, req }) => {
    await sendCorporateRequestNotification(req.payload, input.corporateRequestId)
    return { output: {} }
  },
}

const sendPickupRemindersTask: TaskConfig<{ input: Record<string, never>; output: { sent: number; failed: number } }> = {
  slug: 'sendPickupReminders',
  label: 'Send pickup reminders',
  retries: 0,
  schedule: [{ cron: '0 0 * * * *', queue: QUEUE }],
  outputSchema: [
    { name: 'sent', type: 'number', required: true },
    { name: 'failed', type: 'number', required: true },
  ],
  handler: async ({ req }) => ({ output: await sendPickupReminders(req.payload) }),
}

const sendVehicleDocumentRemindersTask: TaskConfig<{ input: Record<string, never>; output: { items: number } }> = {
  slug: 'sendVehicleDocumentReminders',
  label: 'Send vehicle document reminders',
  retries: 2,
  // Cron runs in the server's time zone; 05:00 UTC = 08:00 Istanbul on a UTC host.
  schedule: [{ cron: '0 0 5 * * *', queue: QUEUE }],
  outputSchema: [{ name: 'items', type: 'number', required: true }],
  handler: async ({ req }) => ({ output: await sendVehicleDocumentReminders(req.payload) }),
}

export const jobs: JobsConfig = {
  tasks: [
    refreshExchangeRatesTask,
    sendReservationNotificationTask,
    sendCorporateRequestNotificationTask,
    sendPickupRemindersTask,
    sendVehicleDocumentRemindersTask,
  ],
  autoRun: [{ cron: '*/30 * * * * *', queue: QUEUE, limit: 20 }],
  shouldAutoRun: () => process.env.JOBS_AUTORUN !== 'false',
  deleteJobOnComplete: true,
  access: {
    queue: () => false,
    run: () => false,
    cancel: () => false,
  },
}
