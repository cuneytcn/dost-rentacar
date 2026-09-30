/**
 * Pure availability logic for a vehicle model at a pickup location.
 *
 * Capacity = vehicles free for the whole requested window, minus the peak number of
 * overlapping reservations that don't have a vehicle assigned yet. This is slightly
 * conservative (never overbooks); assigning vehicles to reservations makes it exact.
 * The database exclusion constraint on assigned vehicles is the final guard.
 */

export type TimeRange = { start: Date; end: Date }

export type AvailabilityInput = {
  /** Active vehicles of the model at the location. */
  vehicleIds: number[]
  /** Vehicles with a block overlapping the (buffered) window. */
  blockedVehicleIds: number[]
  /** Vehicles assigned to a capacity-holding reservation overlapping the (buffered) window. */
  busyVehicleIds: number[]
  /** Capacity-holding reservations for the model/location without an assigned vehicle. */
  unassignedReservations: TimeRange[]
  window: TimeRange
}

export function expandRange(range: TimeRange, bufferMinutes: number): TimeRange {
  const bufferMs = bufferMinutes * 60_000
  return { start: new Date(range.start.getTime() - bufferMs), end: new Date(range.end.getTime() + bufferMs) }
}

export function rangesOverlap(a: TimeRange, b: TimeRange): boolean {
  return a.start < b.end && b.start < a.end
}

/** Highest number of ranges active at the same instant, considering only the part inside `window`. */
export function peakConcurrency(ranges: TimeRange[], window: TimeRange): number {
  const events: { time: number; delta: 1 | -1 }[] = []
  for (const range of ranges) {
    if (!rangesOverlap(range, window)) continue
    events.push({ time: Math.max(range.start.getTime(), window.start.getTime()), delta: 1 })
    events.push({ time: Math.min(range.end.getTime(), window.end.getTime()), delta: -1 })
  }
  // End events sort before start events at the same instant: back-to-back ranges don't overlap.
  events.sort((a, b) => a.time - b.time || a.delta - b.delta)
  let current = 0
  let peak = 0
  for (const event of events) {
    current += event.delta
    peak = Math.max(peak, current)
  }
  return peak
}

export function countAvailableUnits(input: AvailabilityInput): number {
  const unavailable = new Set([...input.blockedVehicleIds, ...input.busyVehicleIds])
  const free = input.vehicleIds.filter((id) => !unavailable.has(id)).length
  return Math.max(0, free - peakConcurrency(input.unassignedReservations, input.window))
}
