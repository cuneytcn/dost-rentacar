import type { Locale } from '@rent/shared'

export type LegalPageContent = { title: string; description: string; body: string }

/** A CMS page seeded in every site language; `body` is Markdown converted to Lexical on seed. */
export type LegalPage = { slug: string } & Record<Locale, LegalPageContent>
