import { z } from 'zod'

import { CURRENCIES, LOCALES } from '../constants'

export const idSchema = z.coerce.number().int().positive()
export const localeSchema = z.enum(LOCALES)
export const currencySchema = z.enum(CURRENCIES)
export const dateTimeSchema = z.iso.datetime({ offset: true })
export const dateSchema = z.iso.date()
export const countryCodeSchema = z
  .string()
  .length(2)
  .transform((value) => value.toUpperCase())

export const moneySchema = z.object({
  amount: z.number().int(),
  currency: currencySchema,
})

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
})
export type ErrorResponse = z.infer<typeof errorResponseSchema>

export const API_ERROR_CODES = [
  'validation_error',
  'not_found',
  'not_available',
  'rule_violation',
  'captcha_failed',
  'conflict',
  'internal_error',
] as const
export type ApiErrorCode = (typeof API_ERROR_CODES)[number]
