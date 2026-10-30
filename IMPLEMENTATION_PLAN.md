# SlotWise Implementation Plan

SlotWise is a single-business appointment manager for service businesses. This file is the working checklist for the MVP and the record of what was completed and verified. Last verified: **2026-10-30**.

## Product scope

- [x] Separate, empty SlotWise workspace (not StockPilot, no reused database)
- [x] Next.js 16 App Router + React 19 + strict TypeScript + Tailwind v4 + shadcn/ui
- [x] Supabase PostgreSQL + Auth via `@supabase/ssr`
- [x] One business per authenticated owner; staff and customers are managed records (no staff login)
- [x] Out-of-scope features excluded (payments, SMS, public self-booking, calendar sync, multi-business)

## 1. Foundation

- [x] App scaffold, cleanup of template assets
- [x] Design tokens: neutral canvas, navy navigation, teal accent, status palette
- [x] Typography (Plus Jakarta Sans + Instrument Serif), responsive app shell, mobile navigation
- [x] Shared UI primitives from shadcn/ui, page header, empty/error/loading states
- [x] Environment validation (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`)
- [x] Local Supabase config, `.env.example`, `.gitignore`

## 2. Database and security

- [x] `business_settings` with owner PK and timezone validation
- [x] `customers`, `services`, `staff` with ownership and archive flags
- [x] `staff_working_hours` (one interval per ISO weekday) and `staff_time_off` (non-overlapping)
- [x] `appointments` with snapshots, history events, composite tenant-safe foreign keys, scheduling indexes
- [x] `btree_gist` exclusion constraint for active appointments (half-open ranges, boundary-safe)
- [x] RLS on every table with explicit per-operation policies; appointments read-only to clients
- [x] SECURITY DEFINER RPCs with empty search path: create, reschedule, status transition, staff hours
- [x] Server-side validation of ownership, active records, working hours, time off, future start
- [x] Sign-up trigger creates default business settings
- [x] Database privileges hardened (no direct appointment writes, no anon access)

## 3. Authentication

- [x] Email/password sign-in and sign-up with helpful errors and business-name capture
- [x] Cookie-based SSR session handling in `proxy.ts` plus server-side route protection
- [x] `/auth/callback` PKCE exchange with safe redirects
- [x] Email-confirmation state handling and sign-out
- [x] Authenticated-only app layout; public landing/auth routes

## 4. Management

- [x] Customers: search, create, edit, archive/reactivate, detail with appointment history
- [x] Services: search, create, edit, active/inactive, validation
- [x] Staff: search, create, edit, active/inactive, detail page
- [x] Staff weekly working hours editor (one interval per weekday)
- [x] Staff time-off list/add with overlap protection
- [x] Settings: business name, timezone, currency, sign-out

## 5. Scheduling

- [x] Timezone utilities: wall-clock to instant, DST validation, business-day boundaries, ISO weekdays
- [x] Availability calculation: working hours, existing appointments, time off, past slots
- [x] Booking form with customer/service/staff/date/slot, duration, end time, price preview
- [x] Server actions for create/reschedule with clear conflict messages
- [x] Appointment list with search, filters, pagination, mobile cards
- [x] Appointment detail with snapshots, event timeline, guarded status actions
- [x] Edit/reschedule page with server revalidation
- [x] Status workflow and timing rules enforced server-side
- [x] Calendar day/week/month, staff filter, status colors, mobile agenda, navigation

## 6. Insights

- [x] Dashboard with real metrics: today, upcoming, completed, cancelled, revenue, status/service summaries
- [x] Upcoming schedule, recent customers, empty states
- [x] Reports with date range, status/service/staff summaries, revenue
- [x] CSV exports with escaping and auth scoping

## 7. Verification

- [x] Unit tests: statuses, duration/end, hours, timezone/DST, overlaps, reports, CSV, validation, safe redirects
- [x] Integration tests on local Supabase: create/snapshot, hours, time off, overlap, adjacency, concurrency, RLS, direct writes, transitions, rollback
- [x] `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`
- [x] Browser smoke test on desktop and mobile widths
- [x] Security review and requirement-by-requirement audit

## 8. Documentation and handoff

- [x] README: product, architecture, schema, setup, testing, security model, limitations
- [x] Local Supabase and migration commands
- [x] Vercel manual setup, callback URLs, smoke-test checklist
- [x] Honest final report: files, features, test/build results, unverified items, manual steps

## Verification log

Commands run on 2026-10-30 from the project root:

| Command | Result |
| --- | --- |
| `npm run lint` | pass, no warnings |
| `npm run typecheck` | pass |
| `npm test` | 101 tests in 10 files passed |
| `npm run test:integration` | 11 tests passed against local Supabase at `127.0.0.1:54421` |
| `npm run build` | compiled successfully; 20 app routes |

Browser smoke tests used headless Chrome over CDP at 1440×1000 and 390×844:

- All 16 desktop views and 15 mobile views rendered with the expected headings; **zero console errors** and **zero horizontal overflow**.
- Auth: unauthenticated private routes redirect to `/login?next=…`; `/auth/callback` without a code redirects to `/login?error=missing_code`; sign-out clears the session.
- Signup: a fresh owner reaches the dashboard with the entered business name and default `Asia/Kuala_Lumpur` / `MYR` settings; no console errors.
- Malformed or unknown record IDs (`/appointments/…`, `/customers/…`, `/staff/…`, edit route) render the in-app 404 page instead of the error boundary.
- Settings: currency round-trips (USD → MYR persisted after reload); timezone change persists and can be reverted.
- Time off: client validation (`end > start`), creation, overlap rejection (`23P01`), availability drop from 30 to 26 slots with the 09:00–09:45 starts blocked, deletion, and availability restored to 30 slots.
- Mobile navigation sheet opens and exposes every section.
- Test-only CDP scripts and captures live in `.screens/` (ignored).

Security review summary:

- App code references only the publishable key; grep confirms no service-role credential in `src/`.
- Appointment/event tables grant `select` only to `authenticated`; direct insert/update/delete returns `42501` (integration-tested).
- Cross-tenant reads, updates, and RPC lookups are blocked (integration-tested with two real tenants).
- `anon` cannot select or execute appointment RPCs (integration-tested).
- RLS is enabled on all eight tables; policies are per-operation and owner-scoped.
- Redirects are validated against protocol-relative and off-site targets; CSV output prefixes formula-leading values.
- No hosted project, remote link, commit, push, or deployment was performed.

## Intentionally not verified here

- Hosted Supabase and Vercel deployment, production SMTP/email confirmation, and the production callback URL — left to the owner by instruction.
- Safari, Firefox, and physical mobile devices; the smoke tests used headless Chromium only.
- Automated accessibility tooling (axe/Lighthouse) and a committed E2E suite.
- High-volume report exports and long-running production workloads.

## Known MVP limitations

- One working interval per staff member per weekday.
- Business hours may not cross midnight; appointments must fit inside a single day's interval.
- Staff do not have separate logins; one owner per business.
- Email confirmations are disabled for local development; enable them in hosted Supabase.
- No payments, notifications, recurring appointments, external calendars, or public booking.
- Report CSVs are assembled in memory for the selected range.
- Changing the business time zone changes display and report boundaries for historical instants; stored instants do not move.
