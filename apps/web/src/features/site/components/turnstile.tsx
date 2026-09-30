'use client'

import Script from 'next/script'
import { useEffect, useRef, useState } from 'react'

type TurnstileApi = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

/**
 * Cloudflare Turnstile widget. Renders nothing without NEXT_PUBLIC_TURNSTILE_SITE_KEY — the API
 * skips verification when its secret is not configured either (local development).
 */
export function Turnstile({ onToken, locale }: { onToken: (token: string | undefined) => void; locale: string }) {
  const container = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(() => typeof window !== 'undefined' && Boolean(window.turnstile))

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !ready || !container.current || !window.turnstile) return
    const id = window.turnstile.render(container.current, {
      sitekey: TURNSTILE_SITE_KEY,
      language: locale,
      callback: (token: string) => onToken(token),
      'expired-callback': () => onToken(undefined),
      'error-callback': () => onToken(undefined),
    })
    return () => window.turnstile?.remove(id)
  }, [ready, locale, onToken])

  if (!TURNSTILE_SITE_KEY) return null
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={() => setReady(true)} />
      <div ref={container} className="min-h-[65px]" />
    </>
  )
}
