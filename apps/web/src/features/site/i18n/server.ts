import 'server-only'

import type { Locale } from '@rent/shared'

import { de } from './messages/de'
import { en, type Messages } from './messages/en'
import { ru } from './messages/ru'
import { tr } from './messages/tr'

const DICTIONARIES: Record<Locale, Messages> = { tr, en, de, ru }

export function getMessages(locale: Locale): Messages {
  return DICTIONARIES[locale]
}
