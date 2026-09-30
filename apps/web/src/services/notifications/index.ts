import type { Payload } from 'payload'

import { DEFAULT_LOCALE, LOCALES, type Locale } from '@rent/shared'

import { populated } from '@/lib/relations'
import { adminDocumentUrl, reservationPageUrl } from '@/lib/urls'
import type { Customer, Location, VehicleModel } from '@/payload-types'

import { DEFAULT_TIME_ZONE } from '@rent/shared'

import { toLocalDate } from '../pricing'
import { getBaseCurrency, getSettings } from '../settings'
import { documentsDueForReminder, findExpiringDocuments, REMINDER_DAYS } from '../vehicle-documents'
import { getSmsSender, normalizePhone } from '../sms'
import {
  renderCustomerEmail,
  renderCustomerSms,
  renderStaffCorporateEmail,
  renderStaffDocumentExpiryEmail,
  renderStaffReservationEmail,
  type CustomerEvent,
  type ReservationView,
} from './templates'

export type ReservationNotification = {
  reservationId: number
  audience: 'customer' | 'staff'
  event: CustomerEvent
}

const HOUR_MS = 3_600_000

function toLocale(value: string | null | undefined): Locale {
  return (LOCALES as readonly string[]).includes(value ?? '') ? (value as Locale) : DEFAULT_LOCALE
}

async function loadReservationView(payload: Payload, reservationId: number): Promise<ReservationView> {
  const locale = toLocale(
    (await payload.findByID({ collection: 'reservations', id: reservationId, depth: 0, select: { locale: true } })).locale,
  )
  const [reservation, settings] = await Promise.all([
    payload.findByID({ collection: 'reservations', id: reservationId, depth: 1, locale }),
    getSettings(payload),
  ])
  const customer = populated<Customer>(reservation.customer)!
  const vehicleModel = populated<VehicleModel>(reservation.vehicleModel)!
  const pickupLocation = populated<Location>(reservation.pickupLocation)!
  const returnLocation = populated<Location>(reservation.returnLocation)!
  const currency = reservation.pricing?.currency ?? getBaseCurrency(settings)

  return {
    code: reservation.code ?? '',
    locale,
    companyName: settings.companyName,
    customer: { name: customer.fullName ?? customer.firstName, email: customer.email, phone: customer.phone },
    vehicleName: vehicleModel.name ?? `${vehicleModel.brand} ${vehicleModel.model}`,
    pickupLocation: { name: pickupLocation.name, address: pickupLocation.address, phone: pickupLocation.phone },
    returnLocationName: returnLocation.name,
    pickupAt: new Date(reservation.pickupAt),
    returnAt: new Date(reservation.returnAt),
    timeZone: pickupLocation.timeZone,
    rentalDays: reservation.pricing?.rentalDays ?? 0,
    extras: (reservation.extras ?? []).map((row) => ({ name: row.name ?? '', quantity: row.quantity })),
    total: { amount: reservation.pricing?.total ?? 0, currency },
    deposit: { amount: reservation.pricing?.deposit ?? 0, currency },
    preferredPaymentMethod: reservation.preferredPaymentMethod,
    bankAccounts: (settings.bankAccounts ?? []).map(({ bankName, accountHolder, iban, currency: accountCurrency }) => ({
      bankName,
      accountHolder,
      iban,
      currency: accountCurrency,
    })),
    customerNote: reservation.customerNote ?? null,
    manageUrl: reservationPageUrl(locale, reservation.code ?? ''),
    adminUrl: adminDocumentUrl('reservations', reservation.id),
  }
}

async function staffRecipients(payload: Payload): Promise<string[]> {
  const settings = await getSettings(payload)
  return (settings.notificationEmails ?? []).map((row) => row.email)
}

export async function sendReservationNotification(payload: Payload, notification: ReservationNotification): Promise<void> {
  const view = await loadReservationView(payload, notification.reservationId)

  if (notification.audience === 'staff') {
    const to = await staffRecipients(payload)
    if (to.length === 0) {
      payload.logger.warn('No staff notification emails configured in Settings; skipping staff email')
      return
    }
    await payload.sendEmail({ to, ...renderStaffReservationEmail(view) })
    return
  }

  await payload.sendEmail({ to: view.customer.email, ...renderCustomerEmail(view, notification.event) })
  if (notification.event === 'confirmed' || notification.event === 'reminder') {
    await getSmsSender(payload).send({ to: normalizePhone(view.customer.phone), text: renderCustomerSms(view, notification.event) })
  }
}

export async function sendCorporateRequestNotification(payload: Payload, corporateRequestId: number): Promise<void> {
  const to = await staffRecipients(payload)
  if (to.length === 0) {
    payload.logger.warn('No staff notification emails configured in Settings; skipping corporate request email')
    return
  }
  const [request, settings] = await Promise.all([
    payload.findByID({ collection: 'corporate-requests', id: corporateRequestId, depth: 0 }),
    getSettings(payload),
  ])
  await payload.sendEmail({
    to,
    ...renderStaffCorporateEmail({
      companyName: settings.companyName,
      requestCompany: request.companyName,
      contactName: request.contactName,
      email: request.email,
      phone: request.phone,
      vehicleCount: request.vehicleCount,
      startDate: request.startDate,
      durationMonths: request.durationMonths,
      notes: request.notes ?? null,
      adminUrl: adminDocumentUrl('corporate-requests', request.id),
    }),
  })
}

/**
 * Sends a reminder for confirmed reservations picked up in the next ~24 hours. Runs hourly;
 * `reminderSentAt` makes it send once. Reservations booked less than a few hours ahead are skipped.
 */
export async function sendPickupReminders(payload: Payload, now = new Date()): Promise<{ sent: number; failed: number }> {
  const { docs } = await payload.find({
    collection: 'reservations',
    where: {
      and: [
        { status: { equals: 'confirmed' } },
        { reminderSentAt: { exists: false } },
        { pickupAt: { greater_than: new Date(now.getTime() + 3 * HOUR_MS).toISOString() } },
        { pickupAt: { less_than_equal: new Date(now.getTime() + 24 * HOUR_MS).toISOString() } },
      ],
    },
    select: { code: true },
    depth: 0,
    pagination: false,
  })

  let sent = 0
  let failed = 0
  for (const { id } of docs) {
    try {
      await sendReservationNotification(payload, { reservationId: id, audience: 'customer', event: 'reminder' })
      await payload.update({
        collection: 'reservations',
        id,
        data: { reminderSentAt: now.toISOString() },
        context: { skipNotifications: true },
      })
      sent++
    } catch (error) {
      failed++
      payload.logger.error({ err: error, reservationId: id }, 'Pickup reminder failed')
    }
  }
  return { sent, failed }
}

/** Daily staff email about traffic insurance / casco / inspection expiry (milestones + expired). */
export async function sendVehicleDocumentReminders(payload: Payload, now = new Date()): Promise<{ items: number }> {
  const today = toLocalDate(now, DEFAULT_TIME_ZONE)
  const { docs } = await payload.find({
    collection: 'vehicles',
    where: { status: { not_equals: 'sold' } },
    select: { plate: true, status: true, insuranceExpiresAt: true, cascoExpiresAt: true, inspectionExpiresAt: true },
    depth: 0,
    pagination: false,
  })
  const due = documentsDueForReminder(findExpiringDocuments(docs, today, Math.max(...REMINDER_DAYS)))
  if (due.length === 0) return { items: 0 }

  const to = await staffRecipients(payload)
  if (to.length === 0) {
    payload.logger.warn('No staff notification emails configured in Settings; skipping document reminder')
    return { items: 0 }
  }
  const settings = await getSettings(payload)
  await payload.sendEmail({
    to,
    ...renderStaffDocumentExpiryEmail(settings.companyName, due, (vehicleId) => adminDocumentUrl('vehicles', vehicleId)),
  })
  return { items: due.length }
}
