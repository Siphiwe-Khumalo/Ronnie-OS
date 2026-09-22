-- Alerta — Integrity triggers
--
-- RLS controls WHO can run a statement. These triggers control WHICH
-- COLUMNS a statement is allowed to actually change, which Postgres RLS
-- cannot express directly (no OLD reference inside a policy's WITH CHECK
-- expression). This is what makes the accountability trail on sos_events
-- and incidents trustworthy: even a permissive UPDATE policy cannot be
-- abused to rewrite history, escalate a role, or hop businesses.

-- ---------------------------------------------------------------------
-- profiles: employees editing their own profile (name/phone) can never
-- change their own role, status, or business_id — only a manager can.
-- ---------------------------------------------------------------------
create or replace function enforce_profile_update_restrictions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.id and not is_active_manager_in(old.business_id) then
    new.role := old.role;
    new.status := old.status;
    new.business_id := old.business_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_update_restrictions on profiles;
create trigger trg_profiles_update_restrictions
  before update on profiles
  for each row
  execute function enforce_profile_update_restrictions();

-- ---------------------------------------------------------------------
-- sos_events: lock immutable facts (who/where/when triggered) forever.
-- Stamp acknowledged_by / resolved_by from the authenticated caller
-- rather than trusting client-supplied values, and require a resolution
-- note before allowing status = 'resolved'.
-- ---------------------------------------------------------------------
create or replace function enforce_sos_update_restrictions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.business_id := old.business_id;
  new.user_id := old.user_id;
  new.triggered_at := old.triggered_at;
  new.latitude := old.latitude;
  new.longitude := old.longitude;
  new.location_accuracy_m := old.location_accuracy_m;
  new.created_at := old.created_at;

  if new.status = 'acknowledged' and old.status = 'active' then
    new.acknowledged_by := auth.uid();
    new.acknowledged_at := now();
  elsif old.status = 'acknowledged' and new.status = 'acknowledged' then
    -- no-op edits to an already-acknowledged event keep original stamp
    new.acknowledged_by := old.acknowledged_by;
    new.acknowledged_at := old.acknowledged_at;
  end if;

  if new.status = 'resolved' and old.status <> 'resolved' then
    if new.resolution_note is null or char_length(trim(new.resolution_note)) = 0 then
      raise exception 'A resolution note is required to resolve an emergency.';
    end if;
    new.resolved_by := auth.uid();
    new.resolved_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sos_update_restrictions on sos_events;
create trigger trg_sos_update_restrictions
  before update on sos_events
  for each row
  execute function enforce_sos_update_restrictions();

-- ---------------------------------------------------------------------
-- incidents: only status + resolution_note (+ updated_at) may change
-- after creation — the original report is a fixed record.
-- ---------------------------------------------------------------------
create or replace function enforce_incident_update_restrictions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.business_id := old.business_id;
  new.user_id := old.user_id;
  new.description := old.description;
  new.location_text := old.location_text;
  new.severity := old.severity;
  new.photo_url := old.photo_url;
  new.created_at := old.created_at;
  return new;
end;
$$;

drop trigger if exists trg_incidents_update_restrictions on incidents;
create trigger trg_incidents_update_restrictions
  before update on incidents
  for each row
  execute function enforce_incident_update_restrictions();
