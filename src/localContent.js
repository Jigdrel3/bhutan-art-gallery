// Fallback content used until Supabase is wired up (or if it's unreachable).
// Positions are NOT baked in here — layoutCategories() in layout.js computes
// wall placement from this list's order, the same way it will for rows that
// come back from the database.
const wallText = {
  skies: 'Some days the only thing that held still was the sky.',
  cats: 'Small gods who allow us to live here.',
  religion: 'Faces borrowed for a night, so something older could speak.',
  flowers: 'Weather as memory — each of these fell only once.',
}

function buildImages(slug, count, extOverrides = {}) {
  return Array.from({ length: count }, (_, i) => {
    const n = i + 1
    const ext = extOverrides[n] || 'jpg'
    return `/gallery/${slug}/img-${String(n).padStart(2, '0')}.${ext}`
  })
}

export const localCategories = [
  {
    id: 'skies',
    title: 'Skies',
    cover: '/gallery/skies/img-01.jpg',
    wallText: wallText.skies,
    images: buildImages('skies', 12),
  },
  {
    id: 'cats',
    title: 'Cats',
    cover: '/gallery/cats/img-01.jpg',
    wallText: wallText.cats,
    images: buildImages('cats', 10, { 6: 'webp', 7: 'webp' }),
  },
  {
    id: 'religion',
    title: 'Mask Dances & Religion',
    cover: '/gallery/religion/img-01.jpg',
    wallText: wallText.religion,
    images: buildImages('religion', 22, { 2: 'webp', 3: 'webp', 4: 'webp' }),
  },
  {
    id: 'flowers',
    title: 'Flowers',
    cover: '/gallery/flowers/img-01.jpg',
    wallText: wallText.flowers,
    images: buildImages('flowers', 19),
  },
]
