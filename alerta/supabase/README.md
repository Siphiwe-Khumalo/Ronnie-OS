# Alerta — Supabase setup

## 1. Create a Supabase project

Create a project at https://supabase.com, then grab the **Project URL**
and **anon public key** from Project Settings → API. Put them in
`.env.local` at the repo root (copy `.env.example`).

## 2. Run the migrations

Using the Supabase CLI (recommended):

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Or paste each file in `supabase/migrations/` into the SQL editor, **in
numeric order** (0001 → 0008):

1. `0001_extensions.sql` — pgcrypto
2. `0002_schema.sql` — all tables, indexes, `updated_at` trigger
3. `0003_helpers.sql` — `current_business_id()`, `is_manager()`, `is_active_manager_in()`
4. `0004_triggers.sql` — write-guards that lock down which columns can be mutated and by whom
5. `0005_rls.sql` — Row Level Security policies for every table
6. `0006_rpcs.sql` — onboarding RPCs (`create_business_and_manager`, `claim_invite`, `get_invite_preview`)
7. `0007_storage.sql` — `incident-photos` storage bucket + policies
8. `0008_realtime.sql` — enables Realtime on `sos_events`, `incidents`, `shifts`

## 3. Auth settings

In Authentication → Providers, Email/Password should be enabled by
default. For a smooth local/demo experience, you may want to disable
"Confirm email" (Authentication → Settings) so signup logs a user in
immediately — the app also handles the confirmation-required case
gracefully either way.

## 4. Why an `invites` table?

The product spec describes "Manager adds employee." This frontend has
**no service-role key** (by design — it must never be shipped to a
browser), so it cannot call the Supabase Admin API to create a login for
someone else. Instead:

1. A manager fills in the new hire's name/email/phone → this creates a
   row in `invites` with a random `invite_code`, scoped to their
   business.
2. The manager shares the resulting `/join/<code>` link.
3. The invitee opens the link, sees a preview ("Join Mandla
   Construction as Kabelo Molefe"), and sets their own password. This
   calls `claim_invite()`, an RPC that creates their real `auth.users`
   account via normal client-side `signUp()` and their `profiles` row
   atomically.

This keeps every credential creation path fully self-service and never
requires a secret key in the browser.

## 5. Demo data

See `supabase/seed/README.md` — running `supabase/seed/seed.mjs` (with
the service role key, **only ever on your own machine**) creates the
"Mandla Construction" demo business with a manager and 4 employees, plus
some realistic historical activity.

## 6. Security model summary

* Every table has RLS **enabled**, with explicit per-operation policies
  — nothing relies on hiding data in the UI.
* `SECURITY DEFINER` helper functions (`current_business_id()`,
  `is_manager()`, `is_active_manager_in()`) let policies check role/
  business membership without the classic "policy on `profiles` queries
  `profiles`" infinite recursion problem — they only ever look up facts
  about `auth.uid()`, never arbitrary rows.
* `BEFORE UPDATE` triggers on `profiles`, `sos_events`, and `incidents`
  hard-lock fields RLS's `WITH CHECK` can't express (e.g. "an employee
  editing their own profile can change their phone number but not their
  own role", "`acknowledged_by`/`resolved_by` are always stamped from
  the authenticated caller, never trusted from client input", "an SOS
  can't be marked resolved without a resolution note").
* A unique partial index (`idx_shifts_one_active_per_user`) makes
  "no two simultaneous active shifts" a database-level guarantee, not
  just an application check.
