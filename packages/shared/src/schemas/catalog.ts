import { z } from 'zod'

import { EXTRA_PRICING_TYPES, WEEKDAYS } from '../constants'
import { currencySchema, idSchema, moneySchema } from './common'
import { vehicleModelSummarySchema } from './reservation'

export const locationSchema = z.object({
  id: z.number().int(),
  slug: z.string(),
  name: z.string(),
  address: z.string(),
  city: z.string(),
  country: z.string().nullable(),
  phone: z.string(),
  whatsapp: z.string().nullable(),
  email: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  timeZone: z.string(),
  allowsPickup: z.boolean(),
  allowsReturn: z.boolean(),
  openingHours: z.array(z.object({ day: z.enum(WEEKDAYS), opensAt: z.string(), closesAt: z.string() })),
})
export type LocationDto = z.infer<typeof locationSchema>

export const vehicleCategorySchema = z.object({
  id: z.number().int(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
})
export type VehicleCategoryDto = z.infer<typeof vehicleCategorySchema>

export const vehicleModelListQuerySchema = z.object({
  category: z.string().optional(),
  featured: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
})

export const vehicleModelDetailSchema = vehicleModelSummarySchema.extend({
  description: z.string().nullable(),
  deposit: moneySchema,
  extraKmFee: moneySchema.nullable(),
  rateTiers: z.array(z.object({ minDays: z.number().int(), dailyRate: moneySchema })),
})
export type VehicleModelDetail = z.infer<typeof vehicleModelDetailSchema>

export const extraSchema = z.object({
  id: z.number().int(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  pricingType: z.enum(EXTRA_PRICING_TYPES),
  price: moneySchema,
  maxQuantity: z.number().int(),
  maxChargeDays: z.number().int().nullable(),
})
export type ExtraDto = z.infer<typeof extraSchema>

export const publicSettingsSchema = z.object({
  companyName: z.string(),
  legalName: z.string().nullable(),
  authorizationNumber: z.string().nullable(),
  taxOffice: z.string().nullable(),
  taxNumber: z.string().nullable(),
  mersisNumber: z.string().nullable(),
  phone: z.string().nullable(),
  whatsapp: z.string().nullable(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  baseCurrency: currencySchema,
  displayCurrencies: z.array(currencySchema),
  exchangeRates: z.array(z.object({ currency: currencySchema, rate: z.number() })),
  bankAccounts: z.array(z.object({ bankName: z.string(), accountHolder: z.string(), iban: z.string(), currency: currencySchema })),
  reservationRules: z.object({
    minLeadTimeHours: z.number().int(),
    minRentalDays: z.number().int(),
    maxRentalDays: z.number().int(),
    maxAdvanceDays: z.number().int(),
    selfCancelCutoffHours: z.number().int(),
    graceMinutes: z.number().int(),
  }),
  cancellationPolicy: z.string().nullable(),
  socialLinks: z.record(z.string(), z.string()),
})
export type PublicSettings = z.infer<typeof publicSettingsSchema>

export const slugParamSchema = z.object({ slug: z.string().min(1).max(120) })
export const idParamSchema = z.object({ id: idSchema })
