import type { GlobalConfig } from 'payload'

import { CURRENCIES } from '@rent/shared'

import { admins, anyone } from '@/access'
import { adminGroups, optionLabels, options, text } from '@/i18n/admin'

export const Settings: GlobalConfig = {
  slug: 'settings',
  label: text('Settings', 'Ayarlar'),
  admin: { group: adminGroups.system },
  access: {
    read: anyone,
    update: admins,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: text('Company', 'Firma'),
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'companyName', type: 'text', label: text('Brand name', 'Marka adı'), required: true, defaultValue: 'Rent a Car' },
                { name: 'legalName', type: 'text', label: text('Legal name', 'Ticari unvan') },
              ],
            },
            {
              name: 'authorizationNumber',
              type: 'text',
              label: text('Rental authorisation no.', 'Kiralama yetki belgesi no'),
              admin: { description: text('Shown on the website as the rental regulation requires.', 'Kiralama yönetmeliği gereği sitede gösterilir.') },
            },
            {
              type: 'row',
              fields: [
                { name: 'taxOffice', type: 'text', label: text('Tax office', 'Vergi dairesi') },
                { name: 'taxNumber', type: 'text', label: text('Tax number', 'Vergi no') },
                { name: 'mersisNumber', type: 'text', label: text('MERSIS number', 'MERSİS no') },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'phone', type: 'text', label: text('Phone', 'Telefon') },
                { name: 'whatsapp', type: 'text', label: text('WhatsApp', 'WhatsApp'), admin: { description: text('International format, e.g. 905551112233', 'Uluslararası format, ör. 905551112233') } },
                { name: 'email', type: 'email', label: text('Email', 'E-posta') },
              ],
            },
            { name: 'address', type: 'textarea', label: text('Head office address', 'Merkez adres') },
            {
              name: 'socialLinks',
              type: 'group',
              label: text('Social media', 'Sosyal medya'),
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'instagram', type: 'text', label: 'Instagram' },
                    { name: 'facebook', type: 'text', label: 'Facebook' },
                    { name: 'x', type: 'text', label: 'X' },
                    { name: 'youtube', type: 'text', label: 'YouTube' },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: text('Currency & payment', 'Para birimi ve ödeme'),
          fields: [
            {
              name: 'baseCurrency',
              type: 'select',
              label: text('Base currency', 'Ana para birimi'),
              required: true,
              defaultValue: 'TRY',
              options: options(CURRENCIES, optionLabels.currency),
              admin: {
                description: text(
                  'All prices in the panel are entered in this currency. Changing it later does not convert existing prices.',
                  'Paneldeki tüm fiyatlar bu para biriminde girilir. Sonradan değiştirmek mevcut fiyatları dönüştürmez.',
                ),
              },
            },
            {
              name: 'displayCurrencies',
              type: 'select',
              label: text('Currencies shown on the website', 'Sitede gösterilen para birimleri'),
              hasMany: true,
              defaultValue: ['TRY', 'EUR', 'USD', 'GBP'],
              options: options(CURRENCIES, optionLabels.currency),
            },
            {
              name: 'bankAccounts',
              type: 'array',
              label: text('Bank accounts (for transfers)', 'Banka hesapları (havale için)'),
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'bankName', type: 'text', label: text('Bank', 'Banka'), required: true },
                    { name: 'accountHolder', type: 'text', label: text('Account holder', 'Hesap sahibi'), required: true },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'iban', type: 'text', label: 'IBAN', required: true },
                    { name: 'currency', type: 'select', label: text('Currency', 'Para birimi'), required: true, options: options(CURRENCIES, optionLabels.currency) },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: text('Reservation rules', 'Rezervasyon kuralları'),
          fields: [
            {
              name: 'reservationRules',
              type: 'group',
              label: false,
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'minLeadTimeHours', type: 'number', label: text('Min. notice (hours)', 'Min. ön süre (saat)'), required: true, defaultValue: 2, min: 0 },
                    { name: 'minRentalDays', type: 'number', label: text('Min. rental days', 'Min. kiralama günü'), required: true, defaultValue: 1, min: 1 },
                    {
                      name: 'maxRentalDays',
                      type: 'number',
                      label: text('Max. rental days online', 'Online maks. kiralama günü'),
                      required: true,
                      defaultValue: 60,
                      min: 1,
                      admin: { description: text('Longer rentals go through the corporate form.', 'Daha uzun kiralamalar kurumsal formdan alınır.') },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'maxAdvanceDays', type: 'number', label: text('Bookable up to (days ahead)', 'En fazla kaç gün sonrası için'), required: true, defaultValue: 365, min: 1 },
                    { name: 'graceMinutes', type: 'number', label: text('Late return grace (minutes)', 'Geç iade toleransı (dk)'), required: true, defaultValue: 60, min: 0 },
                    {
                      name: 'bufferMinutes',
                      type: 'number',
                      label: text('Buffer between rentals (minutes)', 'Kiralamalar arası hazırlık (dk)'),
                      required: true,
                      defaultValue: 60,
                      min: 0,
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'selfCancelCutoffHours',
                      type: 'number',
                      label: text('Online cancellation until (hours before pickup)', 'Online iptal (alıştan kaç saat öncesine kadar)'),
                      required: true,
                      defaultValue: 24,
                      min: 0,
                    },
                  ],
                },
              ],
            },
            {
              name: 'cancellationPolicy',
              type: 'textarea',
              label: text('Cancellation policy (short)', 'İptal koşulları (kısa)'),
              localized: true,
            },
          ],
        },
        {
          label: text('Notifications', 'Bildirimler'),
          fields: [
            {
              name: 'notificationEmails',
              type: 'array',
              label: text('Emails notified of new reservations', 'Yeni rezervasyonların bildirileceği e-postalar'),
              fields: [{ name: 'email', type: 'email', label: text('Email', 'E-posta'), required: true }],
            },
          ],
        },
      ],
    },
  ],
}
