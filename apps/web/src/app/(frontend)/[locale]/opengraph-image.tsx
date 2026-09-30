import { ImageResponse } from 'next/og'

import { getLocations, getSiteSettings } from '@/features/site/data'
import { isLocale } from '@/features/site/routes'
import { BASE_AREA } from '@/features/site/service-areas'

import { BrandTile } from '../../icon'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Rent a Car'

/** Default social sharing image. Text stays in Latin script so the bundled font covers every language. */
export default async function OpengraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = isLocale(raw) ? raw : 'tr'
  const [settings, locations] = await Promise.all([getSiteSettings(locale), getLocations(locale)])
  const place = `${BASE_AREA.name.tr} · ${locations[0]?.city ?? ''}`

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: 'linear-gradient(135deg, #0f2649 0%, #1a4582 60%, #2f6fc0 100%)', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <BrandTile size={88} />
          <div style={{ fontSize: 52, fontWeight: 800 }}>{settings.companyName}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>{`Rent a Car · ${place}`}</div>
          <div style={{ fontSize: 34, color: '#c5d9f4' }}>{settings.phone ?? ''}</div>
        </div>
      </div>
    ),
    size,
  )
}
