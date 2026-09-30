import { describe, expect, it } from 'vitest'

import { renderCustomerEmail, renderCustomerSms, renderStaffReservationEmail, type ReservationView } from './templates'

const view = (overrides: Partial<ReservationView> = {}): ReservationView => ({
  code: 'RABC2345',
  locale: 'en',
  companyName: 'Rent <Co>',
  customer: { name: 'John Doe', email: 'john@example.com', phone: '+44 1234' },
  vehicleName: 'Renault Clio',
  pickupLocation: { name: 'City Center', address: '1st Street', phone: '+90 242' },
  returnLocationName: 'Lara',
  pickupAt: new Date('2026-10-10T07:00:00Z'),
  returnAt: new Date('2026-10-13T07:00:00Z'),
  timeZone: 'Europe/Istanbul',
  rentalDays: 3,
  extras: [{ name: 'Child seat', quantity: 2 }],
  total: { amount: 13100, currency: 'EUR' },
  deposit: { amount: 15000, currency: 'EUR' },
  preferredPaymentMethod: 'bank_transfer',
  bankAccounts: [{ bankName: 'Example Bank', accountHolder: 'Rent Ltd', iban: 'TR00 1234', currency: 'TRY' }],
  customerNote: null,
  manageUrl: 'http://localhost:3050/en/reservation?code=RABC2345',
  adminUrl: 'http://localhost:3050/admin/reservations/1',
  ...overrides,
})

describe('renderCustomerEmail', () => {
  it('renders the booking request with bank transfer instructions in local time', () => {
    const email = renderCustomerEmail(view(), 'created')
    expect(email.subject).toBe('We received your reservation request – RABC2345')
    expect(email.text).toContain('TR00 1234')
    expect(email.text).toContain('reservation number (RABC2345)')
    expect(email.text).toContain('10:00') // 07:00Z in Istanbul
    expect(email.text).toContain('Child seat × 2')
    expect(email.html).toContain('Rent &lt;Co&gt;')
    expect(email.html).not.toContain('Rent <Co>')
  })

  it('uses office payment copy and the customer locale', () => {
    const email = renderCustomerEmail(view({ locale: 'tr', preferredPaymentMethod: 'office' }), 'confirmed')
    expect(email.subject).toBe('Rezervasyonunuz onaylandı – RABC2345')
    expect(email.text).toContain('ofisimizde')
    expect(email.text).toContain('Teslim alacağınız şube')
  })

  it('omits payment and manage link on cancellation and lists documents on reminder', () => {
    const cancelled = renderCustomerEmail(view({ locale: 'de' }), 'cancelled')
    expect(cancelled.text).not.toContain('IBAN')
    expect(cancelled.text).not.toContain('reservation?code')
    const reminder = renderCustomerEmail(view({ locale: 'ru' }), 'reminder')
    expect(reminder.text).toContain('Водительское удостоверение')
  })
})

describe('renderCustomerSms', () => {
  it('fills the template', () => {
    expect(renderCustomerSms(view(), 'confirmed')).toMatch(/^Rent <Co>: Your reservation RABC2345 is confirmed\. Pickup: .+, City Center\.$/)
  })
})

describe('renderStaffReservationEmail', () => {
  it('includes customer contact and admin link', () => {
    const email = renderStaffReservationEmail(view({ customerNote: 'Late arrival' }))
    expect(email.subject).toBe('Yeni rezervasyon talebi: RABC2345')
    expect(email.text).toContain('john@example.com')
    expect(email.text).toContain('Havale / EFT')
    expect(email.text).toContain('Late arrival')
    expect(email.text).toContain('/admin/reservations/1')
  })
})
