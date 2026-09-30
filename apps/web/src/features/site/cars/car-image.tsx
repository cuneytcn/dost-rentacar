import Image from 'next/image'

import { cn } from '@/lib/utils'

/** Payload returns absolute media URLs; next/image optimizes them as local files. */
export function mediaSrc(url: string): string {
  try {
    const parsed = new URL(url, 'http://local')
    return parsed.pathname.startsWith('/api/media/file/') ? `${parsed.pathname}${parsed.search}` : url
  } catch {
    return url
  }
}

type Props = { url: string | undefined; alt: string; className?: string; sizes?: string; priority?: boolean }

/** Car photo on a soft tile, or a drawn silhouette until staff upload one. */
export function CarImage({ url, alt, className, sizes = '(min-width: 1024px) 33vw, 100vw', priority }: Props) {
  return (
    <div className={cn('from-brand-50 to-brand-100/70 relative aspect-[3/2] overflow-hidden bg-gradient-to-br', className)}>
      {url ? (
        <Image src={mediaSrc(url)} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <CarSilhouette className="text-brand-300/80 absolute inset-x-[12%] top-1/2 w-[76%] -translate-y-1/2" />
      )}
    </div>
  )
}

export function CarSilhouette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 96" aria-hidden className={className} fill="none">
      <ellipse cx="120" cy="88" rx="104" ry="5" className="fill-brand-900/10" />
      <path
        d="M14 66c0-9 4-14 13-16l30-6 26-17c6-4 12-6 20-6h40c9 0 16 3 22 8l20 17 27 4c9 1 14 7 14 16v6c0 4-3 7-7 7h-14a22 22 0 0 0-43 0H79a22 22 0 0 0-43 0H21c-4 0-7-3-7-7v-6Z"
        fill="currentColor"
      />
      <path d="M92 30c4-3 8-4 13-4h19v20H73l19-16Zm40-4h13c7 0 12 2 17 6l14 14h-44V26Z" className="fill-white/70" />
      <circle cx="57" cy="79" r="15" className="fill-brand-800/80" />
      <circle cx="57" cy="79" r="6" className="fill-brand-100" />
      <circle cx="179" cy="79" r="15" className="fill-brand-800/80" />
      <circle cx="179" cy="79" r="6" className="fill-brand-100" />
    </svg>
  )
}
