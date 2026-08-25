import { supabase, hasSupabase } from './lib/supabaseClient'
import { localCategories } from './localContent'
import { layoutCategories } from './layout'

async function fetchFromSupabase() {
  const { data, error } = await supabase
    .from('categories')
    .select('slug, title, wall_text, cover_url, sort_order, images ( url, caption, alt_text, sort_order )')
    .order('sort_order', { ascending: true })
    .order('sort_order', { ascending: true, foreignTable: 'images' })

  if (error) throw error

  return data.map((row) => ({
    id: row.slug,
    title: row.title,
    wallText: row.wall_text,
    cover: row.cover_url,
    images: row.images.map((img) => ({ url: img.url, caption: img.caption, altText: img.alt_text })),
  }))
}

// Fetches the live category list (title/cover/wallText/images) and computes
// wall placement for it. Falls back to the local hardcoded set — used
// before Supabase is configured, and if the query fails at runtime — so the
// hall never just shows a blank room.
export async function fetchCategories() {
  if (hasSupabase) {
    try {
      const rows = await fetchFromSupabase()
      if (rows.length > 0) return layoutCategories(rows)
      console.warn('Supabase returned no categories — falling back to local content.')
    } catch (err) {
      console.warn('Supabase category fetch failed, falling back to local content:', err)
    }
  }
  return layoutCategories(
    localCategories.map((cat) => ({
      ...cat,
      images: cat.images.map((url) => ({ url, caption: '', altText: '' })),
    }))
  )
}
