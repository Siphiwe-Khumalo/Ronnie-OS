# Alerta

**Safety that fits in your pocket.**

Alerta is a lightweight workplace safety PWA for small businesses (~10–100
employees): check-in/out, one-tap emergency SOS with point-in-time GPS,
manager acknowledgement + resolution, and incident reporting — without
the cost or complexity of enterprise EHS software.

## Privacy principle

**Alerta is a safety product, not a surveillance product.** There is no
background location tracking, no location history, and no continuous GPS
polling anywhere in this codebase. The **only** place `navigator.geolocation`
is called is `captureOneTimeLocation()` in `src/services/sosService.ts`,
triggered exclusively by an explicit employee SOS confirmation, capturing
exactly one coordinate. If you're extending this app, keep it that way —
grep for `geolocation` before adding any new location code.

## Tech stack

React + Vite + TypeScript + Tailwind CSS + Supabase (Auth, Postgres, RLS,
Storage, Realtime) + `vite-plugin-pwa` + `lucide-react`. One repo, one
frontend, no backend server, no Redux, no GraphQL.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL + anon key
npm run dev
```

You'll need a Supabase project with the schema applied first — see
[`supabase/README.md`](supabase/README.md) for full setup instructions
(migrations, RLS, storage bucket, and why an `invites` table exists).

### Demo data

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node supabase/seed/seed.mjs
```

Creates the demo business **Mandla Construction** with a manager (Sarah
Mthembu) and four employees (Thabo Mokoena, Sipho Dlamini, Lerato Nkosi,
Kabelo Molefe), plus realistic historical shifts/incidents/SOS history.
Prints login credentials for every seeded account when it finishes. This
script requires the **service role key** and is never run in production
or bundled into the app — see `supabase/seed/README.md`.

## Project structure

```
src/
  components/   Reusable UI: primitives, brand mark, layout shells, feature widgets
  pages/        Route-level screens, split into auth/ employee/ manager/
  hooks/        useAuth, realtime subscriptions, online-status
  services/     All Supabase reads/writes — the only layer that talks to the DB
  lib/          supabase client, error-message mapping, formatting helpers
  types/        Hand-written types mirroring the SQL schema
supabase/
  migrations/   Numbered SQL migrations (schema, RLS, triggers, RPCs, storage, realtime)
  seed/         Demo-data seeding script (service-role, dev-only)
```

Database access is centralized in `src/services/*` — UI components never
call `supabase.from(...)` directly, so RLS/business logic changes have one
place to land.

## Core flows implemented

- **Auth & onboarding** — email/password signup, a "create your business"
  flow (first user becomes Manager), and an invite-link flow for adding
  employees/managers (see `supabase/README.md` §4 for why).
- **Check-in / check-out** — one active shift per employee, enforced by a
  database unique constraint, not just app logic.
- **Emergency SOS** — 3-second confirm-to-send countdown → one-time GPS
  capture (never blocking if denied/unavailable) → realtime-visible
  `active` event → manager **Acknowledge** → **Resolve** (with a
  required note) → employee sees live status via Supabase Realtime.
- **Incident reporting** — description, location, severity, one optional
  photo (Supabase Storage, RLS-scoped by business/owner), manager
  triage (open → investigating → closed).
- **Manager dashboard** — active emergencies always shown first, then
  today's overview (checked-in count, open incidents, SOS this month,
  avg. acknowledgement time), roster, incident list, employee
  management (add via invite, deactivate/reactivate), stats, and a
  settings page to choose which managers receive SOS alerts.
- **PWA** — installable manifest + icons + service worker (basic asset
  caching only, via `vite-plugin-pwa`). No offline data sync: if you're
  offline, the UI shows a banner rather than pretending a write worked.

## Security model (short version)

Row Level Security is enabled on every table; nothing is protected by UI
hiding alone. See `supabase/README.md` §6 for the full breakdown of the
helper functions and trigger-based write guards that make the
accountability trail (`acknowledged_by`, `resolved_by`, `resolution_note`)
trustworthy. The Supabase **service role key is never used in this
frontend** — it only appears in the standalone dev-only seed script,
which reads it from your shell environment and is never bundled or
deployed.

## Notifications

- **Browser notifications**: implemented — when a manager has granted
  permission, a local `Notification` fires the instant a new SOS event
  arrives over Realtime, even if their tab is backgrounded.
- **True push-when-app-closed / SMS**: intentionally NOT implemented,
  because both require secrets (VAPID private key / an SMS provider's
  API key) that must live server-side, not in this frontend. The
  extension points, required env vars, and exact steps to wire up a
  Supabase Edge Function for either are documented in
  `src/services/notificationService.ts`. No credentials were fabricated.

## What was intentionally left out (see product spec)

Continuous/background location tracking, chat, shift scheduling,
training/certifications, compliance calendars, AI features,
multi-language, native apps, multiple incident photos, video/voice
reports, complex role hierarchies, multi-site management, payroll/HR
integrations, automated escalation chains. These are explicitly future
scope, not gaps.

## Environment variables

See `.env.example`:

| Variable | Required | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Public anon key — safe for the browser, protected by RLS |
| `VITE_VAPID_PUBLIC_KEY` | No | Only needed if you wire up real Web Push (see Notifications) |

`SUPABASE_SERVICE_ROLE_KEY` is used **only** by `supabase/seed/seed.mjs`,
read from your shell environment, never committed, never in `.env.local`,
never bundled into the app.
