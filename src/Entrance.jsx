import './Entrance.css'

function Cloud({ className, style }) {
  return (
    <svg className={`cloud ${className || ''}`} style={style} viewBox="0 0 120 70" fill="none">
      <g>
        <circle cx="30" cy="40" r="20" />
        <circle cx="55" cy="28" r="16" />
        <circle cx="80" cy="38" r="18" />
        <circle cx="60" cy="48" r="22" />
        <circle cx="95" cy="46" r="12" />
      </g>
    </svg>
  )
}

function Mountains() {
  return (
    <svg className="mountains" viewBox="0 0 1200 220" preserveAspectRatio="none">
      <path
        d="M0 220 L120 90 L200 150 L300 40 L380 130 L470 60 L560 150 L640 100 L740 190 L820 70 L920 160 L1000 110 L1080 180 L1200 100 L1200 220 Z"
        fill="none"
      />
    </svg>
  )
}

export default function Entrance({ onEnter }) {
  return (
    <div className="entrance-root">
      <div className="entrance-sky">
        <Cloud className="cloud-a" />
        <Cloud className="cloud-b" />
        <Cloud className="cloud-c" />
        <Cloud className="cloud-d" />
      </div>

      <div className="entrance-stage">
        <div className="vitrine">
          <div className="vitrine-band" />
          <div className="vitrine-corner tl" />
          <div className="vitrine-corner tr" />
          <div className="vitrine-corner bl" />
          <div className="vitrine-corner br" />

          <div className="vitrine-interior">
            <div className="door" />
            <Cloud className="cloud-inner-a" />
            <Cloud className="cloud-inner-b" />
          </div>
        </div>
        <div className="vitrine-reflection" aria-hidden="true">
          <div className="vitrine reflected">
            <div className="vitrine-interior">
              <div className="door" />
            </div>
          </div>
        </div>
      </div>

      <Mountains />

      <div className="entrance-copy">
        <h1>Art Gallery</h1>
        <p className="entrance-subtitle">A walkable collection, carried out of Bhutan</p>
        <button type="button" className="entrance-enter" onClick={onEnter}>
          Step inside
        </button>
      </div>
    </div>
  )
}
