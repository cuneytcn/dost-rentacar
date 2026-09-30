import type { GlobalConfig } from 'payload'

import { CURRENCIES } from '@rent/shared'

import { admins, anyone } from '@/access'
import { adminGroups, optionLabels, options, text } from '@/i18n/admin'

/** Display-only conversion rates relative to the base currency. Refreshed by a scheduled job. */
export const ExchangeRates: GlobalConfig = {
  slug: 'exchange-rates',
  label: text('Exchange rates', 'Döviz kurları'),
  admin: {
    group: adminGroups.system,
    description: text(
      '1 unit of the base currency = rate × target currency. Updated daily from the Central Bank (TCMB).',
      '1 birim ana para birimi = kur × hedef para birimi. Günlük olarak TCMB\'den güncellenir.',
    ),
  },
  access: {
    read: anyone,
    update: admins,
  },
  fields: [
    { name: 'baseCurrency', type: 'select', label: text('Base currency', 'Ana para birimi'), options: options(CURRENCIES, optionLabels.currency), admin: { readOnly: true } },
    {
      name: 'rates',
      type: 'array',
      label: text('Rates', 'Kurlar'),
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'currency', type: 'select', label: text('Currency', 'Para birimi'), required: true, options: options(CURRENCIES, optionLabels.currency) },
            { name: 'rate', type: 'number', label: text('Rate', 'Kur'), required: true, min: 0 },
          ],
        },
      ],
    },
    { name: 'source', type: 'text', label: text('Source', 'Kaynak'), admin: { readOnly: true } },
    { name: 'fetchedAt', type: 'date', label: text('Last update', 'Son güncelleme'), admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
  ],
}
