import { DEFAULT_TIME_ZONE } from '@rent/shared'

import { localMidnight } from '@/lib/time-grid'

/** `YYYY-MM-DDTHH:mm` value (as used by DateTimePicker) in the business time zone. */
export function toDateTimeLocal(value: string | Date, timeZone = DEFAULT_TIME_ZONE): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date(value))
      .map((part) => [part.type, part.value]),
  )
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}

/** ISO instant from a datetime-local value interpreted in the business time zone. */
export function fromDateTimeLocal(value: string, timeZone = DEFAULT_TIME_ZONE): string {
  const [date, time = '00:00'] = value.split('T')
  const [hours, minutes] = time.split(':').map(Number)
  const midnight = localMidnight(date!, timeZone)
  return new Date(midnight.getTime() + ((hours ?? 0) * 60 + (minutes ?? 0)) * 60_000).toISOString()
}
