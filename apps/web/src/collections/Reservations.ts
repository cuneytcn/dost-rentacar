import type { CollectionConfig } from 'payload'

import {
  CURRENCIES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  PREFERRED_PAYMENT_METHODS,
  RESERVATION_SOURCES,
  RESERVATION_STATUSES,
} from '@rent/shared'

import { admins, staff, staffScopedByLocation } from '@/access'
import { moneyField } from '@/fields'
import {
  assignReservationCode,
  calculateReservationPrice,
  enforceStatusTransition,
  syncPaymentStatus,
  validateVehicleAssignment,
} from '@/hooks/reservations'
import { queueReservationNotifications } from '@/hooks/notifications'
import { adminGroups, optionLabels, options, text } from '@/i18n/admin'

const locationScope = staffScopedByLocation(['pickupLocation', 'returnLocation'])

export const Reservations: CollectionConfig = {
  slug: 'reservations',
  labels: { singular: text('Reservation', 'Rezervasyon'), plural: text('Reservations', 'Rezervasyonlar') },
  admin: {
    useAsTitle: 'code',
    defaultColumns: ['code', 'customer', 'vehicleModel', 'vehicle', 'pickupAt', 'returnAt', 'status', 'paymentStatus'],
    listSearchableFields: ['code'],
    group: adminGroups.operations,
  },
  access: {
    read: locationScope,
    create: staff,
    update: locationScope,
    delete: admins,
  },
  defaultSort: '-pickupAt',
  hooks: {
    beforeValidate: [assignReservationCode],
    beforeChange: [enforceStatusTransition, calculateReservationPrice, syncPaymentStatus, validateVehicleAssignment],
    afterChange: [queueReservationNotifications],
  },
  fields: [
    {
      name: 'code',
      type: 'text',
      label: text('Code', 'Rezervasyon no'),
      unique: true,
      index: true,
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      label: text('Status', 'Durum'),
      required: true,
      defaultValue: 'pending',
      index: true,
      options: options(RESERVATION_STATUSES, optionLabels.reservationStatus),
      admin: { position: 'sidebar' },
    },
    {
      name: 'paymentStatus',
      type: 'select',
      label: text('Payment status', 'Ödeme durumu'),
      required: true,
      defaultValue: 'unpaid',
      index: true,
      options: options(PAYMENT_STATUSES, optionLabels.paymentStatus),
      admin: {
        position: 'sidebar',
        description: text(
          'Calculated from payments; set "Refunded" manually.',
          'Ödemelerden hesaplanır; "İade edildi" elle seçilir.',
        ),
      },
    },
    {
      name: 'source',
      type: 'select',
      label: text('Source', 'Kaynak'),
      required: true,
      defaultValue: 'phone',
      options: options(RESERVATION_SOURCES, optionLabels.reservationSource),
      admin: { position: 'sidebar' },
    },
    {
      name: 'locale',
      type: 'text',
      label: text('Customer language', 'Müşteri dili'),
      defaultValue: 'tr',
      admin: { position: 'sidebar' },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: text('Rental', 'Kiralama'),
          fields: [
            { name: 'customer', type: 'relationship', label: text('Customer', 'Müşteri'), relationTo: 'customers', required: true, index: true },
            {
              type: 'row',
              fields: [
                { name: 'vehicleModel', type: 'relationship', label: text('Booked model', 'Rezerve edilen model'), relationTo: 'vehicle-models', required: true, index: true },
                {
                  name: 'vehicle',
                  type: 'relationship',
                  label: text('Assigned vehicle', 'Atanan araç'),
                  relationTo: 'vehicles',
                  index: true,
                  admin: {
                    description: text(
                      'Assign a plate when confirming. A different model means an upgrade.',
                      'Onaylarken plaka atayın. Farklı model seçilirse upgrade sayılır.',
                    ),
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'pickupLocation', type: 'relationship', label: text('Pickup location', 'Alış şubesi'), relationTo: 'locations', required: true, index: true },
                { name: 'returnLocation', type: 'relationship', label: text('Return location', 'İade şubesi'), relationTo: 'locations', required: true, index: true },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'pickupAt', type: 'date', label: text('Pickup', 'Alış'), required: true, index: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
                {
                  name: 'returnAt',
                  type: 'date',
                  label: text('Return', 'İade'),
                  required: true,
                  index: true,
                  admin: { date: { pickerAppearance: 'dayAndTime' } },
                  validate: (value: unknown, { siblingData }: { siblingData: Partial<{ pickupAt: string }> }) => {
                    if (value && siblingData?.pickupAt && new Date(value as string) <= new Date(siblingData.pickupAt)) {
                      return 'Return must be after pickup'
                    }
                    return true
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'flightNumber', type: 'text', label: text('Flight number', 'Uçuş no') },
                {
                  name: 'preferredPaymentMethod',
                  type: 'select',
                  label: text('Preferred payment', 'Tercih edilen ödeme'),
                  required: true,
                  defaultValue: 'office',
                  options: options(PREFERRED_PAYMENT_METHODS, optionLabels.preferredPaymentMethod),
                },
              ],
            },
            {
              name: 'additionalDrivers',
              type: 'array',
              label: text('Additional drivers', 'Ek sürücüler'),
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'fullName', type: 'text', label: text('Full name', 'Ad soyad'), required: true },
                    { name: 'licenseNumber', type: 'text', label: text('License number', 'Ehliyet no') },
                    { name: 'birthDate', type: 'text', label: text('Birth date', 'Doğum tarihi'), admin: { placeholder: 'YYYY-MM-DD' } },
                  ],
                },
              ],
            },
            { name: 'customerNote', type: 'textarea', label: text('Customer note', 'Müşteri notu') },
            { name: 'internalNote', type: 'textarea', label: text('Internal note', 'İç not') },
          ],
        },
        {
          label: text('Price', 'Fiyat'),
          fields: [
            {
              name: 'extras',
              type: 'array',
              label: text('Extras', 'Ek hizmetler'),
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'extra', type: 'relationship', label: text('Extra', 'Ek hizmet'), relationTo: 'extras', required: true },
                    { name: 'quantity', type: 'number', label: text('Quantity', 'Adet'), required: true, min: 1, defaultValue: 1 },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'name', type: 'text', label: text('Name (snapshot)', 'Ad (kayıt anı)'), admin: { readOnly: true } },
                    moneyField({ name: 'unitPrice', label: text('Unit price', 'Birim fiyat'), admin: { readOnly: true } }),
                    { name: 'chargedDays', type: 'number', label: text('Charged days', 'Ücretlenen gün'), admin: { readOnly: true } },
                    moneyField({ name: 'total', label: text('Total', 'Toplam'), admin: { readOnly: true } }),
                  ],
                },
              ],
            },
            {
              name: 'recalculatePrice',
              type: 'checkbox',
              label: text('Recalculate price on save', 'Kaydederken fiyatı yeniden hesapla'),
              defaultValue: false,
              admin: {
                description: text(
                  'Prices are frozen at booking time. Tick this after changing dates, model, locations or extras.',
                  'Fiyat rezervasyon anında sabitlenir. Tarih, model, şube veya ek hizmet değiştirdiyseniz işaretleyin.',
                ),
              },
            },
            {
              name: 'pricing',
              type: 'group',
              label: text('Price snapshot', 'Fiyat özeti'),
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'currency', type: 'select', label: text('Currency', 'Para birimi'), options: options(CURRENCIES, optionLabels.currency), admin: { readOnly: true } },
                    { name: 'rentalDays', type: 'number', label: text('Days', 'Gün'), admin: { readOnly: true } },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    moneyField({ name: 'baseTotal', label: text('Rental', 'Kiralama'), admin: { readOnly: true } }),
                    moneyField({ name: 'extrasTotal', label: text('Extras', 'Ek hizmetler'), admin: { readOnly: true } }),
                    moneyField({ name: 'transferFee', label: text('One-way fee', 'Farklı şube ücreti'), admin: { readOnly: true } }),
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    moneyField({ name: 'discount', label: text('Discount', 'İndirim'), defaultValue: 0 }),
                    moneyField({ name: 'total', label: text('Total', 'Toplam'), admin: { readOnly: true } }),
                    moneyField({ name: 'deposit', label: text('Deposit', 'Depozito'), admin: { readOnly: true } }),
                  ],
                },
                { name: 'dailyBreakdown', type: 'json', label: text('Daily breakdown', 'Günlük döküm'), admin: { readOnly: true } },
              ],
            },
            {
              name: 'display',
              type: 'group',
              label: text('Shown to customer in', 'Müşteriye gösterilen'),
              admin: {
                description: text(
                  'Currency the customer browsed in, with the rate at booking time. For information only.',
                  'Müşterinin gezindiği para birimi ve rezervasyon anındaki kur. Yalnızca bilgi amaçlıdır.',
                ),
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'currency', type: 'select', label: text('Currency', 'Para birimi'), options: options(CURRENCIES, optionLabels.currency), admin: { readOnly: true } },
                    { name: 'rate', type: 'number', label: text('Rate', 'Kur'), admin: { readOnly: true } },
                    { name: 'total', type: 'number', label: text('Total (minor units)', 'Toplam (kuruş)'), admin: { readOnly: true } },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: text('Payments', 'Ödemeler'),
          fields: [
            {
              name: 'payments',
              type: 'array',
              label: text('Payments received', 'Alınan ödemeler'),
              fields: [
                {
                  type: 'row',
                  fields: [
                    moneyField({ name: 'amount', label: text('Amount', 'Tutar'), required: true }),
                    { name: 'method', type: 'select', label: text('Method', 'Yöntem'), required: true, options: options(PAYMENT_METHODS, optionLabels.paymentMethod) },
                    { name: 'paidAt', type: 'date', label: text('Date', 'Tarih'), required: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'reference', type: 'text', label: text('Reference', 'Referans / dekont no') },
                    { name: 'proof', type: 'upload', label: text('Proof', 'Dekont'), relationTo: 'documents' },
                  ],
                },
              ],
            },
            moneyField({ name: 'paidTotal', label: text('Paid total', 'Ödenen toplam'), defaultValue: 0, admin: { readOnly: true } }),
          ],
        },
        {
          label: text('History', 'Geçmiş'),
          fields: [
            { name: 'confirmedAt', type: 'date', label: text('Confirmed at', 'Onay zamanı'), admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
            { name: 'cancelledAt', type: 'date', label: text('Cancelled at', 'İptal zamanı'), admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
            { name: 'cancelReason', type: 'textarea', label: text('Cancel reason', 'İptal sebebi') },
            { name: 'reminderSentAt', type: 'date', label: text('Pickup reminder sent', 'Teslim hatırlatması gönderildi'), admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
            {
              name: 'handovers',
              type: 'join',
              label: text('Handovers', 'Teslim / iade kayıtları'),
              collection: 'handovers',
              on: 'reservation',
            },
            {
              name: 'penalties',
              type: 'join',
              label: text('Penalties', 'Cezalar ve ek ücretler'),
              collection: 'penalties',
              on: 'reservation',
            },
          ],
        },
      ],
    },
  ],
}
