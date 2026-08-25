import { Suspense, useState, useEffect, useRef, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import Room from './Room'
import PlayerControls from './PlayerControls'
import CategoryFrames from './CategoryFrames'
import StandingMarkers from './StandingMarkers'
import HallInteractions, { approachParamsFor } from './HallInteractions'
import CategoryViewer from './CategoryViewer'
import StatueZone from './StatueZone'
import StatueOrbit from './StatueOrbit'
import StatueOverlay from './StatueOverlay'
import { fetchCategories } from './dataSource'
import './App.css'

const STATUE_TARGET = [0, 1.55, 0]
const STATUE_MIN_RADIUS = 1.7
const STATUE_MAX_RADIUS = 5.5

export default function App() {
  const [locked, setLocked] = useState(false)
  const [entered, setEntered] = useState(null)
  const [transitioning, setTransitioning] = useState(false)
  const [statueActive, setStatueActive] = useState(false)
  const [categories, setCategories] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const controlsRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    fetchCategories().then((cats) => {
      if (cancelled) return
      setCategories(cats)
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

  const handleEnterStatue = useCallback(() => {
    document.exitPointerLock()
    setStatueActive(true)
  }, [])

  const busy = transitioning || !!entered || statueActive

  return (
    <div className="app-root">
      <Canvas
        shadows
        camera={{ fov: 70, near: 0.1, far: 100 }}
        gl={{ antialias: true, toneMappingExposure: 1.4 }}
      >
        <color attach="background" args={['#08080a']} />
        <fog attach="fog" args={['#08080a', 15, 32]} />
        <Suspense fallback={null}>
          <Room />
          <CategoryFrames categories={categories} />
          <StandingMarkers categories={categories} />
          <StatueZone onEnter={handleEnterStatue} disabled={busy} />
        </Suspense>
        <PlayerControls ref={controlsRef} />
        <HallInteractions categories={categories} onEnter={handleEnter} disabled={busy} />
        <StatueOrbit
          active={statueActive}
          target={STATUE_TARGET}
          minRadius={STATUE_MIN_RADIUS}
          maxRadius={STATUE_MAX_RADIUS}
          controlsRef={controlsRef}
          onExit={() => setStatueActive(false)}
        />
      </Canvas>

      {loadingCategories && (
        <div className="overlay loader">
          <p className="loader-text">Entering the hall…</p>
        </div>
      )}

      {!loadingCategories && !locked && !entered && !statueActive && (
        <div className="overlay hint">
          <p>Click anywhere to step inside</p>
          <p className="hint-sub">
            WASD to walk &middot; mouse to look around &middot; stand on a glowing marker and click to enter a room &middot; Esc to step back
          </p>
        </div>
      )}

      {entered && <CategoryViewer category={entered} onClose={() => setEntered(null)} />}
      {statueActive && <StatueOverlay onClose={() => setStatueActive(false)} />}
    </div>
  )
}
