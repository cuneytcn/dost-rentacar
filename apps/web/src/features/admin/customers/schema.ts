import { z } from 'zod'

import { ID_DOCUMENT_TYPES } from '@rent/shared'

const optionalDate = z
  .string()
  .trim()
  .refine((value) => value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value), 'Use YYYY-MM-DD')

/** Validation only (no transforms) so react-hook-form input and output types match. */
export const customerSchema = z.object({
  id: z.number().int().positive(),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.email(),
  phone: z.string().trim().min(6).max(30),
  country: z.string().trim().max(2),
  birthDate: optionalDate,
  idDocumentType: z.enum(ID_DOCUMENT_TYPES).nullable(),
  idDocumentNumber: z.string().trim().max(40),
  licenseNumber: z.string().trim().max(40),
  licenseCountry: z.string().trim().max(2),
  licenseIssuedAt: optionalDate,
  address: z.string().trim().max(500),
  notes: z.string().trim().max(5000),
  isBlacklisted: z.boolean(),
  blacklistReason: z.string().trim().max(1000),
})

export type CustomerFormValues = z.infer<typeof customerSchema>

/** Empty strings become null; codes are upper-cased; the reason is cleared when not blacklisted. */
export function normalizeCustomer({ id: _id, ...values }: CustomerFormValues) {
  const orNull = (value: string) => value.trim() || null
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim().toLowerCase(),
    phone: values.phone.trim(),
    country: orNull(values.country)?.toUpperCase() ?? null,
    birthDate: orNull(values.birthDate),
    idDocumentType: values.idDocumentType,
    idDocumentNumber: orNull(values.idDocumentNumber),
    licenseNumber: orNull(values.licenseNumber),
    licenseCountry: orNull(values.licenseCountry)?.toUpperCase() ?? null,
    licenseIssuedAt: orNull(values.licenseIssuedAt),
    address: orNull(values.address),
    notes: orNull(values.notes),
    isBlacklisted: values.isBlacklisted,
    blacklistReason: values.isBlacklisted ? orNull(values.blacklistReason) : null,
  }
}
