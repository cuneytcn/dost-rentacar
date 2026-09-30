import { WHATSAPP_PATH } from './social-icon'

export function whatsappUrl(number: string, text?: string): string {
  const digits = number.replace(/\D/g, '')
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

export function WhatsappIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d={WHATSAPP_PATH} />
    </svg>
  )
}

export function WhatsappButton({ number, label }: { number: string; label: string }) {
  return (
    <a
      href={whatsappUrl(number)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="fixed right-4 bottom-4 z-30 flex size-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-lg shadow-black/15 transition-transform hover:scale-105 focus-visible:ring-4 focus-visible:ring-[#25d366]/40 sm:right-6 sm:bottom-6"
    >
      <WhatsappIcon className="size-7" />
    </a>
  )
}
