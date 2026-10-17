-- Only needed if "Upload image" in the editor says the "covers" bucket is missing.
-- Supabase → SQL Editor → New query → paste → Run.
insert into storage.buckets (id, name, public) values ('covers', 'covers', true)
  on conflict (id) do nothing;
drop policy if exists "admin uploads covers" on storage.objects;
create policy "admin uploads covers" on storage.objects for all to authenticated
  using (bucket_id = 'covers' and public.is_admin())
  with check (bucket_id = 'covers' and public.is_admin());
