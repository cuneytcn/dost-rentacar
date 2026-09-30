/** Most common renter origins for a Turkish rent-a-car first; names come from Intl in both admin languages. */
const CODES = [
  'TR', 'DE', 'GB', 'RU', 'UA', 'NL', 'FR', 'IT', 'ES', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'PL', 'CZ', 'RO', 'BG', 'GR',
  'AZ', 'GE', 'KZ', 'UZ', 'IR', 'IQ', 'SA', 'AE', 'QA', 'KW', 'IL', 'LB', 'EG', 'US', 'CA', 'AU', 'IE', 'PT', 'HU',
] as const

const names = (locale: string) => new Intl.DisplayNames([locale], { type: 'region' })
const tr = names('tr')
const en = names('en')

export const COUNTRY_SUGGESTIONS: [string, { tr: string; en: string }][] = CODES.map((code) => [
  code,
  { tr: tr.of(code) ?? code, en: en.of(code) ?? code },
])
