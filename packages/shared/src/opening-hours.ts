import { WEEKDAYS, type Weekday } from './constants'

/**
 * Office opening hours on local wall-clock values (`YYYY-MM-DD`, `HH:mm`). Shared by the booking
 * rules on the server and the search form, so the form only offers moments the server accepts.
 */

export type OpeningHours = { day: Weekday; opensAt: string; closesAt: string }[]

const BY_UTC_DAY: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export function weekdayOf(day: string): Weekday {
  return BY_UTC_DAY[new Date(`${day}T12:00:00Z`).getUTCDay()]!
}

/** Empty opening hours mean the office is always open. Closing time is inclusive. */
export function isOpenAt(openingHours: OpeningHours, day: string | Weekday, time: string): boolean {
  if (openingHours.length === 0) return true
  const weekday = (WEEKDAYS as readonly string[]).includes(day) ? (day as Weekday) : weekdayOf(day)
  return openingHours.some((slot) => slot.day === weekday && slot.opensAt <= time && time <= slot.closesAt)
}

/** Half-hour time slots of a day. */
export const TIME_SLOTS = Array.from({ length: 48 }, (_, index) => `${String(Math.floor(index / 2)).padStart(2, '0')}:${index % 2 ? '30' : '00'}`)

/** Slots on `day` when the office is open, optionally not before `earliest` (`YYYY-MM-DDTHH:mm`). */
export function openTimes(openingHours: OpeningHours, day: string, earliest?: string): string[] {
  return TIME_SLOTS.filter((time) => isOpenAt(openingHours, day, time) && (!earliest || `${day}T${time}` >= earliest))
}

function addDay(day: string, days: number): string {
  const date = new Date(`${day}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function toMinutes(time: string): number {
  const [hours = 0, minutes = 0] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Moves a wall-clock moment to the nearest bookable slot: the same day at the closest open time,
 * otherwise the next open day at the time closest to the wanted one. Returns null if the office has
 * no open slot within `searchDays`.
 */
export function snapToOpen(value: string, openingHours: OpeningHours, options: { earliest?: string; searchDays?: number } = {}): string | null {
  const [wantedDay = '', wantedTime = '10:00'] = value.split('T')
  const earliestDay = options.earliest?.slice(0, 10)
  let day = earliestDay && earliestDay > wantedDay ? earliestDay : wantedDay
  for (let offset = 0; offset <= (options.searchDays ?? 14); offset++, day = addDay(day, 1)) {
    const times = openTimes(openingHours, day, options.earliest)
    if (times.length === 0) continue
    if (times.includes(wantedTime)) return `${day}T${wantedTime}`
    const closest = times.reduce((best, time) => (Math.abs(toMinutes(time) - toMinutes(wantedTime)) < Math.abs(toMinutes(best) - toMinutes(wantedTime)) ? time : best))
    return `${day}T${closest}`
  }
  return null
}
