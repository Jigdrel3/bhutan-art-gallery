-- Run this once in the Supabase project's SQL Editor (Dashboard -> SQL Editor -> New query).
-- Safe to re-run: every statement is idempotent.

create extension if not exists pgcrypto;

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  wall_text text not null default '',
  cover_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists images (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  url text not null,
  caption text default '',
  alt_text text default '',
  is_cover boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists images_category_id_idx on images(category_id);

-- Public read access: anyone visiting the gallery can list categories/images.
-- Writes are intentionally NOT allowed for the anon role — the Phase 8
-- admin panel will write through a service-role-backed function instead of
-- exposing insert/update/delete directly to the browser.
alter table categories enable row level security;
alter table images enable row level security;

drop policy if exists "categories are publicly readable" on categories;
create policy "categories are publicly readable"
  on categories for select
  to anon
  using (true);

drop policy if exists "images are publicly readable" on images;
create policy "images are publicly readable"
  on images for select
  to anon
  using (true);

-- Storage bucket for gallery photos, publicly readable, upload restricted to
-- the service role (used by scripts/seed-supabase.mjs and, later, the admin
-- panel's server-side upload path).
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing;

drop policy if exists "gallery bucket is publicly readable" on storage.objects;
create policy "gallery bucket is publicly readable"
  on storage.objects for select
  to anon
  using (bucket_id = 'gallery');
