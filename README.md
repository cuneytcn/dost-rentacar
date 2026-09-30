# Dost Rent a Car

Multilingual rent-a-car website, admin panel and public REST API (web + future mobile app).

- `apps/web` — Next.js 16 + Payload CMS 3 (custom shadcn staff panel at `/admin`, public API at `/api/v1`)
- `packages/shared` — Zod schemas, types and constants shared by web and mobile

## Local setup

```bash
pnpm install
pnpm db:up                         # PostgreSQL 17 on localhost:5433
cp apps/web/.env.example apps/web/.env   # set PAYLOAD_SECRET
pnpm --filter @rent/web migrate
pnpm --filter @rent/web seed       # demo data + admin user (credentials printed)
pnpm dev                           # http://localhost:3050
```

Checks: `pnpm lint && pnpm typecheck && pnpm test`

Content for a fresh database: `pnpm --filter @rent/web demo:setup` (seed, company profile, legal pages, FAQs, vehicle texts and photos, demo login in `apps/web/.demo-credentials`).

## Demo deployment (Vercel)

1. **Project:** import the repo in Vercel, Root Directory `apps/web`, Build Command `pnpm run ci` (runs migrations, then `next build`).
2. **Storage:** in the project's Storage tab add a Postgres database (Neon) and a Blob store; Vercel sets `DATABASE_URL`/`POSTGRES_URL` and `BLOB_READ_WRITE_TOKEN`. Use the pooled connection string as `DATABASE_URL`.
3. **Environment variables:** `PAYLOAD_SECRET` (`openssl rand -hex 32`), `NEXT_PUBLIC_SERVER_URL` (the deployment URL), `JOBS_AUTORUN=false` (serverless functions can't run the in-process job queue; scheduled jobs need a long-running server or a cron trigger in production).
4. **Data:** from `apps/web`, with the same `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `PAYLOAD_SECRET` and `NEXT_PUBLIC_SERVER_URL` in the environment, run `pnpm demo:setup`.

Limits on Vercel: request bodies are capped at 4.5 MB (handover photos are resized in the browser but many at once can exceed it), and background jobs (emails, exchange rates, reminders) do not run. For production a long-running server (VPS/Docker) is recommended.

## Data model

| Area | Collections |
|---|---|
| Fleet | `locations`, `vehicle-categories`, `vehicle-models` (what customers book, holds rate tiers), `vehicles` (plates), `vehicle-blocks` (maintenance) |
| Pricing | rate tiers on `vehicle-models`, `seasons` (% adjustment, min days), `extras`, `transfer-fees` (one-way) |
| Operations | `customers`, `reservations`, `handovers` (pickup/return check), `penalties` (tolls, fines, damage), `corporate-requests` |
| Content | `pages`, `faqs`, `media` (public images), `documents` (private files) |
| Globals | `settings` (company, currency, bank accounts, booking rules), `exchange-rates` |

Key rules:
- Money is stored in integer minor units of the base currency (`settings.baseCurrency`); other currencies are display-only via `exchange-rates`.
- Reservation lifecycle: `pending → confirmed → active → completed` (or `cancelled` / `no_show`). Pickup/return handovers move the status and update vehicle mileage and location.
- A vehicle can never be double-booked: application checks (with a buffer between rentals) plus a PostgreSQL exclusion constraint (`reservations_vehicle_no_overlap`).
- Public bookings run in a transaction with an advisory lock per model and location, so concurrent requests can't oversell.

## Admin panel

- Dashboard: pending / unassigned reservations, today's pickups and returns, new corporate requests, vehicle documents expiring within 30 days.
- Occupancy calendar (`/admin/calendar`): per-vehicle timeline of reservations and maintenance blocks, plus reservations still waiting for a vehicle. Staff only see their locations.
- Reservations: list with status tabs and filters, detail with confirm / assign vehicle / payments / pickup & return (photos) / cancel, and phone/walk-in booking with live availability and prices.
- Fleet, pricing, content and system screens are generated from `features/admin/resources/registry.ts`; translations are edited per language (TR/EN/DE/RU).
- Buttons follow the user's Payload access rules (e.g. branch staff get read-only screens where they can't edit).
- Money fields are entered as decimals (45,50) and stored in minor units.

## Background jobs

Payload's job queue runs inside the Next.js server (`apps/web/src/jobs`), polled every 30 s:

| Task | Trigger |
|---|---|
| `sendReservationNotification` | reservation created / confirmed / cancelled (customer email in their language, staff email in Turkish, SMS on confirm) |
| `sendCorporateRequestNotification` | new corporate request (staff) |
| `sendPickupReminders` | hourly: confirmed pickups in the next 24 h (email + SMS, once) |
| `refreshExchangeRates` | every 5 minutes from the XE Currency Data API |
| `sendVehicleDocumentReminders` | daily 05:00 server time: insurance / casco / inspection 30, 14, 7, 3, 1, 0 days before expiry and daily once expired |

Configuration lives in `apps/web/.env` (see `.env.example`): SMTP for email (console output when empty), `SMS_PROVIDER` (console only for now), `XE_ACCOUNT_ID` / `XE_API_KEY` (rate refresh is skipped when empty). Staff recipients are set in the admin panel under Settings → Notifications.

## Public API

OpenAPI 3.1 document: `GET /api/v1/openapi.json`. Responses are `{ data }` or `{ error: { code, message, details } }`.
