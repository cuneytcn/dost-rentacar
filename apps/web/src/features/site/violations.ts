import type { PublicSettings } from '@rent/shared'

import type { Messages } from './i18n/messages/en'
import { format, formatPlural } from './i18n/types'

export function violationText(messages: Messages, intlLocale: string, rules: PublicSettings['reservationRules'], code: string | null | undefined): string {
  const template = code ? messages.violations[code as keyof Messages['violations']] : undefined
  if (!template) return messages.car.unavailable
  const days = (count: number) => formatPlural(intlLocale, messages.search.days, count)
  const values: Record<string, string | number> = { hours: rules.minLeadTimeHours }
  if (code === 'min_rental_days') values.days = days(rules.minRentalDays)
  if (code === 'max_rental_days') values.days = days(rules.maxRentalDays)
  if (code === 'too_far_ahead') values.days = days(rules.maxAdvanceDays)
  return format(template, values)
}
