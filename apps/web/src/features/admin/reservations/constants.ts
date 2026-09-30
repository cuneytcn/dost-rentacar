export const RESERVATION_TABS = ['all', 'pending', 'confirmed', 'active', 'completed', 'cancelled'] as const
export type ReservationTab = (typeof RESERVATION_TABS)[number]
