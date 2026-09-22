-- Alerta — Row Level Security policies
-- Enforced in the database, not just hidden in the UI.

alter table businesses enable row level security;
alter table profiles enable row level security;
alter table invites enable row level security;
alter table shifts enable row level security;
alter table sos_events enable row level security;
alter table incidents enable row level security;
alter table manager_alerts enable row level security;

-- =====================================================================
-- businesses
-- Members can read their own business. Creation happens via the
-- `create_business_and_manager` RPC (security definer) during onboarding,
-- so no direct INSERT policy is needed for authenticated clients.
-- Only a manager can update their own business (e.g. rename).
-- =====================================================================
drop policy if exists "businesses: members can read" on businesses;
create policy "businesses: members can read"
  on businesses for select
  to authenticated
  using (id = current_business_id());

drop policy if exists "businesses: managers can update own" on businesses;
create policy "businesses: managers can update own"
  on businesses for update
  to authenticated
  using (is_active_manager_in(id))
  with check (is_active_manager_in(id));

-- =====================================================================
-- profiles
-- Everyone can read their own profile. Managers can read/update every
-- profile in their own business. Employees can update limited fields on
-- their own profile only (enforced by trigger, not just this policy).
-- =====================================================================
drop policy if exists "profiles: self can read" on profiles;
create policy "profiles: self can read"
  on profiles for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "profiles: managers can read business roster" on profiles;
create policy "profiles: managers can read business roster"
  on profiles for select
  to authenticated
  using (is_active_manager_in(business_id));

drop policy if exists "profiles: self can update own" on profiles;
create policy "profiles: self can update own"
  on profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "profiles: managers can update business roster" on profiles;
create policy "profiles: managers can update business roster"
  on profiles for update
  to authenticated
  using (is_active_manager_in(business_id))
  with check (is_active_manager_in(business_id));

-- Profile rows are otherwise created only via the onboarding /
-- invite-claim RPCs (security definer), never via direct client INSERT.

-- =====================================================================
-- invites
-- Managers manage invites for their own business. An unauthenticated
-- signup claims an invite by code through the `claim_invite` RPC
-- (security definer), so no public SELECT/UPDATE policy is required.
-- =====================================================================
drop policy if exists "invites: managers can read own business" on invites;
create policy "invites: managers can read own business"
  on invites for select
  to authenticated
  using (is_active_manager_in(business_id));

drop policy if exists "invites: managers can create for own business" on invites;
create policy "invites: managers can create for own business"
  on invites for insert
  to authenticated
  with check (is_active_manager_in(business_id) and created_by = auth.uid());

drop policy if exists "invites: managers can revoke own business" on invites;
create policy "invites: managers can revoke own business"
  on invites for update
  to authenticated
  using (is_active_manager_in(business_id))
  with check (is_active_manager_in(business_id));

-- =====================================================================
-- shifts
-- Employees manage only their own shifts. Managers can read (never
-- rewrite) every shift in their business, for the roster + stats.
-- =====================================================================
drop policy if exists "shifts: self can read own" on shifts;
create policy "shifts: self can read own"
  on shifts for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "shifts: managers can read business shifts" on shifts;
create policy "shifts: managers can read business shifts"
  on shifts for select
  to authenticated
  using (is_active_manager_in(business_id));

drop policy if exists "shifts: self can create own" on shifts;
create policy "shifts: self can create own"
  on shifts for insert
  to authenticated
  with check (user_id = auth.uid() and business_id = current_business_id());

drop policy if exists "shifts: self can update own" on shifts;
create policy "shifts: self can update own"
  on shifts for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- =====================================================================
-- sos_events
-- Employees create their own SOS events and can read their own status.
-- Only managers can acknowledge/resolve (update), and only within their
-- own business.
-- =====================================================================
drop policy if exists "sos: self can read own" on sos_events;
create policy "sos: self can read own"
  on sos_events for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "sos: managers can read business events" on sos_events;
create policy "sos: managers can read business events"
  on sos_events for select
  to authenticated
  using (is_active_manager_in(business_id));

drop policy if exists "sos: self can create own" on sos_events;
create policy "sos: self can create own"
  on sos_events for insert
  to authenticated
  with check (user_id = auth.uid() and business_id = current_business_id());

drop policy if exists "sos: managers can update business events" on sos_events;
create policy "sos: managers can update business events"
  on sos_events for update
  to authenticated
  using (is_active_manager_in(business_id))
  with check (is_active_manager_in(business_id));

-- =====================================================================
-- incidents
-- Employees create/read their own incidents. Managers can read every
-- incident in their business and update status/resolution_note.
-- =====================================================================
drop policy if exists "incidents: self can read own" on incidents;
create policy "incidents: self can read own"
  on incidents for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "incidents: managers can read business incidents" on incidents;
create policy "incidents: managers can read business incidents"
  on incidents for select
  to authenticated
  using (is_active_manager_in(business_id));

drop policy if exists "incidents: self can create own" on incidents;
create policy "incidents: self can create own"
  on incidents for insert
  to authenticated
  with check (user_id = auth.uid() and business_id = current_business_id());

drop policy if exists "incidents: managers can update business incidents" on incidents;
create policy "incidents: managers can update business incidents"
  on incidents for update
  to authenticated
  using (is_active_manager_in(business_id))
  with check (is_active_manager_in(business_id));

-- =====================================================================
-- manager_alerts
-- Readable by any member of the business (employees can see who
-- responds to their SOS is meaningful, but keep it manager-managed).
-- Only managers can add/enable/disable recipients within their business.
-- =====================================================================
drop policy if exists "manager_alerts: business members can read" on manager_alerts;
create policy "manager_alerts: business members can read"
  on manager_alerts for select
  to authenticated
  using (business_id = current_business_id());

drop policy if exists "manager_alerts: managers can insert" on manager_alerts;
create policy "manager_alerts: managers can insert"
  on manager_alerts for insert
  to authenticated
  with check (is_active_manager_in(business_id));

drop policy if exists "manager_alerts: managers can update" on manager_alerts;
create policy "manager_alerts: managers can update"
  on manager_alerts for update
  to authenticated
  using (is_active_manager_in(business_id))
  with check (is_active_manager_in(business_id));
