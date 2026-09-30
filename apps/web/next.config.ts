import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  // Lets a production build run next to the dev server without sharing `.next`.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  transpilePackages: ['@rent/shared'],
  experimental: {
    // Handover photos are uploaded through server actions (resized in the browser first).
    serverActions: { bodySizeLimit: '20mb' },
  },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    // Monorepo root: pnpm stores dependencies there.
    root: path.resolve(dirname, '../..'),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
