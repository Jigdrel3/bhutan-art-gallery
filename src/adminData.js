import { supabase } from './lib/supabaseClient'

export function onAuthChange(callback) {
  supabase.auth.getSession().then(({ data }) => callback(data.session))
  const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => callback(session))
  return () => sub.subscription.unsubscribe()
}

export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function listCategoriesWithImages() {
  const { data, error } = await supabase
    .from('categories')
    .select('id, slug, title, wall_text, cover_url, sort_order, images ( id, url, caption, alt_text, is_cover, sort_order )')
    .order('sort_order', { ascending: true })
    .order('sort_order', { ascending: true, foreignTable: 'images' })
  if (error) throw error
  return data
}

export async function createCategory({ slug, title, wallText }) {
  const { data: existing, error: readError } = await supabase
    .from('categories')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
  if (readError) throw readError
  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0
  const { data, error } = await supabase
    .from('categories')
    .insert({ slug, title, wall_text: wallText || '', sort_order: nextOrder })
    .select()
    .single()
  if (error) throw error
  return data
}

function extToContentType(filename) {
  const ext = filename.toLowerCase().split('.').pop()
  if (ext === 'png') return 'image/png'
  if (ext === 'webp') return 'image/webp'
  if (ext === 'gif') return 'image/gif'
  return 'image/jpeg'
}

// Extracts the storage bucket-relative path from a Supabase public object URL.
function storagePathFromPublicUrl(url) {
  const marker = '/storage/v1/object/public/gallery/'
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return decodeURIComponent(url.slice(idx + marker.length))
}

export async function uploadImage({ categoryId, categorySlug, file, caption, altText, isCover, sortOrder }) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${categorySlug}/${Date.now()}-${safeName}`

  const { error: uploadError } = await supabase.storage
    .from('gallery')
    .upload(path, file, { contentType: file.type || extToContentType(file.name) })
  if (uploadError) throw uploadError

  const { data: pub } = supabase.storage.from('gallery').getPublicUrl(path)
  const url = pub.publicUrl

  if (isCover) {
    await supabase.from('images').update({ is_cover: false }).eq('category_id', categoryId)
  }

  const { data, error } = await supabase
    .from('images')
    .insert({
      category_id: categoryId,
      url,
      caption: caption || '',
      alt_text: altText || '',
      is_cover: !!isCover,
      sort_order: sortOrder,
    })
    .select()
    .single()
  if (error) throw error

  if (isCover) {
    await supabase.from('categories').update({ cover_url: url }).eq('id', categoryId)
  }

  return data
}

export async function setCover(categoryId, image) {
  await supabase.from('images').update({ is_cover: false }).eq('category_id', categoryId)
  await supabase.from('images').update({ is_cover: true }).eq('id', image.id)
  await supabase.from('categories').update({ cover_url: image.url }).eq('id', categoryId)
}

export async function updateImageMeta(imageId, { caption, altText, categoryId }) {
  const patch = {}
  if (caption !== undefined) patch.caption = caption
  if (altText !== undefined) patch.alt_text = altText
  if (categoryId !== undefined) patch.category_id = categoryId
  const { error } = await supabase.from('images').update(patch).eq('id', imageId)
  if (error) throw error
}

export async function deleteImage(image, categoryId) {
  const path = storagePathFromPublicUrl(image.url)
  if (path) {
    await supabase.storage.from('gallery').remove([path])
  }
  const { error } = await supabase.from('images').delete().eq('id', image.id)
  if (error) throw error

  if (image.is_cover) {
    const { data: remaining } = await supabase
      .from('images')
      .select('id, url')
      .eq('category_id', categoryId)
      .order('sort_order', { ascending: true })
      .limit(1)
    const next = remaining && remaining[0]
    await supabase
      .from('categories')
      .update({ cover_url: next ? next.url : null })
      .eq('id', categoryId)
    if (next) {
      await supabase.from('images').update({ is_cover: true }).eq('id', next.id)
    }
  }
}
