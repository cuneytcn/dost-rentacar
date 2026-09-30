import { formatMoney, type Locale, type Money, type PreferredPaymentMethod } from '@rent/shared'

import { customerMessages, fill, staffDocumentMessages, staffMessages } from '@/i18n/notifications'

import type { ExpiringDocument } from '../vehicle-documents'

/** Pure email/SMS rendering from plain view data. Styling is minimal until the frontend design exists. */

export type RenderedEmail = { subject: string; html: string; text: string }

export type ReservationView = {
  code: string
  locale: Locale
  companyName: string
  customer: { name: string; email: string; phone: string }
  vehicleName: string
  pickupLocation: { name: string; address: string; phone: string }
  returnLocationName: string
  pickupAt: Date
  returnAt: Date
  timeZone: string
  rentalDays: number
  extras: { name: string; quantity: number }[]
  total: Money
  deposit: Money
  preferredPaymentMethod: PreferredPaymentMethod
  bankAccounts: { bankName: string; accountHolder: string; iban: string; currency: string }[]
  customerNote: string | null
  manageUrl: string
  adminUrl: string
}

export type CustomerEvent = 'created' | 'confirmed' | 'cancelled' | 'reminder'

const intlLocale: Record<Locale, string> = { tr: 'tr-TR', en: 'en-GB', de: 'de-DE', ru: 'ru-RU' }

export function formatDateTime(date: Date, locale: Locale, timeZone: string): string {
  return new Intl.DateTimeFormat(intlLocale[locale], { dateStyle: 'medium', timeStyle: 'short', timeZone }).format(date)
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

type Row = [label: string, value: string]

function layout(companyName: string, blocks: string[], footer: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px">
<tr><td style="padding:20px 24px;border-bottom:1px solid #e5e7eb;font-size:20px;font-weight:bold">${escapeHtml(companyName)}</td></tr>
<tr><td style="padding:24px;font-size:15px;line-height:1.5">${blocks.join('')}</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280">${escapeHtml(footer)}</td></tr>
</table></td></tr></table></body></html>`
}

const paragraph = (text: string) => `<p style="margin:0 0 16px">${escapeHtml(text)}</p>`
const heading = (text: string) => `<h3 style="margin:24px 0 8px;font-size:16px">${escapeHtml(text)}</h3>`
const table = (rows: Row[]) =>
  `<table role="presentation" width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse;margin:0 0 16px">${rows
    .map(
      ([label, value]) =>
        `<tr><td style="border-bottom:1px solid #f0f0f0;color:#6b7280;width:40%">${escapeHtml(label)}</td><td style="border-bottom:1px solid #f0f0f0;font-weight:bold">${escapeHtml(value)}</td></tr>`,
    )
    .join('')}</table>`
const button = (href: string, label: string) =>
  `<p style="margin:24px 0"><a href="${escapeHtml(href)}" style="background:#111827;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:6px;display:inline-block">${escapeHtml(label)}</a></p>`
const list = (items: string[]) => `<ul style="margin:0 0 16px;padding-left:20px">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`

const textRows = (rows: Row[]) => rows.map(([label, value]) => `${label}: ${value}`).join('\n')

export function renderCustomerEmail(view: ReservationView, event: CustomerEvent): RenderedEmail {
  const m = customerMessages[view.locale]
  const values = { code: view.code, name: view.customer.name }
  const content = m[event]
  const money = (value: Money) => formatMoney(value, intlLocale[view.locale])

  const rows: Row[] = [
    [m.details.code, view.code],
    [m.details.vehicle, view.vehicleName],
    [m.details.pickup, `${formatDateTime(view.pickupAt, view.locale, view.timeZone)} · ${view.pickupLocation.name}`],
    [m.details.return, `${formatDateTime(view.returnAt, view.locale, view.timeZone)} · ${view.returnLocationName}`],
    [m.details.days, String(view.rentalDays)],
    ...(view.extras.length
      ? [[m.details.extras, view.extras.map((extra) => `${extra.name} × ${extra.quantity}`).join(', ')] as Row]
      : []),
    [m.details.total, money(view.total)],
    ...(view.deposit.amount > 0 ? [[m.details.deposit, money(view.deposit)] as Row] : []),
  ]

  const blocks = [paragraph(fill(m.greeting, values)), paragraph(content.intro), table(rows)]
  const text = [fill(m.greeting, values), content.intro, textRows(rows)]

  if (event === 'created' || event === 'confirmed') {
    blocks.push(heading(m.payment.title))
    text.push(`\n${m.payment.title}`)
    if (view.preferredPaymentMethod === 'bank_transfer' && view.bankAccounts.length) {
      blocks.push(paragraph(m.payment.bankTransfer))
      text.push(m.payment.bankTransfer)
      for (const account of view.bankAccounts) {
        const accountRows: Row[] = [
          [account.bankName, account.currency],
          [m.payment.accountHolder, account.accountHolder],
          [m.payment.iban, account.iban],
        ]
        blocks.push(table(accountRows))
        text.push(textRows(accountRows))
      }
      blocks.push(paragraph(fill(m.payment.bankReference, values)))
      text.push(fill(m.payment.bankReference, values))
    } else {
      blocks.push(paragraph(m.payment.office))
      text.push(m.payment.office)
    }
  }

  if (event === 'confirmed' || event === 'reminder') {
    const locationRows: Row[] = [
      [view.pickupLocation.name, view.pickupLocation.address],
      ['☎', view.pickupLocation.phone],
    ]
    blocks.push(heading(m.locationTitle), table(locationRows))
    text.push(`\n${m.locationTitle}`, textRows(locationRows))
  }

  if (event === 'reminder') {
    blocks.push(paragraph(m.reminder.bring), list(m.reminder.bringItems))
    text.push(m.reminder.bring, ...m.reminder.bringItems.map((item) => `- ${item}`))
  }

  if (event !== 'cancelled') {
    blocks.push(button(view.manageUrl, m.manage))
    text.push(`\n${m.manage}: ${view.manageUrl}`)
  }

  return {
    subject: fill(content.subject, values),
    html: layout(view.companyName, blocks, m.footer),
    text: text.join('\n'),
  }
}

export function renderCustomerSms(view: ReservationView, event: 'confirmed' | 'reminder'): string {
  return fill(customerMessages[view.locale].sms[event], {
    company: view.companyName,
    code: view.code,
    date: formatDateTime(view.pickupAt, view.locale, view.timeZone),
    location: view.pickupLocation.name,
  })
}

export function renderStaffReservationEmail(view: ReservationView): RenderedEmail {
  const m = staffMessages.newReservation
  const rows: Row[] = [
    ['Rezervasyon no', view.code],
    ['Araç', view.vehicleName],
    ['Alış', `${formatDateTime(view.pickupAt, 'tr', view.timeZone)} · ${view.pickupLocation.name}`],
    ['İade', `${formatDateTime(view.returnAt, 'tr', view.timeZone)} · ${view.returnLocationName}`],
    ['Gün', String(view.rentalDays)],
    ...(view.extras.length ? [['Ek hizmetler', view.extras.map((extra) => `${extra.name} × ${extra.quantity}`).join(', ')] as Row] : []),
    ['Toplam', formatMoney(view.total, 'tr-TR')],
    [m.customer, view.customer.name],
    [m.phone, view.customer.phone],
    [m.email, view.customer.email],
    [m.payment, m.paymentMethods[view.preferredPaymentMethod]],
    ...(view.customerNote ? [[m.note, view.customerNote] as Row] : []),
  ]
  return {
    subject: fill(m.subject, { code: view.code }),
    html: layout(view.companyName, [paragraph(m.intro), table(rows), button(view.adminUrl, m.open)], view.companyName),
    text: [m.intro, textRows(rows), `${m.open}: ${view.adminUrl}`].join('\n\n'),
  }
}

export type CorporateRequestView = {
  companyName: string
  requestCompany: string
  contactName: string
  email: string
  phone: string
  vehicleCount: number
  startDate: string
  durationMonths: number
  notes: string | null
  adminUrl: string
}

export function renderStaffCorporateEmail(view: CorporateRequestView): RenderedEmail {
  const m = staffMessages.newCorporateRequest
  const rows: Row[] = [
    ['Firma', view.requestCompany],
    [m.contact, view.contactName],
    ['Telefon', view.phone],
    ['E-posta', view.email],
    [m.vehicles, String(view.vehicleCount)],
    [m.start, view.startDate],
    [m.duration, String(view.durationMonths)],
    ...(view.notes ? [[m.notes, view.notes] as Row] : []),
  ]
  return {
    subject: fill(m.subject, { company: view.requestCompany }),
    html: layout(view.companyName, [paragraph(m.intro), table(rows), button(view.adminUrl, m.open)], view.companyName),
    text: [m.intro, textRows(rows), `${m.open}: ${view.adminUrl}`].join('\n\n'),
  }
}

export function renderStaffDocumentExpiryEmail(
  companyName: string,
  items: ExpiringDocument[],
  vehicleUrl: (vehicleId: number) => string,
): RenderedEmail {
  const m = staffDocumentMessages
  const status = (daysLeft: number) =>
    daysLeft < 0 ? m.expired : daysLeft === 0 ? m.today : fill(m.daysLeft, { days: String(daysLeft) })
  const rows = items.map((item) => ({
    ...item,
    label: m.documents[item.document],
    date: item.expiresOn.split('-').reverse().join('.'),
    statusText: status(item.daysLeft),
  }))
  const htmlTable = `<table role="presentation" width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse;margin:0 0 16px">
<tr>${[m.plate, m.document, m.expiresOn, m.status].map((header) => `<th align="left" style="border-bottom:2px solid #e5e7eb">${escapeHtml(header)}</th>`).join('')}</tr>
${rows
  .map(
    (row) =>
      `<tr><td style="border-bottom:1px solid #f0f0f0"><a href="${escapeHtml(vehicleUrl(row.vehicleId))}">${escapeHtml(row.plate)}</a></td><td style="border-bottom:1px solid #f0f0f0">${escapeHtml(row.label)}</td><td style="border-bottom:1px solid #f0f0f0">${escapeHtml(row.date)}</td><td style="border-bottom:1px solid #f0f0f0;${row.daysLeft < 0 ? 'color:#b91c1c;font-weight:bold' : ''}">${escapeHtml(row.statusText)}</td></tr>`,
  )
  .join('')}</table>`
  return {
    subject: fill(m.subject, { count: String(items.length) }),
    html: layout(companyName, [paragraph(m.intro), htmlTable], companyName),
    text: [m.intro, ...rows.map((row) => `${row.plate} · ${row.label} · ${row.date} · ${row.statusText}`)].join('\n'),
  }
}
