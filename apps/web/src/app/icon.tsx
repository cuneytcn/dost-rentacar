import { ImageResponse } from 'next/og'

// Placeholder brand tile until the client's logo arrives (see features/site/layout/brand.tsx).
export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

export function BrandTile({ size: px }: { size: number }) {
  return (
    <div style={{ width: px, height: px, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a4582', borderRadius: px * 0.28 }}>
      <svg width={px * 0.7} height={px * 0.7} viewBox="0 0 32 32">
        <path d="M11 25 15 7h2l4 18" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 11v2.2M16 16.4v2.4M16 22v1.6" stroke="#93b9e8" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  )
}

export default function Icon() {
  return new ImageResponse(<BrandTile size={64} />, size)
}
