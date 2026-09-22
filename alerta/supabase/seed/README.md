# Alerta demo data

`seed.sql` is **not** run automatically against a real Supabase project — it
requires auth users to already exist (Supabase manages `auth.users`
separately from the `public` schema, and RLS-safe RPCs like
`create_business_and_manager` require a live `auth.uid()`).

The supported way to get realistic demo data is the Node script
`supabase/seed/seed.mjs`, which:

1. Uses the **service role key** (server-side only — never shipped to the
   browser) to create real Supabase Auth users for the demo business.
2. Calls the same `create_business_and_manager` / invite-claim RPCs the
   real app uses, so the seeded data goes through the exact same
   validation and RLS as production usage.
3. Inserts a few realistic historical shifts/incidents/SOS events so the
   dashboard and stats pages aren't empty on first look.

Run it with:

```bash
node supabase/seed/seed.mjs
```

See the script header for required environment variables.
