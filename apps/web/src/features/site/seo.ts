import type { Metadata } from 'next'

import { DEFAULT_LOCALE, LOCALES, type Locale } from '@rent/shared'

import { sitePath } from './routes'

/** Canonical URL and hreflang links for a page that exists in every language. */
export function alternatesFor(locale: Locale, internalPath: string): Metadata['alternates'] {
  return {
    canonical: sitePath(locale, internalPath),
    languages: {
      ...Object.fromEntries(LOCALES.map((option) => [option, sitePath(option, internalPath)])),
      'x-default': sitePath(DEFAULT_LOCALE, internalPath),
    },
  }
}
