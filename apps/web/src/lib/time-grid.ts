/** Pure date/geometry helpers for the occupancy calendar. */

const DAY_MS = 86_400_000

/** Offset (ms) of `timeZone` from UTC at the given instant. */
function timeZoneOffset(instant: number, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(instant)
      .map((part) => [part.type, part.value]),
  )
  const asUtc = Date.UTC(+parts.year!, +parts.month! - 1, +parts.day!, +parts.hour!, +parts.minute!, +parts.second!)
  return asUtc - Math.floor(instant / 1000) * 1000
}

/** UTC instant of local midnight for a YYYY-MM-DD date in `timeZone`. */
export function localMidnight(date: string, timeZone: string): Date {
  const guess = Date.parse(`${date}T00:00:00Z`)
  return new Date(guess - timeZoneOffset(guess, timeZone))
}

export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10)
}

export function isValidDate(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)))
}

export type CalendarWindow = { startDate: string; days: number; timeZone: string }

export function windowRange(window: CalendarWindow): { start: Date; end: Date } {
  return {
    start: localMidnight(window.startDate, window.timeZone),
    end: localMidnight(addDays(window.startDate, window.days), window.timeZone),
  }
}

export type BarPosition = { leftPercent: number; widthPercent: number; startsBefore: boolean; endsAfter: boolean }

/** Horizontal position of a time range inside the window, or null when it's outside. */
export function barPosition(start: Date, end: Date, window: { start: Date; end: Date }): BarPosition | null {
  const windowStart = window.start.getTime()
  const windowEnd = window.end.getTime()
  if (end.getTime() <= windowStart || start.getTime() >= windowEnd) return null
  const span = windowEnd - windowStart
  const clippedStart = Math.max(start.getTime(), windowStart)
  const clippedEnd = Math.min(end.getTime(), windowEnd)
  return {
    leftPercent: ((clippedStart - windowStart) / span) * 100,
    widthPercent: ((clippedEnd - clippedStart) / span) * 100,
    startsBefore: start.getTime() < windowStart,
    endsAfter: end.getTime() > windowEnd,
  }
}
