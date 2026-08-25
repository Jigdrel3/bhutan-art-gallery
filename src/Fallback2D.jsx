import { useState, useEffect } from 'react'
import { fetchCategories } from './dataSource'
import { transformedImageUrl } from './lib/imageUrl'
import CategoryViewer from './CategoryViewer'
import './Fallback2D.css'

// A flat 2D alternative to the walkable hall — same content, no WebGL, so
// nobody is locked out (low-power devices, WebGL disabled, older browsers).
export default function Fallback2D() {
  const [categories, setCategories] = useState(null)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchCategories().then((result) => {
      if (!cancelled) setCategories(result.frames)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="fallback-root">
      <header className="fallback-header">
        <h1>Art Gallery</h1>
        <p>Your browser can't run the walkable 3D hall, so here's the same collection laid out flat.</p>
      </header>

      {!categories && <p className="fallback-loading">Loading the collection…</p>}

      {categories && (
        <div className="fallback-grid">
          {categories.map((cat) => (
            <button key={cat.id} type="button" className="fallback-card" onClick={() => setSelected(cat)}>
              <img src={transformedImageUrl(cat.cover, { width: 500 })} alt="" />
              <span className="fallback-card-title">{cat.title}</span>
            </button>
          ))}
        </div>
      )}

      {selected && <CategoryViewer category={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
