import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { en } from '@payloadcms/translations/languages/en'
import { tr } from '@payloadcms/translations/languages/tr'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { DEFAULT_LOCALE, LOCALES } from '@rent/shared'

import { CorporateRequests } from './collections/CorporateRequests'
import { Customers } from './collections/Customers'
import { Documents } from './collections/Documents'
import { Extras } from './collections/Extras'
import { Faqs } from './collections/Faqs'
import { Handovers } from './collections/Handovers'
import { Locations } from './collections/Locations'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Penalties } from './collections/Penalties'
import { Reservations } from './collections/Reservations'
import { Seasons } from './collections/Seasons'
import { TransferFees } from './collections/TransferFees'
import { Users } from './collections/Users'
import { VehicleBlocks } from './collections/VehicleBlocks'
import { VehicleCategories } from './collections/VehicleCategories'
import { VehicleModels } from './collections/VehicleModels'
import { Vehicles } from './collections/Vehicles'
import { ExchangeRates } from './globals/ExchangeRates'
import { Settings } from './globals/Settings'
import { jobs } from './jobs'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const localeLabels: Record<(typeof LOCALES)[number], string> = {
  tr: 'Türkçe',
  en: 'English',
  de: 'Deutsch',
  ru: 'Русский',
}

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3050',
  admin: {
    user: Users.slug,
    // Payload's own admin UI is not mounted (no app/(payload)/admin route); staff use the panel at /admin.
    importMap: {
      baseDir: path.resolve(dirname),
      autoGenerate: false,
    },
  },
  i18n: {
    supportedLanguages: { tr, en },
    fallbackLanguage: 'tr',
  },
  localization: {
    locales: LOCALES.map((code) => ({ code, label: localeLabels[code] })),
    defaultLocale: DEFAULT_LOCALE,
    fallback: true,
  },
  collections: [
    Reservations,
    Customers,
    Handovers,
    Penalties,
    CorporateRequests,
    VehicleModels,
    Vehicles,
    VehicleBlocks,
    VehicleCategories,
    Locations,
    Seasons,
    Extras,
    TransferFees,
    Pages,
    Faqs,
    Media,
    Documents,
    Users,
  ],
  globals: [Settings, ExchangeRates],
  jobs,
  // Any SMTP provider works (Resend, Brevo, Mailgun …). Without SMTP_HOST, emails are logged to the console.
  email: process.env.SMTP_HOST
    ? nodemailerAdapter({
        defaultFromAddress: process.env.EMAIL_FROM_ADDRESS || 'no-reply@example.com',
        defaultFromName: process.env.EMAIL_FROM_NAME || 'Rent a Car',
        transportOptions: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: process.env.SMTP_SECURE === 'true',
          auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
        },
      })
    : undefined,
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    // Schema changes go through migrations only (see CLAUDE.md).
    push: false,
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  sharp,
  plugins: [
    // Serverless hosts (Vercel) have no persistent disk: uploads go to Vercel Blob when a token is set.
    // Files are still served through Payload (/api/<collection>/file/…), so access control on documents holds.
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      collections: { media: true, documents: true },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
})
