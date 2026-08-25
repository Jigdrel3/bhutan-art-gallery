# Walkable 3D Art Gallery

A first-person, walkable 3D gallery for browsing categorized photography, built with React Three Fiber. See [`gallery-prd.md`](../gallery-prd.md) in the parent folder for the full product spec.

## Stack

- React + Vite
- Three.js via React Three Fiber / drei
- Supabase (Postgres + Storage) for categories/images

## Local development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and fill in your Supabase project's URL and anon key to run against live data. Without it, the app falls back to the local placeholder content in `src/localContent.js`.

## Seeding Supabase

Run once, after applying `supabase/schema.sql` in the Supabase SQL editor:

```bash
node --env-file=.env.local scripts/seed-supabase.mjs
```

Requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (service role key is never used client-side).

## Controls

- **WASD** / arrow keys — walk
- **Mouse** — look around (click to enable pointer lock)
- Walk up to a glowing floor marker and click to enter a category or approach the statue
- **Esc** — release pointer lock / step back
