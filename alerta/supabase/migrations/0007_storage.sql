-- Alerta — Storage bucket for incident photos
--
-- One photo max per incident (enforced in the UI/application layer).
-- Objects are stored under `<business_id>/<user_id>/<filename>` so RLS
-- can enforce access using the same business/ownership rules as the
-- rest of the schema, purely from the object path — no extra metadata
-- table required.

insert into storage.buckets (id, name, public)
  values ('incident-photos', 'incident-photos', false)
  on conflict (id) do nothing;

drop policy if exists "incident-photos: owner can upload" on storage.objects;
create policy "incident-photos: owner can upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'incident-photos'
    and (storage.foldername(name))[1] = current_business_id()::text
    and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy if exists "incident-photos: owner can read own" on storage.objects;
create policy "incident-photos: owner can read own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'incident-photos'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy if exists "incident-photos: managers can read business photos" on storage.objects;
create policy "incident-photos: managers can read business photos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'incident-photos'
    and is_active_manager_in(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "incident-photos: owner can delete own" on storage.objects;
create policy "incident-photos: owner can delete own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'incident-photos'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
