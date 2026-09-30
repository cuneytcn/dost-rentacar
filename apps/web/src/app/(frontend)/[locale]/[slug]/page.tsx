import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { contentTokens, SiteRichText } from '@/features/site/components/site-rich-text'
import { getPage, getSiteSettings } from '@/features/site/data'
import { isLocale } from '@/features/site/routes'
import { alternatesFor } from '@/features/site/seo'

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isLocale(locale)) return {}
  const page = await getPage(locale, slug)
  if (!page) return {}
  return { title: page.seo?.title || page.title, description: page.seo?.description ?? undefined, alternates: alternatesFor(locale, `/${page.slug}`) }
}

/** Content pages managed by staff (about, rental terms, privacy notice …). */
export default async function ContentPage({ params }: Props) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()
  const [page, settings] = await Promise.all([getPage(locale, slug), getSiteSettings(locale)])
  if (!page) notFound()
  return (
    <>
      <section className="bg-surface border-b">
        <div className="container-site py-10 sm:py-14">
          <h1 className="text-brand-950 max-w-3xl text-3xl font-extrabold sm:text-5xl">{page.title}</h1>
        </div>
      </section>
      <article className="container-site py-10 sm:py-14">
        <div className="prose-site max-w-3xl">{page.content && <SiteRichText data={page.content} tokens={contentTokens(settings)} />}</div>
      </article>
    </>
  )
}
