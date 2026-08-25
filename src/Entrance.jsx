import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import EntranceScene from './EntranceScene'
import { hasWebGL } from './lib/webgl'
import './Entrance.css'

function StaticFallback({ onEnter }) {
  return (
    <div className="entrance-root entrance-fallback">
      <div className="fallback-glow" />
      <div className="entrance-copy">
        <h1>Art Gallery</h1>
        <p className="entrance-subtitle">A walkable collection, carried out of Bhutan</p>
        <button type="button" className="fallback-enter" onClick={onEnter}>
          Enter
        </button>
      </div>
    </div>
  )
}

export default function Entrance({ onEnter }) {
  if (!hasWebGL()) {
    return <StaticFallback onEnter={onEnter} />
  }

  return (
    <div className="entrance-root">
      <Canvas
        shadows
        camera={{ fov: 40, position: [0, 0.3, 5.5] }}
        gl={{ antialias: true, toneMappingExposure: 1.1 }}
      >
        <Suspense fallback={null}>
          <EntranceScene onEnter={onEnter} />
        </Suspense>
      </Canvas>

      <div className="entrance-copy">
        <h1>Art Gallery</h1>
        <p className="entrance-subtitle">A walkable collection, carried out of Bhutan</p>
        <p className="entrance-hint">Click the object to enter</p>
      </div>
    </div>
  )
}
