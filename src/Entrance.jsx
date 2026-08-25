import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import EntranceScene from './EntranceScene'
import './Entrance.css'

export default function Entrance({ onEnter }) {
  return (
    <div className="entrance-root">
      <Canvas
        shadows
        camera={{ fov: 45, position: [0, 0.4, 6] }}
        gl={{ antialias: true, toneMappingExposure: 1.2 }}
      >
        <Suspense fallback={null}>
          <EntranceScene onEnter={onEnter} />
        </Suspense>
      </Canvas>

      <div className="entrance-copy">
        <h1>Art Gallery</h1>
        <p className="entrance-subtitle">A walkable collection, carried out of Bhutan</p>
        <p className="entrance-hint">Drag to look around &middot; scroll to zoom &middot; click the mass to enter</p>
      </div>
    </div>
  )
}
