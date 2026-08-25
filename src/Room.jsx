import { useRef, useEffect, useMemo } from 'react'
import Statue from './Statue'

const HALF = 10
const HEIGHT = 5
const WALL_COLOR = '#191a1f'
const CEIL_COLOR = '#15161a'
const STONE_COLOR = '#232429'
const SAFFRON = '#e0972f'
const MAROON = '#7d2130'

function SpotWithTarget({ position, targetPosition, color, intensity, angle, penumbra, distance }) {
  const light = useRef(null)
  const target = useRef(null)

  useEffect(() => {
    if (light.current && target.current) {
      light.current.target = target.current
    }
  }, [])

  return (
    <>
      <spotLight
        ref={light}
        position={position}
        color={color}
        intensity={intensity}
        angle={angle}
        penumbra={penumbra}
        distance={distance}
        decay={1.4}
      />
      <object3D ref={target} position={targetPosition} />
    </>
  )
}

// Engaged half-columns (pilasters) flush against the walls — restrained
// architectural rhythm rather than free-standing obstacles in the walkway.
function Pilasters() {
  const positions = useMemo(() => {
    const spread = HALF - 3.2
    const inset = HALF - 0.55
    const list = []
    for (const side of [-1, 1]) {
      for (const offset of [-spread, spread]) {
        list.push({ x: offset, z: side * inset, rot: 0 }) // north/south walls
        list.push({ x: side * inset, z: offset, rot: Math.PI / 2 }) // east/west walls
      }
    }
    return list
  }, [])

  return (
    <>
      {positions.map((p, i) => (
        <group key={i} position={[p.x, 0, p.z]} rotation={[0, p.rot, 0]}>
          <mesh position={[0, HEIGHT / 2, 0]}>
            <cylinderGeometry args={[0.32, 0.36, HEIGHT, 12, 1, true]} />
            <meshStandardMaterial color={STONE_COLOR} roughness={0.75} side={2} />
          </mesh>
          {/* base */}
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.42, 0.42, 0.24, 12]} />
            <meshStandardMaterial color={STONE_COLOR} roughness={0.7} />
          </mesh>
          {/* capital */}
          <mesh position={[0, HEIGHT - 0.14, 0]}>
            <cylinderGeometry args={[0.42, 0.42, 0.28, 12]} />
            <meshStandardMaterial color={STONE_COLOR} roughness={0.6} metalness={0.1} />
          </mesh>
        </group>
      ))}
    </>
  )
}

// Cornice trim at the wall/ceiling junction, plus a few ceiling beams with a
// thin carved-accent inlay on their underside — the one place the Bhutanese
// motif shows up structurally rather than as applied decoration.
function CeilingDetail() {
  const beamCount = 3
  const beamPositions = useMemo(() => {
    const step = (HALF * 2 - 4) / (beamCount + 1)
    return Array.from({ length: beamCount }, (_, i) => -HALF + 2 + step * (i + 1))
  }, [])

  return (
    <group>
      {/* Cornice ring around the top of the walls */}
      {[-HALF + 0.15, HALF - 0.15].map((z, i) => (
        <mesh key={`nc-${i}`} position={[0, HEIGHT - 0.12, z]}>
          <boxGeometry args={[HALF * 2, 0.24, 0.14]} />
          <meshStandardMaterial color={CEIL_COLOR} roughness={0.7} metalness={0.15} />
        </mesh>
      ))}
      {[-HALF + 0.15, HALF - 0.15].map((x, i) => (
        <mesh key={`ec-${i}`} position={[x, HEIGHT - 0.12, 0]}>
          <boxGeometry args={[0.14, 0.24, HALF * 2]} />
          <meshStandardMaterial color={CEIL_COLOR} roughness={0.7} metalness={0.15} />
        </mesh>
      ))}

      {/* Ceiling beams, each with a slim saffron accent groove underneath */}
      {beamPositions.map((z, i) => (
        <group key={i} position={[0, HEIGHT - 0.06, z]}>
          <mesh>
            <boxGeometry args={[HALF * 2, 0.3, 0.5]} />
            <meshStandardMaterial color="#101114" roughness={0.85} />
          </mesh>
          <mesh position={[0, -0.16, 0]}>
            <boxGeometry args={[HALF * 2 - 0.6, 0.03, 0.08]} />
            <meshStandardMaterial
              color={SAFFRON}
              emissive={SAFFRON}
              emissiveIntensity={0.4}
              roughness={0.4}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// Warm inlay ring set into the floor around the statue plinth.
function FloorInlay() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
      <ringGeometry args={[1.9, 2.05, 48]} />
      <meshStandardMaterial
        color={SAFFRON}
        emissive={SAFFRON}
        emissiveIntensity={0.25}
        roughness={0.5}
      />
    </mesh>
  )
}

// Low, dim maroon wash along the base of the walls — a secondary accent
// underneath the primary saffron key lights, kept subtle on purpose.
function BaseWash() {
  const spots = [
    [0, -HALF + 0.4],
    [0, HALF - 0.4],
    [-HALF + 0.4, 0],
    [HALF - 0.4, 0],
  ]
  return (
    <>
      {spots.map(([x, z], i) => (
        <pointLight key={i} position={[x, 0.3, z]} color={MAROON} intensity={6} distance={6} decay={2} />
      ))}
    </>
  )
}

export default function Room() {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[HALF * 2, HALF * 2]} />
        <meshStandardMaterial color="#1c1d22" roughness={0.7} metalness={0.15} />
      </mesh>
      <FloorInlay />

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, HEIGHT, 0]}>
        <planeGeometry args={[HALF * 2, HALF * 2]} />
        <meshStandardMaterial color={CEIL_COLOR} roughness={0.9} />
      </mesh>
      <CeilingDetail />

      {/* Walls */}
      <mesh position={[0, HEIGHT / 2, -HALF]}>
        <planeGeometry args={[HALF * 2, HEIGHT]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.8} />
      </mesh>
      <mesh position={[0, HEIGHT / 2, HALF]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[HALF * 2, HEIGHT]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.8} />
      </mesh>
      <mesh position={[-HALF, HEIGHT / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[HALF * 2, HEIGHT]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.8} />
      </mesh>
      <mesh position={[HALF, HEIGHT / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[HALF * 2, HEIGHT]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.8} />
      </mesh>

      <Pilasters />

      {/* Center plinth, elevating the statue */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[1.4, 1.6, 1, 24]} />
        <meshStandardMaterial color="#26272d" roughness={0.6} metalness={0.1} />
      </mesh>

      <group position={[0, 1.0, 0]}>
        <Statue />
      </group>

      {/* Statue uplight (subtle accent, not the main light source) */}
      <pointLight position={[0, 1.2, 0]} color={MAROON} intensity={8} distance={4.5} decay={2} />
      <SpotWithTarget
        position={[0, HEIGHT - 0.3, 0]}
        targetPosition={[0, 1.55, 0]}
        color={SAFFRON}
        intensity={220}
        angle={0.5}
        penumbra={0.6}
        distance={12}
      />

      {/* Wall spotlights (placeholder frame positions) */}
      {[
        [0, -HALF + 0.1],
        [0, HALF - 0.1],
        [-HALF + 0.1, 0],
        [HALF - 0.1, 0],
      ].map(([x, z], i) => (
        <SpotWithTarget
          key={i}
          position={[x * 0.55, HEIGHT - 0.5, z * 0.55]}
          targetPosition={[x, 2, z]}
          color={SAFFRON}
          intensity={260}
          angle={0.6}
          penumbra={0.5}
          distance={11}
        />
      ))}

      <BaseWash />

      {/* Soft overall fill so the architecture reads even away from spotlights */}
      <hemisphereLight args={['#5a5578', '#0c0c10', 0.75]} />
      <ambientLight intensity={0.45} color="#443f60" />
    </group>
  )
}
