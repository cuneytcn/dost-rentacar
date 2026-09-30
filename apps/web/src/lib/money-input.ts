/**
 * Converts between what staff type in the admin panel ("45", "45,5", "1.234,56", "1,234.56")
 * and integer minor units. The last separator followed by 1-2 digits is the decimal mark;
 * other separators are thousands separators.
 */
export function parseMoneyInput(input: string): number | null | 'invalid' {
  const cleaned = input.replace(/[\s €$£₺]/g, '').replace(/^\+/, '')
  if (cleaned === '') return null
  if (!/^\d[\d.,]*$/.test(cleaned)) return 'invalid'

  const decimalMatch = cleaned.match(/[.,](\d{1,2})$/)
  const integerPart = (decimalMatch ? cleaned.slice(0, -decimalMatch[0].length) : cleaned).replace(/[.,]/g, '')
  const fraction = decimalMatch ? decimalMatch[1]!.padEnd(2, '0') : '00'
  if (!/^\d+$/.test(integerPart)) return 'invalid'

  const minor = Number(integerPart) * 100 + Number(fraction)
  return Number.isSafeInteger(minor) ? minor : 'invalid'
}

export function formatMoneyInput(minor: number | null | undefined, locale: string): string {
  if (minor == null || Number.isNaN(minor)) return ''
  return new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(minor / 100)
}
