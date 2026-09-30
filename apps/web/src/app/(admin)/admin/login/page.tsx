import { redirect } from 'next/navigation'

import { getSessionUser } from '@/features/admin/auth/session'
import { LoginForm } from '@/features/admin/auth/login-form'
import { adminTitle, getTranslator } from '@/features/admin/i18n'
import { text } from '@/i18n/admin'
import { getPayloadClient } from '@/lib/payload'

export const generateMetadata = () => adminTitle(text('Login', 'Giriş'))

const copy = {
  tagline: text('Fleet, reservations and customers in one place.', 'Filo, rezervasyon ve müşteriler tek yerde.'),
  quote: text(
    'Every booking, handover and payment — tracked from request to return.',
    'Her rezervasyon, teslim ve ödeme — talepten iadeye kadar kayıt altında.',
  ),
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getSessionUser()) redirect('/admin')
  const [{ t }, { next }, payload] = await Promise.all([getTranslator(), searchParams, getPayloadClient()])
  const settings = await payload.findGlobal({ slug: 'settings', depth: 0 })

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex items-center gap-2 font-semibold">
          <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg text-sm font-bold">
            {settings.companyName.slice(0, 1)}
          </div>
          {settings.companyName}
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <LoginForm redirectTo={next} />
          </div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-zinc-950 lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.35),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.25),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="relative flex h-full flex-col justify-end p-12 text-zinc-100">
          <p className="text-3xl font-semibold tracking-tight">{t(copy.tagline)}</p>
          <p className="mt-4 max-w-md text-zinc-400">{t(copy.quote)}</p>
        </div>
      </div>
    </div>
  )
}
