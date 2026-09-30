'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

import { cn } from '@/lib/utils'

import { useSite } from '../site-context'
import { CarImage, mediaSrc } from './car-image'

type Credit = { text: string; url: string | null } | null

export function CarGallery({ images, credits, alt }: { images: string[]; credits: Credit[]; alt: string }) {
  const { m } = useSite()
  const [active, setActive] = useState(0)
  const credit = credits[active]
  return (
    <div className="space-y-3">
      <figure className="space-y-2">
        <div className="group relative">
          <CarImage url={images[active]} alt={alt} priority sizes="(min-width: 1024px) 720px, 100vw" className="rounded-3xl border" />
          {images.length > 1 && (
            <>
              {[
                { step: -1, icon: ChevronLeft, side: 'left-3' },
                { step: 1, icon: ChevronRight, side: 'right-3' },
              ].map(({ step, icon: Icon, side }) => (
                <button
                  key={step}
                  type="button"
                  aria-label={`${alt} ${((active + step + images.length) % images.length) + 1}`}
                  onClick={() => setActive((current) => (current + step + images.length) % images.length)}
                  className={cn(
                    'text-brand-900 absolute top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur transition-opacity hover:bg-white sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100',
                    side,
                  )}
                >
                  <Icon className="size-5" />
                </button>
              ))}
              <span className="absolute right-3 bottom-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white tabular-nums">
                {active + 1} / {images.length}
              </span>
            </>
          )}
        </div>
        {credit && (
          <figcaption className="text-muted-foreground text-right text-xs">
            {m.car.photoCredit}:{' '}
            {credit.url ? (
              <a href={credit.url} target="_blank" rel="noopener noreferrer" className="hover:text-brand-700 underline underline-offset-2">
                {credit.text}
              </a>
            ) : (
              credit.text
            )}
          </figcaption>
        )}
      </figure>
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-3">
          {images.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`${alt} ${index + 1}`}
              aria-pressed={index === active}
              className={cn(
                'relative aspect-[3/2] overflow-hidden rounded-xl border-2 transition-colors',
                index === active ? 'border-brand-500' : 'hover:border-brand-200 border-transparent',
              )}
            >
              <Image src={mediaSrc(url)} alt="" fill sizes="140px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
