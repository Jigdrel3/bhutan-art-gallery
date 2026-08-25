-- Run this in the Supabase SQL Editor AFTER schema.sql.
-- Grants write access to any *authenticated* user. Safe only because you
-- will create exactly one such user yourself (Authentication -> Users ->
-- Add user) and then turn OFF public signup:
--   Authentication -> Providers -> Email -> "Allow new users to sign up"
-- With signup disabled, "authenticated" effectively means "you".

drop policy if exists "authenticated can insert categories" on categories;
create policy "authenticated can insert categories"
  on categories for insert to authenticated with check (true);

drop policy if exists "authenticated can update categories" on categories;
create policy "authenticated can update categories"
  on categories for update to authenticated using (true) with check (true);

drop policy if exists "authenticated can delete categories" on categories;
create policy "authenticated can delete categories"
  on categories for delete to authenticated using (true);

drop policy if exists "authenticated can insert images" on images;
create policy "authenticated can insert images"
  on images for insert to authenticated with check (true);

drop policy if exists "authenticated can update images" on images;
create policy "authenticated can update images"
  on images for update to authenticated using (true) with check (true);

drop policy if exists "authenticated can delete images" on images;
create policy "authenticated can delete images"
  on images for delete to authenticated using (true);

drop policy if exists "authenticated can upload to gallery" on storage.objects;
create policy "authenticated can upload to gallery"
  on storage.objects for insert to authenticated with check (bucket_id = 'gallery');

drop policy if exists "authenticated can update gallery objects" on storage.objects;
create policy "authenticated can update gallery objects"
  on storage.objects for update to authenticated using (bucket_id = 'gallery') with check (bucket_id = 'gallery');

drop policy if exists "authenticated can delete gallery objects" on storage.objects;
create policy "authenticated can delete gallery objects"
  on storage.objects for delete to authenticated using (bucket_id = 'gallery');
