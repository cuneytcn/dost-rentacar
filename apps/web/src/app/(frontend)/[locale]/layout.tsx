import type { Metadata, Viewport } from 'next'
import { Manrope } from 'next/font/google'
import { notFound } from 'next/navigation'

import { Toaster } from '@/components/ui/sonner'
import { getDisplayCurrency, getSiteSettings } from '@/features/site/data'
import { getMessages } from '@/features/site/i18n/server'
import { SiteFooter } from '@/features/site/layout/site-footer'
import { SiteHeader } from '@/features/site/layout/site-header'
import { WhatsappButton } from '@/features/site/layout/whatsapp-button'
import { isLocale } from '@/features/site/routes'
import { SiteProvider } from '@/features/site/site-context'
import { siteUrl } from '@/lib/urls'

import './site.css'

const manrope = Manrope({ variable: '--font-manrope', subsets: ['latin', 'latin-ext', 'cyrillic'], display: 'swap' })

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const settings = await getSiteSettings(locale)
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: settings.companyName, template: `%s · ${settings.companyName}` },
    applicationName: settings.companyName,
    openGraph: { siteName: settings.companyName, type: 'website', locale },
    twitter: { card: 'summary_large_image' },
    // Search Console / Yandex Webmaster ownership tags, set per environment.
    verification: {
      ...(process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : {}),
      ...(process.env.YANDEX_VERIFICATION ? { yandex: process.env.YANDEX_VERIFICATION } : {}),
    },
  }
}

export const viewport: Viewport = { themeColor: '#1a4582' }

export default async function SiteLayout({ children, params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const [settings, display] = await Promise.all([getSiteSettings(locale), getDisplayCurrency(locale)])
  const messages = getMessages(locale)

  return (
    <html lang={locale} className={manrope.variable}>
      <body className="flex min-h-dvh flex-col font-sans">
        <a
          href="#content"
          className="bg-primary text-primary-foreground sr-only z-50 rounded-md px-4 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          {messages.nav.skipToContent}
        </a>
        <SiteProvider locale={locale} messages={messages} display={display} baseCurrency={settings.baseCurrency} rules={settings.reservationRules}>
          <SiteHeader locale={locale} />
          <main id="content" className="flex-1">
            {children}
          </main>
          <SiteFooter locale={locale} />
          {settings.whatsapp && <WhatsappButton number={settings.whatsapp} label={messages.nav.whatsapp} />}
          <Toaster position="bottom-center" richColors theme="light" />
        </SiteProvider>
      </body>
    </html>
  )
}
