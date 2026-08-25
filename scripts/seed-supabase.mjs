// One-time migration: pushes the local placeholder content (src/localContent.js
// + the files under public/gallery/) into Supabase Storage + Postgres.
//
// Usage (Node 20.6+, from the gallery/ directory):
//   node --env-file=.env.local scripts/seed-supabase.mjs
//
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in that env file.
// The service role key bypasses RLS — it must only ever be used here, from
// your own machine, and must never be committed or shipped to the browser.

import { createClient } from '@supabase/supabase-js'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { localCategories } from '../src/localContent.js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +
      'Put them in gallery/.env.local, then run:\n' +
      '  node --env-file=.env.local scripts/seed-supabase.mjs'
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
const PUBLIC_DIR = path.resolve(import.meta.dirname, '..', 'public')

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.webp') return 'image/webp'
  if (ext === '.png') return 'image/png'
  return 'image/jpeg'
}

async function uploadImage(localWebPath) {
  // localWebPath looks like '/gallery/skies/img-01.jpg'
  const relPath = localWebPath.replace(/^\//, '')
  const absPath = path.join(PUBLIC_DIR, relPath)
  const buffer = await readFile(absPath)

  const { error } = await supabase.storage.from('gallery').upload(relPath, buffer, {
    contentType: contentTypeFor(relPath),
    upsert: true,
  })
  if (error) throw error

  const { data } = supabase.storage.from('gallery').getPublicUrl(relPath)
  return data.publicUrl
}

async function seedCategory(cat, sortOrder) {
  console.log(`\n${cat.title} (${cat.images.length} images)`)

  const { data: catRow, error: catError } = await supabase
    .from('categories')
    .upsert(
      { slug: cat.id, title: cat.title, wall_text: cat.wallText, sort_order: sortOrder },
      { onConflict: 'slug' }
    )
    .select()
    .single()
  if (catError) throw catError

  const imageUrls = []
  for (const [i, localPath] of cat.images.entries()) {
    process.stdout.write(`  uploading ${i + 1}/${cat.images.length}\r`)
    const url = await uploadImage(localPath)
    imageUrls.push(url)
  }
  console.log(`  uploaded ${imageUrls.length} images`.padEnd(30))

  // Replace this category's image rows wholesale — simplest way to keep a
  // re-run idempotent without hand-rolling per-row diffing.
  const { error: delError } = await supabase.from('images').delete().eq('category_id', catRow.id)
  if (delError) throw delError

  const rows = imageUrls.map((url, i) => ({
    category_id: catRow.id,
    url,
    is_cover: i === 0,
    sort_order: i,
  }))
  const { error: imgError } = await supabase.from('images').insert(rows)
  if (imgError) throw imgError

  const { error: coverError } = await supabase
    .from('categories')
    .update({ cover_url: imageUrls[0] })
    .eq('id', catRow.id)
  if (coverError) throw coverError
}

async function main() {
  for (const [i, cat] of localCategories.entries()) {
    await seedCategory(cat, i)
  }
  console.log('\nDone. The hall will pick this up on next load.')
}

main().catch((err) => {
  console.error('\nSeed failed:', err)
  process.exit(1)
})
