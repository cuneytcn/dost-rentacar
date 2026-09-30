import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { CarSilhouette } from '@/features/site/cars/car-image'
import { getMessages } from '@/features/site/i18n/server'
import { sitePath } from '@/features/site/routes'
import { DEFAULT_LOCALE } from '@rent/shared/constants'

// not-found receives no params; the default language is the safest choice for its copy.
export default function NotFound() {
  const m = getMessages(DEFAULT_LOCALE)
  return (
    <section className="container-site flex flex-col items-center py-20 text-center sm:py-28">
      <CarSilhouette className="text-brand-200 w-48" />
      <p className="text-brand-500 mt-8 text-sm font-bold tracking-widest">404</p>
      <h1 className="text-brand-950 mt-2 text-3xl font-extrabold sm:text-4xl">{m.notFound.title}</h1>
      <p className="text-muted-foreground mt-3 max-w-md">{m.notFound.text}</p>
      <Button asChild className="mt-8 h-11 rounded-full px-6 font-bold">
        <Link href={sitePath(DEFAULT_LOCALE)}>{m.notFound.home}</Link>
      </Button>
    </section>
  )
}
