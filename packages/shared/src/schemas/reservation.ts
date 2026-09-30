import { z } from 'zod'

import {
  FUEL_TYPES,
  ID_DOCUMENT_TYPES,
  PAYMENT_STATUSES,
  PREFERRED_PAYMENT_METHODS,
  RESERVATION_STATUSES,
  TRANSMISSIONS,
} from '../constants'
import {
  countryCodeSchema,
  currencySchema,
  dateSchema,
  dateTimeSchema,
  idSchema,
  localeSchema,
  moneySchema,
} from './common'

const rentalWindowShape = {
  pickupLocationId: idSchema,
  returnLocationId: idSchema,
  pickupAt: dateTimeSchema,
  returnAt: dateTimeSchema,
}

function refineWindow<T extends { pickupAt: string; returnAt: string }>(value: T, ctx: z.RefinementCtx) {
  if (new Date(value.returnAt).getTime() <= new Date(value.pickupAt).getTime()) {
    ctx.addIssue({ code: 'custom', path: ['returnAt'], message: 'returnAt must be after pickupAt' })
  }
}

export const availabilityQuerySchema = z
  .object({
    ...rentalWindowShape,
    currency: currencySchema.optional(),
    locale: localeSchema.optional(),
  })
  .superRefine(refineWindow)
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>

export const selectedExtraSchema = z.object({
  extraId: idSchema,
  quantity: z.number().int().min(1).max(10),
})

export const quoteRequestSchema = z
  .object({
    ...rentalWindowShape,
    vehicleModelId: idSchema,
    extras: z.array(selectedExtraSchema).max(20).default([]),
    currency: currencySchema.optional(),
  })
  .superRefine(refineWindow)
export type QuoteRequest = z.infer<typeof quoteRequestSchema>

export const customerInputSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.email().max(160).transform((value) => value.toLowerCase()),
  phone: z.string().trim().min(6).max(30),
  country: countryCodeSchema,
  birthDate: dateSchema,
  idDocumentType: z.enum(ID_DOCUMENT_TYPES).optional(),
  idDocumentNumber: z.string().trim().max(40).optional(),
  licenseNumber: z.string().trim().max(40).optional(),
  licenseCountry: countryCodeSchema.optional(),
  licenseIssuedAt: dateSchema.optional(),
})
export type CustomerInput = z.infer<typeof customerInputSchema>

export const createReservationRequestSchema = z
  .object({
    ...rentalWindowShape,
    vehicleModelId: idSchema,
    extras: z.array(selectedExtraSchema).max(20).default([]),
    currency: currencySchema.optional(),
    customer: customerInputSchema,
    flightNumber: z.string().trim().max(20).optional(),
    customerNote: z.string().trim().max(1000).optional(),
    preferredPaymentMethod: z.enum(PREFERRED_PAYMENT_METHODS),
    locale: localeSchema,
    acceptTerms: z.literal(true),
    acceptPrivacy: z.literal(true),
    marketingConsent: z.boolean().default(false),
    captchaToken: z.string().optional(),
  })
  .superRefine(refineWindow)
export type CreateReservationRequest = z.infer<typeof createReservationRequestSchema>

export const reservationLookupRequestSchema = z.object({
  code: z
    .string()
    .trim()
    .min(4)
    .max(20)
    .transform((value) => value.toUpperCase()),
  email: z.email().transform((value) => value.toLowerCase()),
})
export type ReservationLookupRequest = z.infer<typeof reservationLookupRequestSchema>

export const reservationCancelRequestSchema = reservationLookupRequestSchema.extend({
  reason: z.string().trim().max(500).optional(),
})
export type ReservationCancelRequest = z.infer<typeof reservationCancelRequestSchema>

// Responses

export const quoteLineSchema = z.object({
  date: dateSchema,
  amount: z.number().int(),
  seasonId: z.number().int().nullable(),
})

export const quoteExtraLineSchema = z.object({
  extraId: z.number().int(),
  name: z.string(),
  quantity: z.number().int(),
  unitPrice: z.number().int(),
  chargedDays: z.number().int().nullable(),
  total: z.number().int(),
})

export const quoteSchema = z.object({
  vehicleModelId: z.number().int(),
  rentalDays: z.number().int(),
  currency: currencySchema,
  dailyBreakdown: z.array(quoteLineSchema),
  baseTotal: z.number().int(),
  extras: z.array(quoteExtraLineSchema),
  extrasTotal: z.number().int(),
  transferFee: z.number().int(),
  total: z.number().int(),
  deposit: z.number().int(),
  display: z
    .object({
      currency: currencySchema,
      rate: z.number(),
      total: z.number().int(),
    })
    .nullable(),
})
export type Quote = z.infer<typeof quoteSchema>

export const vehicleModelSummarySchema = z.object({
  id: z.number().int(),
  slug: z.string(),
  name: z.string(),
  brand: z.string(),
  category: z.object({ id: z.number().int(), slug: z.string(), name: z.string() }).nullable(),
  transmission: z.enum(TRANSMISSIONS),
  fuelType: z.enum(FUEL_TYPES),
  seats: z.number().int(),
  doors: z.number().int(),
  largeBags: z.number().int(),
  smallBags: z.number().int(),
  features: z.array(z.string()),
  imageUrls: z.array(z.string()),
  /** Photo credit per image (same order as imageUrls), required for openly licensed photos. */
  imageCredits: z.array(z.object({ text: z.string(), url: z.string().nullable() }).nullable()),
  minDriverAge: z.number().int(),
  minLicenseYears: z.number().int(),
  dailyKmLimit: z.number().int().nullable(),
  fromDailyRate: moneySchema,
})
export type VehicleModelSummary = z.infer<typeof vehicleModelSummarySchema>

export const availabilityItemSchema = z.object({
  vehicleModel: vehicleModelSummarySchema,
  available: z.boolean(),
  quote: quoteSchema.nullable(),
  unavailableReason: z.string().nullable(),
})
export type AvailabilityItem = z.infer<typeof availabilityItemSchema>

export const reservationSummarySchema = z.object({
  code: z.string(),
  status: z.enum(RESERVATION_STATUSES),
  paymentStatus: z.enum(PAYMENT_STATUSES),
  preferredPaymentMethod: z.enum(PREFERRED_PAYMENT_METHODS),
  pickupAt: dateTimeSchema,
  returnAt: dateTimeSchema,
  pickupLocation: z.object({ id: z.number().int(), name: z.string() }),
  returnLocation: z.object({ id: z.number().int(), name: z.string() }),
  vehicleModel: z.object({ id: z.number().int(), name: z.string() }),
  customerName: z.string(),
  rentalDays: z.number().int(),
  currency: currencySchema,
  total: z.number().int(),
  paidTotal: z.number().int(),
  canCancel: z.boolean(),
})
export type ReservationSummary = z.infer<typeof reservationSummarySchema>
