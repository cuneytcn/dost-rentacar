export const LOCALES = ['tr', 'en', 'de', 'ru'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'tr'

export const CURRENCIES = ['EUR', 'TRY', 'USD', 'GBP'] as const
export type Currency = (typeof CURRENCIES)[number]

export const DEFAULT_TIME_ZONE = 'Europe/Istanbul'

export const USER_ROLES = ['admin', 'staff'] as const
export type UserRole = (typeof USER_ROLES)[number]

export const TRANSMISSIONS = ['manual', 'automatic'] as const
export type Transmission = (typeof TRANSMISSIONS)[number]

export const FUEL_TYPES = ['petrol', 'diesel', 'hybrid', 'electric', 'lpg'] as const
export type FuelType = (typeof FUEL_TYPES)[number]

export const VEHICLE_FEATURES = [
  'air_conditioning',
  'bluetooth',
  'navigation',
  'cruise_control',
  'parking_sensors',
  'rear_camera',
  'apple_carplay',
  'android_auto',
  'sunroof',
  'heated_seats',
  'usb',
  'isofix',
] as const
export type VehicleFeature = (typeof VEHICLE_FEATURES)[number]

export const VEHICLE_STATUSES = ['active', 'maintenance', 'inactive', 'sold'] as const
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number]

export const VEHICLE_BLOCK_REASONS = ['maintenance', 'repair', 'inspection', 'other'] as const
export type VehicleBlockReason = (typeof VEHICLE_BLOCK_REASONS)[number]

export const EXTRA_PRICING_TYPES = ['per_day', 'per_rental'] as const
export type ExtraPricingType = (typeof EXTRA_PRICING_TYPES)[number]

export const RESERVATION_STATUSES = [
  'pending',
  'confirmed',
  'active',
  'completed',
  'cancelled',
  'no_show',
] as const
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number]

/** Statuses that hold a vehicle / consume fleet capacity. */
export const CAPACITY_HOLDING_STATUSES = ['pending', 'confirmed', 'active'] as const satisfies readonly ReservationStatus[]

export const RESERVATION_STATUS_TRANSITIONS: Record<ReservationStatus, readonly ReservationStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['active', 'cancelled', 'no_show', 'pending'],
  active: ['completed'],
  completed: [],
  cancelled: [],
  no_show: [],
}

export const PAYMENT_STATUSES = ['unpaid', 'partial', 'paid', 'refunded'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const PAYMENT_METHODS = ['office_cash', 'office_card', 'bank_transfer'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

/** What the customer picks on the website; the actual method is recorded per payment. */
export const PREFERRED_PAYMENT_METHODS = ['office', 'bank_transfer'] as const
export type PreferredPaymentMethod = (typeof PREFERRED_PAYMENT_METHODS)[number]

export const RESERVATION_SOURCES = ['web', 'mobile', 'phone', 'walk_in', 'corporate'] as const
export type ReservationSource = (typeof RESERVATION_SOURCES)[number]

export const ID_DOCUMENT_TYPES = ['national_id', 'passport'] as const
export type IdDocumentType = (typeof ID_DOCUMENT_TYPES)[number]

export const HANDOVER_TYPES = ['pickup', 'return'] as const
export type HandoverType = (typeof HANDOVER_TYPES)[number]

export const FUEL_LEVELS = ['empty', 'quarter', 'half', 'three_quarters', 'full'] as const
export type FuelLevel = (typeof FUEL_LEVELS)[number]

export const DAMAGE_AREAS = [
  'front',
  'rear',
  'left',
  'right',
  'roof',
  'interior',
  'windshield',
  'wheels',
  'other',
] as const
export type DamageArea = (typeof DAMAGE_AREAS)[number]

export const PENALTY_TYPES = ['toll', 'traffic_fine', 'damage', 'fuel', 'extra_km', 'late_return', 'other'] as const
export type PenaltyType = (typeof PENALTY_TYPES)[number]

export const PENALTY_STATUSES = ['open', 'charged', 'paid', 'waived'] as const
export type PenaltyStatus = (typeof PENALTY_STATUSES)[number]

export const CORPORATE_REQUEST_STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost'] as const
export type CorporateRequestStatus = (typeof CORPORATE_REQUEST_STATUSES)[number]

export const FAQ_CATEGORIES = ['booking', 'payment', 'requirements', 'insurance', 'other'] as const
export type FaqCategory = (typeof FAQ_CATEGORIES)[number]

export const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
export type Weekday = (typeof WEEKDAYS)[number]
