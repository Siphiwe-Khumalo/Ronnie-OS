-- Alerta — Realtime
-- Enable Postgres change broadcasts for SOS events so manager dashboards
-- update immediately on trigger/acknowledge/resolve, and so an employee's
-- own device reflects "Help is on the way" the instant a manager acts.
-- Incidents/shifts are included too so manager views stay live.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'sos_events'
  ) then
    alter publication supabase_realtime add table sos_events;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'incidents'
  ) then
    alter publication supabase_realtime add table incidents;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'shifts'
  ) then
    alter publication supabase_realtime add table shifts;
  end if;
end $$;
