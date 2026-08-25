// Rewrites a Supabase Storage public URL to use its on-the-fly image
// transform endpoint, so wall textures and viewer images are served at a
// sane size instead of loading multi-megabyte originals straight into a
// WebGL texture or an <img>. Local fallback paths (src/localContent.js,
// which aren't Supabase URLs) pass through unchanged.
export function transformedImageUrl(url, { width, quality = 75 } = {}) {
  if (!url) return url
  const marker = '/storage/v1/object/public/'
  const idx = url.indexOf(marker)
  if (idx === -1) return url

  const base = url.slice(0, idx)
  const path = url.slice(idx + marker.length)
  const params = new URLSearchParams()
  if (width) params.set('width', String(width))
  params.set('quality', String(quality))
  return `${base}/storage/v1/render/image/public/${path}?${params.toString()}`
}
