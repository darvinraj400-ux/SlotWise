# SlotWise

SlotWise is a single-business appointment and customer management workspace for service businesses — salons, studios, repair shops, clinics, and consultants. It keeps bookings, staff schedules, customer records, and day-to-day revenue in one considered interface.

One authenticated owner manages one business. Staff members are scheduling resources, not users. Every number shown in the product is calculated from the owner's own appointment data.

> This repository was built and verified locally only. No hosted Supabase project was created, no remote was linked, nothing was deployed, and no live URL exists. See [Deployment](#deployment-manual-not-performed).

## Highlights

- **Booking that cannot double-book.** A PostgreSQL `btree_gist` exclusion constraint on half-open time ranges rejects overlapping active appointments, while a `SECURITY DEFINER` RPC revalidates ownership, active records, working hours, time off, and future start time inside the same transaction.
- **Time-zone honest.** All wall-clock inputs are converted through the business time zone (`@date-fns/tz`), ISO weekdays drive schedules, and DST transitions are covered by unit tests.
- **A calendar as the centrepiece.** Day, week, and month views with staff filtering, status colours, overlap lanes, keyboard-reachable blocks, and a mobile agenda.
- **Real reports.** Status, service, staff, revenue, and average ticket are derived from appointment price snapshots; CSV exports escape quotes and neutralise spreadsheet formula injection.
- **Tenant-safe by construction.** Row level security plus composite foreign keys keyed on `user_id`; the browser client carries only the publishable key. Appointments and their history are read-only to clients — every write goes through a validated RPC.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack, Server Actions, `proxy.ts`) |
| UI | React 19, strict TypeScript, Tailwind CSS v4, shadcn/ui primitives, Lucide |
| Data | Supabase PostgreSQL + Auth via `@supabase/ssr` |
| Validation | Zod, React Hook Form |
| Charts | Recharts |
| Tests | Vitest, plus integration tests against a real local Supabase stack |

## Local development

### Prerequisites

- Node.js 20.9+ (verified on Node 24.18)
- Docker Desktop (for the local Supabase stack)
- npm

### 1. Install

```bash
npm install
```

### 2. Start the local database

```bash
npm run db:start
```

This project pins its local Supabase ports in `supabase/config.toml` (API `54421`, database `54422`, Studio `54423`, mail `54424`), so it can run alongside another Supabase stack without collisions. It also keeps `supabase/.temp/` and local data out of source control.

Local email confirmations are disabled, so a new sign-up can sign in immediately. Seed data is intentionally empty.

### 3. Configure the app

```bash
cp .env.example .env.local
```

Fill the values using `npm run db:status` (or `npx supabase status -o env`):

- `NEXT_PUBLIC_SUPABASE_URL` — the local API URL, e.g. `http://127.0.0.1:54421`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — the local publishable/anon key
- `NEXT_PUBLIC_SITE_URL` — `http://localhost:3000` for local development

`NEXT_PUBLIC_SITE_URL` is resolved by `src/lib/site-url.ts`. In development it is optional and falls back to `http://localhost:3000`; in production it is required unless a Vercel preview provides `VERCEL_URL`. The value must be an `http`/`https` origin with no path, query, hash, or credentials. Production builds fail fast rather than silently generating localhost auth redirects.

| Variable | Local development | Vercel Production | Vercel Preview |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Required | Required | Required |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Required | Required | Required |
| `NEXT_PUBLIC_SITE_URL` | Optional (localhost fallback) | Required — canonical `https` origin | Optional — falls back to `https://$VERCEL_URL` |

For preview deployments that use the `VERCEL_URL` fallback, add a matching preview redirect URL (for example a wildcard for the project's Vercel domain) in Supabase Auth. Set the production Site URL to the canonical custom domain. Do not put service-role or secret keys in any `NEXT_PUBLIC_*` variable.

`.env.local` is ignored by `.gitignore`; never commit real keys. The app only needs the publishable key. The service-role key is used by the integration-test runner for local fixtures and cleanup, never by application code.

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000, create an account, then add services and staff before booking. Completing onboarding manually is the intended flow; there is no demo data.

### Useful commands

| Command | Purpose |
| --- | --- |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit tests (Vitest) |
| `npm run test:integration` | Integration tests against local Supabase |
| `npm run test:responsive` | Headless Chrome dashboard overflow check at 320–1280px (needs a local account; see below) |
| `npm run build` | Production build |
| `npm run db:reset` | Re-apply migrations to the local database (destructive, local only) |
| `npm run db:types` | Regenerate `src/lib/supabase/database.types.ts` from the local schema |
| `npm run db:status` | Show local stack status and keys |

`npm run test:responsive` drives headless Chrome against `SLOTWISE_BASE_URL` (default `http://localhost:3000`). Set `SLOTWISE_E2E_EMAIL` and `SLOTWISE_E2E_PASSWORD` for a local account, and `CHROME_PATH` if Chrome is not in its default Windows location. The script refuses non-local hosts so credentials are never sent off-machine.

## Routes

Public: `/`, `/login`, `/signup`, `/auth/callback`.
Authenticated: `/dashboard`, `/calendar`, `/appointments`, `/appointments/new`, `/appointments/[id]`, `/appointments/[id]/edit`, `/customers`, `/customers/[id]`, `/services`, `/staff`, `/staff/[id]`, `/reports`, `/settings`, plus `/reports/export` for CSV.

`src/proxy.ts` refreshes the Supabase session on every request, redirects unauthenticated visitors of private routes to `/login?next=…`, and sends authenticated users away from the auth pages. Server layouts and data access repeat the guard — the proxy is never the only line of defence. Post-login redirects are validated by `safeRedirectPath`, which rejects protocol-relative URLs, backslashes, control characters, and auth routes.

## Architecture

```
src/
  app/
    (app)/            authenticated shell + all workspace routes
    (auth)/           login and signup
    auth/callback/    PKCE code exchange
    page.tsx          public landing page
  components/
    app/              shell, dialogs, empty/error states, navigation
    appointments/     booking form and status actions
    calendar/         toolbar, views, mobile agenda
    customers/ services/ staff/ settings/ marketing/ auth/
    ui/               shadcn/ui primitives
  lib/
    actions/          server actions (Zod validation → RPC / scoped writes)
    data/             read queries scoped by RLS and owner id
    appointments/     availability, duration maths, overlap layout, status rules
    time.ts           wall-clock ↔ instant, business-day bounds, ISO weekdays
    reports.ts        metric aggregation
    csv.ts            escaping and formula-injection protection
    supabase/         browser/server/proxy clients and generated types
    errors.ts         action result types, SQLSTATE mapping, safe logging
```

**Reads** use the request-scoped Supabase client, so RLS and explicit `user_id` filters both apply. **Writes** to directory records go through server actions with Zod validation and ownership filters. **Appointment writes** have no grant at all: the client calls `create_appointment`, `reschedule_appointment`, or `transition_appointment_status`, which recompute durations and prices from current records and insert a price snapshot.

**Availability** is computed server-side from working hours, active appointments, time off, and the current instant, then rendered as slot buttons. The same rules are enforced again in the RPC inside the database transaction, so a stale UI cannot create an invalid booking.

**Time** is stored as `timestamptz`. Local wall-clock values are resolved to exact instants in the configured business time zone; appointment end times are calculated from the service duration on the server. Report ranges and calendar days use business-zone boundaries.

### Status workflow

```
pending ──▶ confirmed ──▶ in_progress ──▶ completed
   │            │  │
   ▼            ▼  ▼
cancelled    cancelled  no_show
```

Terminal states are closed. `in_progress` is allowed from 15 minutes before the scheduled start until the end; `no_show` only from the scheduled start. The rules are enforced in both the UI and the RPC (`SW007`).

## Database and security model

Eight tables: `business_settings`, `customers`, `services`, `staff`, `staff_working_hours`, `staff_time_off`, `appointments`, `appointment_events`. Every table carries `user_id`; child tables use composite foreign keys such as `(staff_id, user_id)` so a row can never reference another tenant's record.

- RLS is enabled on every table. Policies are explicit per operation; appointments and appointment events are select-only for authenticated owners, and no table is readable or writable by `anon`.
- `btree_gist` exclusion constraints use half-open `tstzrange` values: back-to-back appointments are allowed, cancelled/completed/no-show bookings release the slot, and time-off windows cannot overlap for the same staff member.
- `staff_working_hours` allows one interval per ISO weekday, with `start_time < end_time`. `replace_staff_working_hours` swaps a weekly schedule atomically.
- RPCs are `SECURITY DEFINER` with `search_path = ''`, re-check ownership for every referenced record, and surface specific SQLSTATEs (`SW001`–`SW007`) that the UI maps to human messages.
- Privileges are least-privilege: `revoke all` first, then the minimum grants. Only the three appointment RPCs and the staff-hours RPC are executable by `authenticated`; helper functions are revoked from everyone.
- The app uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` only. Service-role credentials never enter application code or the browser bundle.

### Migrations

| File | Contents |
| --- | --- |
| `20261027120000_foundation.sql` | extensions, timezone validation, updated-at helper, business settings, sign-up trigger |
| `20261027120100_directory.sql` | customers, services, staff, working hours, time off, indexes |
| `20261027120200_appointments.sql` | appointments, snapshots, history, exclusion constraints, indexes |
| `20261027120300_rls.sql` | RLS policies, grants, read-only appointment surface |
| `20261027120400_appointment_rpcs.sql` | slot validation, create, reschedule, status transitions |
| `20261027120500_staff_configuration.sql` | atomic weekly-hours replacement |

## Testing

Run at the end of development on 2026-10-30:

| Check | Result |
| --- | --- |
| `npm run lint` | clean |
| `npm run typecheck` | clean |
| `npm test` | **116 passing** across 12 files |
| `npm run test:integration` | **11 passing** against local Supabase, real database and RLS |
| `npm run build` | succeeds; 20 routes compiled |
| Browser smoke (headless Chromium) | 15 routes at 1440×1000 and 390×844 with no page overflow, console errors, or auth regressions; dashboard at 320/360/390/430/768/1280 widths measured 0px horizontal overflow with seeded long-label data |
| Detail-screen responsiveness | appointment, customer, staff, and settings screens measured 0px horizontal overflow at 320, 360, 390, 430, and 1280px with seeded long-label data; long emails wrap in place rather than truncating |
| `npm run test:responsive` | logs in with `SLOTWISE_E2E_EMAIL`/`SLOTWISE_E2E_PASSWORD` against a local build, then asserts `scrollWidth <= clientWidth` on `/dashboard` at 320, 360, 390, 430, 768, and 1280px |
| Reports limit | a 20,001-row range shows an explicit "too large" state, hides partial totals/export, and `/reports/export` returns `413` without an attachment |
| Security headers | local production responses include `nosniff`, `DENY`, referrer and permissions policies, production-only HSTS, and no `X-Powered-By` |

Unit coverage includes DST/time-zone conversion, business-day boundaries, ISO weekdays, duration and end-time maths, availability, overlap lane layout, status timing, report aggregation, CSV escaping and formula injection, Zod schemas, safe redirects, SQLSTATE mapping, appointment range pagination boundaries, the report row limit, and site URL resolution for development, production, and Vercel previews.

Integration coverage uses two real tenants and asserts: default settings and privacy; cross-tenant reads/updates/RPCs rejected; direct appointment, event, and anon access denied; snapshot creation and immutability; back-to-back success; overlap rollback (`SW001`); cancellation freeing a slot; past/outside-hours/time-off/inactive/cross-tenant validation (`SW002`–`SW006`); exactly-one-winner concurrent booking; reschedule conflict rollback and event history; the full transition matrix and timing windows; time-off overlap and adjacency; and atomic weekly-hours rollback.

The integration runner refuses non-local Supabase hosts and passes test-only credentials from `supabase status` to Vitest.

## Deployment (manual, not performed)

Nothing below was executed in this workspace. These are the steps for the owner to publish on their own infrastructure.

1. **Create a hosted Supabase project** (manually, in the Supabase dashboard). Do not reuse another app's project.
2. **Apply migrations** with `supabase link --project-ref <ref>` and `supabase db push`, or run the six files in order in the SQL editor. Verify RLS is enabled on all eight tables.
3. **Auth settings:** set the Site URL to the production origin, add `https://<your-domain>/auth/callback` as a redirect URL, and enable email confirmations. Configure SMTP before relying on sign-up emails.
4. **Vercel:** import the repository. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for Production and Preview. Set `NEXT_PUBLIC_SITE_URL` for Production to the canonical `https` custom domain; Preview may omit it to use the deployment's `VERCEL_URL`. The default Next.js build command works (`npm run build`) and fails intentionally if production has no site origin.
5. **Smoke test:** sign up, confirm email, add a service and staff member with hours, book a slot, attempt a double booking, reschedule, transition statuses, export a report, and sign out. Confirm a second owner cannot see the first owner's records.

No hosted environment, remote database, GitHub remote, or deployment was created as part of this build.

### Security headers

`next.config.ts` applies baseline headers to every route and disables `X-Powered-By`:

| Header | Value | Scope |
| --- | --- | --- |
| `X-Content-Type-Options` | `nosniff` | All environments |
| `X-Frame-Options` | `DENY` | All environments |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | All environments |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=()` | All environments |
| `Strict-Transport-Security` | `max-age=31536000` | Production only |

The app does not send `includeSubDomains` or `preload` because subdomain and preload-list support have not been established for a deployment domain. There is no Content-Security-Policy yet: adding one requires testing Next.js fonts, framework scripts, Supabase requests, and Recharts before rollout. If a hosting platform or CDN injects its own HSTS policy, verify the combined response headers in the deployed environment; do not assume local `next start` reflects edge overrides.

## Known limitations

- One working interval per staff member per weekday; business hours cannot cross midnight, and an appointment must fit inside one day's interval.
- Staff are scheduling resources without individual logins. There is one owner per business and no team roles.
- No public self-booking, payments, SMS/email notifications, recurring appointments, calendar sync, or multi-location support.
- Local development disables email confirmation; a hosted setup must configure SMTP and redirect URLs.
- Reports load the selected range into memory to build metrics and CSVs. A range above **20,000 appointments** is refused with an explicit "too large" state; reports never show partial totals, and CSV export returns `413` instead of a partial file. Narrow the range for larger datasets.
- The dashboard and the four detail screens (appointment, customer, staff, settings) are verified at 320px and up. `npm run test:responsive` covers the dashboard only; the detail-screen measurements were taken with a one-off headless-Chrome script using seeded long-label data, not a committed end-to-end suite.
- Changing the business time zone changes how historical instants are displayed and how report ranges align; stored instants are unchanged.
- UI and responsive verification used headless Chromium, not Safari/Firefox or physical devices. No automated accessibility audit (axe/Lighthouse) or committed end-to-end suite exists; the interface uses semantic labels, visible focus styles, and ARIA state attributes, but a formal WCAG audit is still recommended.
- The `appointment_events` timeline grows per booking; there is no retention policy yet.

## Repository notes

- `AGENTS.md` is maintained by `next dev` and describes the local Next.js version's guidance.
- `.screens/` contains local-only verification scripts and captures and is ignored by Git.
- `supabase/seed.sql` is intentionally empty — SlotWise ships without sample metrics.
