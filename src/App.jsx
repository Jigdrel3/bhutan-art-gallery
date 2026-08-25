import { Suspense, useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { Loader } from '@react-three/drei'
import Room from './Room'
import PlayerControls from './PlayerControls'
import CategoryFrames from './CategoryFrames'
import StandingMarkers from './StandingMarkers'
import HallInteractions, { approachParamsFor } from './HallInteractions'
import CategoryViewer from './CategoryViewer'
import Entrance from './Entrance'
import Fallback2D from './Fallback2D'
import { fetchCategories } from './dataSource'
import { HALLWAY_WIDTH, MIN_LENGTH } from './layout'
import { hasWebGL } from './lib/webgl'
import './App.css'

const PLAYER_RADIUS = 0.4

export default function App() {
  const [gateOpen, setGateOpen] = useState(false)
  const [webglOk] = useState(hasWebGL)
  const [locked, setLocked] = useState(false)
  const [entered, setEntered] = useState(null)
  const [transitioning, setTransitioning] = useState(false)
  const [hall, setHall] = useState({ frames: [], totalLength: MIN_LENGTH })
  const [loadingCategories, setLoadingCategories] = useState(true)
  const controlsRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    fetchCategories().then((result) => {
      if (cancelled) return
      setHall(result)
      setLoadingCategories(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const onChange = () => setLocked(!!document.pointerLockElement)
    document.addEventListener('pointerlockchange', onChange)
    return () => document.removeEventListener('pointerlockchange', onChange)
  }, [])

  const handleEnter = useCallback((category) => {
    if (!controlsRef.current) return
    setTransitioning(true)
    const { position, yaw, pitch } = approachParamsFor(category)
    controlsRef.current.approach(position, yaw, pitch, 1.1, () => {
      setTransitioning(false)
      setEntered(category)
      document.exitPointerLock()
    })
  }, [])

  const busy = transitioning || !!entered

  const bounds = useMemo(
    () => ({
      minX: -HALLWAY_WIDTH / 2 + PLAYER_RADIUS,
      maxX: HALLWAY_WIDTH / 2 - PLAYER_RADIUS,
      minZ: PLAYER_RADIUS * 1.5,
      maxZ: hall.totalLength - PLAYER_RADIUS * 1.5,
    }),
    [hall.totalLength]
  )

  if (!gateOpen) {
    return <Entrance onEnter={() => setGateOpen(true)} />
  }

  if (!webglOk) {
    return <Fallback2D />
  }

  return (
    <div className="app-root">
      <Canvas
        shadows
        camera={{ fov: 70, near: 0.1, far: 100 }}
        gl={{ antialias: true, toneMappingExposure: 1.15 }}
      >
        <color attach="background" args={['#08080a']} />
        <fog attach="fog" args={['#08080a', 15, 34]} />
        <Suspense fallback={null}>
          <Room frames={hall.frames} totalLength={hall.totalLength} />
          <CategoryFrames categories={hall.frames} />
          <StandingMarkers categories={hall.frames} />
        </Suspense>
        <PlayerControls ref={controlsRef} bounds={bounds} />
        <HallInteractions categories={hall.frames} onEnter={handleEnter} disabled={busy} />
      </Canvas>

      <Loader
        containerStyles={{ background: '#08080a' }}
        innerStyles={{ background: '#2a2c3a' }}
        barStyles={{ background: '#e0972f' }}
        dataStyles={{ color: '#cfc9bd', fontFamily: 'system-ui, sans-serif', fontSize: '0.8rem' }}
        dataInterpolation={(p) => `Loading the collection — ${p.toFixed(0)}%`}
      />

      {loadingCategories && (
        <div className="overlay loader">
          <p className="loader-text">Entering the hall…</p>
        </div>
      )}

      {!loadingCategories && !locked && !entered && (
        <div className="overlay hint">
          <p className="hint-sub">Click to walk &middot; WASD &amp; mouse &middot; E to enter a room</p>
        </div>
      )}

      {entered && <CategoryViewer category={entered} onClose={() => setEntered(null)} />}
    </div>
  )
}
