import type { Payload } from 'payload'

import type { CorporateRequestInput } from '@rent/shared'

export async function createCorporateRequest(payload: Payload, input: CorporateRequestInput, now = new Date()) {
  const doc = await payload.create({
    collection: 'corporate-requests',
    data: {
      status: 'new',
      locale: input.locale,
      companyName: input.companyName,
      taxNumber: input.taxNumber,
      contactName: input.contactName,
      email: input.email,
      phone: input.phone,
      country: input.country,
      vehicleCount: input.vehicleCount,
      vehicleCategories: input.vehicleCategoryIds,
      startDate: input.startDate,
      durationMonths: input.durationMonths,
      notes: input.notes,
      privacyAcceptedAt: now.toISOString(),
    },
    overrideAccess: true,
  })
  return { id: doc.id }
}
