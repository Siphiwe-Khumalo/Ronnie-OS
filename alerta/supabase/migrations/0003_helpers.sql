-- Alerta — RLS helper functions
--
-- Policies on `profiles` cannot subquery `profiles` directly without
-- risking infinite recursion (a policy on profiles that queries profiles
-- to check role triggers the same policy again). The standard, safe
-- pattern is SECURITY DEFINER helper functions that bypass RLS internally
-- but only ever return facts about the CURRENTLY AUTHENTICATED user
-- (auth.uid()), never arbitrary data. They are STABLE so they can be used
-- freely inside policies.

create or replace function current_business_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select business_id from profiles where id = auth.uid();
$$;

create or replace function is_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'manager'
  );
$$;

create or replace function is_active_manager_in(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and role = 'manager'
      and status = 'active'
      and business_id = target_business_id
  );
$$;

revoke all on function current_business_id() from public;
revoke all on function is_manager() from public;
revoke all on function is_active_manager_in(uuid) from public;
grant execute on function current_business_id() to authenticated;
grant execute on function is_manager() to authenticated;
grant execute on function is_active_manager_in(uuid) to authenticated;
