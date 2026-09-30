/** Pure logic for vehicle document expiry (traffic insurance, casco, inspection). */

export const VEHICLE_DOCUMENT_FIELDS = ['insuranceExpiresAt', 'cascoExpiresAt', 'inspectionExpiresAt'] as const
export type VehicleDocumentField = (typeof VEHICLE_DOCUMENT_FIELDS)[number]

export type VehicleDocumentInput = {
  id: number
  plate: string
  status: string
} & Partial<Record<VehicleDocumentField, string | null>>

export type ExpiringDocument = {
  vehicleId: number
  plate: string
  document: VehicleDocumentField
  expiresOn: string // YYYY-MM-DD
  daysLeft: number // negative = already expired
}

const DAY_MS = 86_400_000

function toDateOnly(value: string): string {
  return value.slice(0, 10)
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS)
}

/** Documents expiring within `withinDays` of `today` (or already expired), soonest first. Sold vehicles are ignored. */
export function findExpiringDocuments(
  vehicles: VehicleDocumentInput[],
  today: string,
  withinDays: number,
): ExpiringDocument[] {
  return vehicles
    .filter((vehicle) => vehicle.status !== 'sold')
    .flatMap((vehicle) =>
      VEHICLE_DOCUMENT_FIELDS.flatMap((document) => {
        const value = vehicle[document]
        if (!value) return []
        const expiresOn = toDateOnly(value)
        const daysLeft = daysBetween(today, expiresOn)
        return daysLeft <= withinDays ? [{ vehicleId: vehicle.id, plate: vehicle.plate, document, expiresOn, daysLeft }] : []
      }),
    )
    .sort((a, b) => a.daysLeft - b.daysLeft || a.plate.localeCompare(b.plate))
}

export const REMINDER_DAYS = [30, 14, 7, 3, 1, 0] as const

/** Daily reminder selection: milestone days before expiry, and every day once expired. */
export function documentsDueForReminder(items: ExpiringDocument[]): ExpiringDocument[] {
  return items.filter((item) => item.daysLeft < 0 || (REMINDER_DAYS as readonly number[]).includes(item.daysLeft))
}
