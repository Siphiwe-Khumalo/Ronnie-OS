-- Alerta — Core schema
-- Design notes:
--  * profiles.id === auth.users.id (standard Supabase pattern), so
--    auth.uid() = profiles.id everywhere in RLS.
--  * All business-scoped tables carry business_id for straightforward RLS
--    and reporting.
--  * `invites` is an implementation detail NOT explicitly listed in the
--    product spec's table list, added because the frontend has no
--    service-role key and therefore cannot call the Supabase Admin API to
--    create auth users on a manager's behalf. A manager "adding an
--    employee" creates an invite record; the employee claims it (via
--    invite code) when they sign up, which creates their real profile.
--    See supabase/README.md for the full rationale.

create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  plan text not null default 'starter' check (plan in ('starter', 'pro')),
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  business_id uuid not null references businesses (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  email text,
  phone text,
  role text not null default 'employee' check (role in ('employee', 'manager')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_business_id on profiles (business_id);
create index if not exists idx_profiles_business_role on profiles (business_id, role);

create table if not exists invites (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  email text not null,
  phone text,
  role text not null default 'employee' check (role in ('employee', 'manager')),
  invite_code text not null unique,
  status text not null default 'pending' check (status in ('pending', 'claimed', 'revoked')),
  created_by uuid references profiles (id) on delete set null,
  claimed_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  claimed_at timestamptz
);

create index if not exists idx_invites_business_id on invites (business_id);
create unique index if not exists idx_invites_code on invites (invite_code);
create index if not exists idx_invites_email_pending on invites (business_id, email) where status = 'pending';

create table if not exists shifts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  business_id uuid not null references businesses (id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  checked_out_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_shifts_business_id on shifts (business_id);
create index if not exists idx_shifts_user_id on shifts (user_id);
-- Enforce "no multiple simultaneous active shifts" at the database level.
create unique index if not exists idx_shifts_one_active_per_user
  on shifts (user_id)
  where checked_out_at is null;

create table if not exists sos_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  triggered_at timestamptz not null default now(),
  latitude double precision,
  longitude double precision,
  location_accuracy_m double precision,
  status text not null default 'active' check (status in ('active', 'acknowledged', 'resolved')),
  acknowledged_by uuid references profiles (id) on delete set null,
  acknowledged_at timestamptz,
  resolved_by uuid references profiles (id) on delete set null,
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_sos_business_id on sos_events (business_id);
create index if not exists idx_sos_user_id on sos_events (user_id);
create index if not exists idx_sos_status on sos_events (business_id, status);
create index if not exists idx_sos_triggered_at on sos_events (triggered_at desc);

create table if not exists incidents (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  description text not null check (char_length(trim(description)) > 0),
  location_text text,
  severity text not null default 'minor' check (severity in ('minor', 'moderate', 'serious')),
  photo_url text,
  status text not null default 'open' check (status in ('open', 'investigating', 'closed')),
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_incidents_business_id on incidents (business_id);
create index if not exists idx_incidents_user_id on incidents (user_id);
create index if not exists idx_incidents_status on incidents (business_id, status);
create index if not exists idx_incidents_created_at on incidents (created_at desc);

create table if not exists manager_alerts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create index if not exists idx_manager_alerts_business_id on manager_alerts (business_id);

-- Keep incidents.updated_at current on every UPDATE.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_incidents_updated_at on incidents;
create trigger trg_incidents_updated_at
  before update on incidents
  for each row
  execute function set_updated_at();
