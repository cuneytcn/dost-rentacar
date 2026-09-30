import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { FAQ_CATEGORIES } from '@rent/shared'

import { Button } from '@/components/ui/button'
import { FaqList } from '@/features/site/components/faq-list'
import { PageHero } from '@/features/site/components/section'
import { contentTokens } from '@/features/site/components/site-rich-text'
import { getFaqs, getSiteSettings } from '@/features/site/data'
import { getMessages } from '@/features/site/i18n/server'
import { isLocale, sitePath } from '@/features/site/routes'
import { alternatesFor } from '@/features/site/seo'
import { lexicalToText } from '@/features/site/lexical-text'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const m = getMessages(locale)
  return { title: m.meta.faqTitle, description: m.meta.faqDescription, alternates: alternatesFor(locale, '/faq') }
}

export default async function FaqPage({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const m = getMessages(locale)
  const [faqs, settings] = await Promise.all([getFaqs(locale), getSiteSettings(locale)])
  const groups = FAQ_CATEGORIES.map((category) => ({ category, items: faqs.filter((faq) => faq.category === category) })).filter((group) => group.items.length > 0)
  const tokens = contentTokens(settings)
  const fill = (text: string) => text.replace(/\{\{(\w+)\}\}/g, (match, key: string) => tokens[key] ?? match)
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: fill(lexicalToText(faq.answer)) } })),
  }

  return (
    <>
      <PageHero title={m.faq.title} subtitle={m.faq.subtitle} />
      <section className="container-site grid gap-10 py-10 sm:py-14 lg:grid-cols-[14rem_1fr]">
        {groups.length > 1 && (
          <nav className="hidden lg:block">
            <ul className="sticky top-24 space-y-1">
              {groups.map(({ category }) => (
                <li key={category}>
                  <a href={`#${category}`} className="text-brand-900 hover:bg-brand-50 block rounded-lg px-3 py-2 text-sm font-semibold">
                    {m.faq.categories[category]}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <div className={groups.length > 1 ? 'space-y-10' : 'space-y-10 lg:col-span-2 lg:mx-auto lg:w-full lg:max-w-3xl'}>
          {groups.map(({ category, items }) => (
            <div key={category} id={category} className="scroll-mt-24 space-y-4">
              {groups.length > 1 && <h2 className="text-brand-950 text-xl font-extrabold">{m.faq.categories[category]}</h2>}
              <FaqList faqs={items} tokens={tokens} />
            </div>
          ))}
          <div className="bg-surface flex flex-col items-start gap-4 rounded-2xl border p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-brand-950 font-bold">{m.faq.stillQuestions}</p>
            <Button asChild className="h-11 rounded-full px-6 font-bold">
              <Link href={sitePath(locale, '/contact')}>{m.nav.contact}</Link>
            </Button>
          </div>
        </div>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
    </>
  )
}
