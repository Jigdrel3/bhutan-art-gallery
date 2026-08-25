import { useState, useEffect, useCallback } from 'react'

export default function CategoryViewer({ category, onClose }) {
  const [index, setIndex] = useState(0)
  const total = category.images.length

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + total) % total)
  }, [total])

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % total)
  }, [total])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code === 'ArrowLeft') goPrev()
      else if (e.code === 'ArrowRight') goNext()
      else if (e.code === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [goPrev, goNext, onClose])

  return (
    <div className="overlay category-viewer">
      <div className="viewer-header">
        <h2>{category.title}</h2>
        <p className="viewer-wall-text">{category.wallText}</p>
      </div>

      <div className="viewer-stage">
        <button
          type="button"
          className="viewer-nav viewer-nav-prev"
          onClick={goPrev}
          aria-label="Previous image"
        >
          ‹
        </button>

        <div className="frame-outer">
          <div className="frame-fillet">
            <div className="frame-mat">
              <div className="frame-image-box">
                <img
                  key={category.images[index]}
                  src={category.images[index]}
                  alt={`${category.title} ${index + 1} of ${total}`}
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="viewer-nav viewer-nav-next"
          onClick={goNext}
          aria-label="Next image"
        >
          ›
        </button>
      </div>

      <div className="viewer-footer">
        <span className="viewer-count">
          {index + 1} of {total}
        </span>
        <button type="button" className="back-button" onClick={onClose}>
          ← Return to the hall
        </button>
      </div>
    </div>
  )
}
