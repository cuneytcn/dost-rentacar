import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from '@/features/admin/shell/theme-provider'
import { getAdminLang } from '@/features/admin/i18n'
import { AdminLangProvider } from '@/features/admin/lang-context'

import './admin.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin', 'latin-ext'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: { default: 'Panel', template: '%s · Panel' },
  robots: { index: false, follow: false },
}

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getAdminLang()
  return (
    <html lang={lang} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AdminLangProvider lang={lang}>
            <TooltipProvider delayDuration={200}>
              {children}
              <Toaster richColors position="bottom-center" />
            </TooltipProvider>
          </AdminLangProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
