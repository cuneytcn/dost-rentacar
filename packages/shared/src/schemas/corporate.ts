import { z } from 'zod'

import { countryCodeSchema, dateSchema, idSchema, localeSchema } from './common'

export const corporateRequestInputSchema = z.object({
  companyName: z.string().trim().min(1).max(160),
  taxNumber: z.string().trim().max(40).optional(),
  contactName: z.string().trim().min(1).max(120),
  email: z.email().max(160).transform((value) => value.toLowerCase()),
  phone: z.string().trim().min(6).max(30),
  country: countryCodeSchema,
  vehicleCount: z.number().int().min(1).max(500),
  vehicleCategoryIds: z.array(idSchema).max(20).default([]),
  startDate: dateSchema,
  durationMonths: z.number().int().min(1).max(60),
  notes: z.string().trim().max(2000).optional(),
  locale: localeSchema,
  acceptPrivacy: z.literal(true),
  captchaToken: z.string().optional(),
})
export type CorporateRequestInput = z.infer<typeof corporateRequestInputSchema>
