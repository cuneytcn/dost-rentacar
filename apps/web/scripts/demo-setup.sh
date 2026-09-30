#!/bin/sh
# Fills a fresh demo database (e.g. the Vercel/Neon one) with everything the site needs.
# Usage (from apps/web): DATABASE_URL=… BLOB_READ_WRITE_TOKEN=… PAYLOAD_SECRET=… NEXT_PUBLIC_SERVER_URL=https://… pnpm demo:setup
set -e
pnpm migrate
pnpm seed
pnpm company-profile
pnpm seed:legal
pnpm seed:faqs
pnpm seed:vehicle-texts
pnpm vehicle-photos
pnpm demo-user
echo "Demo data ready. Login details: apps/web/.demo-credentials"
