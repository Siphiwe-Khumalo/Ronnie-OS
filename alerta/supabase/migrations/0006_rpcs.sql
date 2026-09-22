-- Alerta — Onboarding RPCs
--
-- Creating a business + its first manager profile is a single atomic
-- operation that can't be expressed as two plain client-side INSERTs
-- (there is deliberately no direct INSERT policy on `businesses` or
-- `profiles` for authenticated clients — see 0005_rls.sql). These
-- SECURITY DEFINER functions perform the minimum necessary privileged
-- work on behalf of the CALLING user only (always keyed off auth.uid()),
-- never on behalf of an arbitrary target.

-- ---------------------------------------------------------------------
-- Called immediately after supabase.auth.signUp() during the "new
-- business" onboarding flow. Creates the business and the caller's own
-- profile as its first manager. Fails if the caller already has a
-- profile (one business per user in MVP).
-- ---------------------------------------------------------------------
create or replace function create_business_and_manager(
  p_business_name text,
  p_manager_name text,
  p_phone text default null
)
returns table (business_id uuid, profile_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business_id uuid;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated.';
  end if;

  if exists (select 1 from profiles where id = v_uid) then
    raise exception 'This account is already part of a business.';
  end if;

  insert into businesses (name) values (trim(p_business_name))
    returning id into v_business_id;

  insert into profiles (id, business_id, name, email, phone, role, status)
    values (
      v_uid,
      v_business_id,
      trim(p_manager_name),
      (select email from auth.users where id = v_uid),
      p_phone,
      'manager',
      'active'
    );

  insert into manager_alerts (business_id, user_id, enabled)
    values (v_business_id, v_uid, true);

  return query select v_business_id, v_uid;
end;
$$;

revoke all on function create_business_and_manager(text, text, text) from public;
grant execute on function create_business_and_manager(text, text, text) to authenticated;

-- ---------------------------------------------------------------------
-- Called immediately after supabase.auth.signUp() when an employee is
-- joining a business via an invite code a manager generated for them.
-- ---------------------------------------------------------------------
create or replace function claim_invite(
  p_invite_code text,
  p_phone text default null
)
returns table (business_id uuid, profile_id uuid, role text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite invites;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated.';
  end if;

  if exists (select 1 from profiles where id = v_uid) then
    raise exception 'This account is already part of a business.';
  end if;

  select * into v_invite
    from invites
    where invite_code = p_invite_code and status = 'pending'
    for update;

  if v_invite.id is null then
    raise exception 'This invite link is invalid or has already been used.';
  end if;

  insert into profiles (id, business_id, name, email, phone, role, status)
    values (
      v_uid,
      v_invite.business_id,
      v_invite.name,
      (select email from auth.users where id = v_uid),
      coalesce(p_phone, v_invite.phone),
      v_invite.role,
      'active'
    );

  update invites
    set status = 'claimed', claimed_by = v_uid, claimed_at = now()
    where id = v_invite.id;

  if v_invite.role = 'manager' then
    insert into manager_alerts (business_id, user_id, enabled)
      values (v_invite.business_id, v_uid, true)
      on conflict (business_id, user_id) do nothing;
  end if;

  return query select v_invite.business_id, v_uid, v_invite.role;
end;
$$;

revoke all on function claim_invite(text, text) from public;
grant execute on function claim_invite(text, text) to authenticated;

-- ---------------------------------------------------------------------
-- Helper to look up basic (non-sensitive) invite details by code BEFORE
-- the user has an account, so the signup screen can show
-- "You've been invited to join {business}" without requiring auth.
-- Only exposes business name + invitee name/role — nothing sensitive.
-- ---------------------------------------------------------------------
create or replace function get_invite_preview(p_invite_code text)
returns table (business_name text, invitee_name text, role text, status text)
language sql
stable
security definer
set search_path = public
as $$
  select b.name, i.name, i.role, i.status
  from invites i
  join businesses b on b.id = i.business_id
  where i.invite_code = p_invite_code;
$$;

revoke all on function get_invite_preview(text) from public;
grant execute on function get_invite_preview(text) to anon, authenticated;
