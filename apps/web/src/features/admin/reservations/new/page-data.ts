import 'server-only'

import { DEFAULT_TIME_ZONE } from '@rent/shared'

import { getPayloadClient } from '@/lib/payload'
import { addDays } from '@/lib/time-grid'
import { toLocalDate } from '@/services/pricing'
import { getBaseCurrency, getSettings } from '@/services/settings'

import type { SessionUser } from '../../auth/session'
import type { NewReservationProps } from './new-reservation-form'

export async function getNewReservationData(user: SessionUser): Promise<NewReservationProps> {
  const payload = await getPayloadClient()
  const scoped = { overrideAccess: false, user } as const
  const [locations, extras, settings] = await Promise.all([
    payload.find({ collection: 'locations', where: { isActive: { equals: true } }, sort: 'sortOrder', depth: 0, pagination: false, ...scoped }),
    payload.find({ collection: 'extras', where: { isActive: { equals: true } }, sort: 'sortOrder', depth: 0, pagination: false, ...scoped }),
    getSettings(payload),
  ])
  const tomorrow = addDays(toLocalDate(new Date(), DEFAULT_TIME_ZONE), 1)
  return {
    locations: locations.docs.map((location) => ({ id: location.id, name: location.name })),
    extras: extras.docs.map((extra) => ({
      id: extra.id,
      name: extra.name,
      pricingType: extra.pricingType,
      price: extra.price,
      maxQuantity: extra.maxQuantity,
    })),
    currency: getBaseCurrency(settings),
    defaults: { pickupAt: `${tomorrow}T10:00`, returnAt: `${addDays(tomorrow, 3)}T10:00` },
  }
}
