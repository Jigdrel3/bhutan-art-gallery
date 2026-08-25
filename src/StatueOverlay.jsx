export default function StatueOverlay({ onClose }) {
  return (
    <div className="overlay statue-overlay">
      <div className="statue-caption">
        <p>Stone remembers what light forgets.</p>
        <p className="statue-hint">Drag to look around it &middot; scroll or pinch to draw closer</p>
      </div>
      <button type="button" className="back-button statue-back" onClick={onClose}>
        ← Return to the hall
      </button>
    </div>
  )
}
