import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

/** Sticky top bar of every panel page: sidebar toggle, title and optional actions. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <header className="bg-background/80 sticky top-0 z-10 flex shrink-0 items-center gap-3 border-b px-4 py-3 backdrop-blur md:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="data-[orientation=vertical]:h-5" />
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold md:text-lg">{title}</h1>
        {description && <p className="text-muted-foreground hidden truncate text-sm md:block">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}
