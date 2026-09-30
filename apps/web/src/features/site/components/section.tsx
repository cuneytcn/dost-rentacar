import { cn } from '@/lib/utils'

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  action,
  className,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  align?: 'left' | 'center'
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', align === 'center' && 'items-center text-center sm:flex-col sm:items-center', className)}>
      <div className={cn('max-w-2xl space-y-3', align === 'center' && 'mx-auto')}>
        {eyebrow && <p className="text-brand-500 text-sm font-bold tracking-wide uppercase">{eyebrow}</p>}
        <h2 className="text-brand-950 text-3xl font-extrabold sm:text-4xl">{title}</h2>
        {subtitle && <p className="text-muted-foreground text-base leading-relaxed sm:text-lg">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

/** Page intro band used by inner pages. */
export function PageHero({ eyebrow, title, subtitle, children }: { eyebrow?: string; title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <section className="bg-surface border-b">
      <div className="container-site py-10 sm:py-14">
        <div className="max-w-3xl space-y-3">
          {eyebrow && <p className="text-brand-500 text-sm font-bold tracking-wide uppercase">{eyebrow}</p>}
          <h1 className="text-brand-950 text-3xl font-extrabold sm:text-5xl">{title}</h1>
          {subtitle && <p className="text-muted-foreground text-base leading-relaxed sm:text-lg">{subtitle}</p>}
        </div>
        {children}
      </div>
    </section>
  )
}
