# Project rules

Rent-a-car website for a client: public multilingual showcase + reservation flow, admin panel, API-first for a possible future mobile app.

## Language
- **All code is English.** Identifiers, file/folder names, database tables/columns, enum values, API paths, query params, JSON keys, env vars, comments, JSDoc, test names, commit messages, branch names, PR descriptions: English only. No Turkish words, no transliterated Turkish (`arac`, `sube`, `rezervasyon`, `fiyat` …).
- Turkish (and other languages) appears **only as user-facing content**: i18n message files, Payload `label`/`admin.description` translation objects (`{ en, tr }`), localized CMS field values, seed content, email templates' translated strings.
- Domain glossary (use these names): branch → `location`, vehicle group shown on site → `vehicleModel`, physical car (plate) → `vehicle`, class → `vehicleCategory`, add-on service → `extra`, one-way fee → `transferFee`, handover (pickup/return check) → `handover`, corporate/long-term request → `corporateRequest`, receipt of bank transfer → `paymentProof`, traffic fines/tolls → `penalty`.
- Conversation with the user is in Turkish; that does not change any rule above.

## Stack
- pnpm workspaces + Turborepo. `apps/web` = Next.js (App Router) + Payload CMS 3 + PostgreSQL. `packages/shared` = Zod schemas, types, constants shared by web and a future mobile app.
- TypeScript strict everywhere. Zod for all input validation.
- Business logic lives in `apps/web/src/services/` as framework-agnostic functions (no Next/Payload imports in pure logic like pricing). Route handlers, server actions and Payload hooks call services; they don't contain business rules.
- Public API: REST under `/api/v1/...` (Next route handlers in `src/app/(api)`), versioned, documented via OpenAPI generated from Zod. The website uses the same endpoints/services a mobile app would. Payload's auto `/api/<collection>` endpoints stay available (file serving, auth) but the panel uses the Local API.
- DB schema changes go through Payload migrations (`push: false`). Never edit applied migrations; add new ones.
- No online payments: payment is at the office or by bank transfer.
- Exchange rates come only from a licensed API (currently XE Currency Data API, `src/services/exchange-rates.ts`). Never scrape websites or call undocumented/internal endpoints (e.g. xe.com's site APIs): it breaks their terms and silently breaks prices.
- Side effects (emails, SMS, external calls) run as Payload jobs (`src/jobs`), queued with the triggering `req` so they only run after commit.

## Staff panel (/admin)
- Custom shadcn/ui panel replaces Payload's admin UI, which is not mounted at all (no `app/(payload)/admin` route; only Payload's REST/GraphQL API routes remain).
- Most screens are declarative: add/adjust a `ResourceDef` in `features/admin/resources/registry.ts` (columns + form sections); bespoke screens (dashboard, calendar, reservations, customers, media/documents) live in their own feature folders.
- Routes in `apps/web/src/app/(admin)/admin`, code in `apps/web/src/features/admin/<feature>` (`data.ts` server loaders with `server-only`, `*-view.tsx` client components, `actions.ts` server actions).
- All reads/writes go through the Payload Local API with `overrideAccess: false, user` (from `requireStaff()`), so collection access, hooks and validation stay the single source of truth. Never bypass them from the panel.
- UI copy uses `text(en, tr)` + `useT()` / `getTranslator()`; no hardcoded strings. Use shadcn components from `@/components/ui` (they import `cn` from `@/lib/utils`, i.e. tailwind-merge). Each root layout loads its own stylesheet (`admin.css`, `site.css`).
- Layout symmetry rules: one kind of content per table column; numbers/money right-aligned in their own column; statuses in tables/lists are dot + label (`StatusText`), left-aligned, each in its own column (never stacked under a number); boxed badges only where they stand alone (page headers); two-line cells = primary line + muted secondary line, applied consistently across a row; cards in the same row have equal height; action buttons live in the page header, destructive actions in the "…" menu.
- Dates and times use `DatePicker` / `DateTimePicker` / `TimeSelect` / `DateRangePicker` from `features/admin/shared/date-picker.tsx` (shadcn Calendar + Popover, panel language). Never native `type="date|datetime-local|time"` inputs.
- URLs follow the panel language: route folders and links in code stay English, `features/admin/routes.ts` maps segments to Turkish and `proxy.ts` rewrites/redirects. Every new route segment needs an entry there. Page titles use `generateMetadata = () => adminTitle(text(en, tr))`.
- Reservation status is shown as the desk's next step + moment (`reservations/status.ts`), and payment as money still owed, not as raw enum words.
- Verify every screen in the browser (light and dark) before calling it done.

## Public site
- Routes in `app/(frontend)/[locale]` (the root layout lives there), code in `features/site`. Pages call the same services as the public API through `features/site/data.ts`; client components call `/api/v1/*` via `features/site/api.ts`.
- Languages tr/en/de/ru. **Turkish is the default and has no URL prefix** (`/araclar`); other languages are prefixed (`/en/cars`). No automatic redirect by browser language. Route folders are English; `features/site/routes.ts` localizes the first segment and `proxy.ts` rewrites/redirects. Build links with `href()` from `useSite()` / `getSiteKit()` (or `sitePath`), never by hand.
- Copy lives in `features/site/i18n/messages/{en,tr,de,ru}.ts`; `en.ts` defines the shape, so every language must have every key. Russian plurals use `plural({ one, few, many, other })`. Avoid Turkish sentences where a placeholder needs a suffix (`{city}’da`, `{price}’den`).
- Prices are stored and quoted in the base currency (**TRY**, settings); the site shows them in the visitor's currency (cookie, default TRY) via `price()`. Converted amounts are approximate and say so. `pnpm rebase-currency <CODE>` converts catalog prices if the base currency ever changes.
- The search form only offers days/times when the chosen office is open (and after the minimum notice), using `@rent/shared/opening-hours` — the same `isOpenAt` the server rules use. Keep booking rules shared so the UI never offers what the API rejects.
- Checkboxes inside forms sit next to their `<label htmlFor>`, never inside it (Radix re-dispatches the click and a wrapping label bounces it back → React flushSync error).
- Light theme only (brand navy/blue tokens in `site.css`); `dark:` variants are disabled there. Mobile-first, check 390px width.
- Legal pages are CMS pages with the slugs `rental-terms`, `privacy-policy`, `cookie-policy` (localized URLs in `routes.ts`), seeded from `src/scripts/legal/*` with `pnpm seed:legal` (`SEED_FORCE=1` overwrites). CMS texts may use `{{legalName}}`, `{{cancelHours}}` … placeholders filled from Settings (`contentTokens`). If analytics/marketing cookies are ever added, update the cookie policy and add a consent banner.
- Vehicle photos must be licensed: our own, purchased stock, or openly licensed (CC0/CC BY/CC BY-SA, never NC/ND) with the author and licence in the media `credit` field, shown under the photo. `pnpm vehicle-photos` imports the Commons set in `src/scripts/import-vehicle-photos.ts`. Never download manufacturer or random web images.
- The client is **Dost Rent a Car** (one office in Menemen/İzmir). Business details live in `src/scripts/data/company.ts` (seed + `pnpm company-profile`); FAQs in `src/scripts/data/faqs.ts` (`pnpm seed:faqs`, matched by Turkish question).
- `payload run` does not forward CLI flags to scripts; script options come from environment variables.

## SEO
- Target: local searches around the office ("Menemen rent a car / araç kiralama") and the delivery districts. Each service area in `features/site/service-areas.ts` has its own page (`/arac-kiralama/foca`, `/en/car-rental/foca` …) with content written for that place — never add areas as copied text (doorway pages). Only promise services the business really offers (delivery to nearby districts yes, airport no).
- Every page sets title/description via `generateMetadata` (layout template appends the brand), canonical + hreflang via `alternatesFor`. Structured data lives in `features/site/structured-data.tsx` (AutoRental business, Product/Car, BreadcrumbList, FAQPage). Do not add review/rating markup unless reviews are collected on the site.
- Search Console / Yandex verification via `GOOGLE_SITE_VERIFICATION` / `YANDEX_VERIFICATION`.

## Rental regulation (Motorlu Kara Taşıtlarının Kiralanması Hakkında Yönetmelik, RG 15.08.2026, in force 01.01.2027)
- Deposit cap: ≤ 3 days' rent for 1–6 day rentals, ≤ 7 days' rent for 7–29 days (`capDeposit` in `services/pricing.ts`); card authorisation only; released within 7 days.
- Free cancellation until 24 h before pick-up; late returns up to 1 hour are free (settings default `graceMinutes` 60); basic insurance included in the rent, extras never mandatory; lower segment only with consent.
- The rental authorisation number (`authorizationNumber` in Settings) must be shown online (footer + contact page).

## Conventions
- Money: store as integer minor units (cents) + ISO 4217 currency code. Never floats for money.
- Dates: store UTC (`timestamptz`); convert to location timezone (`Europe/Istanbul`) only for display/business-day math.
- Collection slugs kebab-case plural (`vehicle-models`), field names camelCase.
- Tests: Vitest; pricing/availability services must have unit tests.
- Run `pnpm lint`, `pnpm typecheck`, `pnpm test` before declaring work done.
