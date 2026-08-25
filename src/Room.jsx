import { useRef, useEffect, useMemo } from 'react'
import TerminusPiece from './TerminusPiece'
import { HALLWAY_WIDTH, ENTRANCE_MARGIN, SEGMENT_DEPTH } from './layout'

const HEIGHT = 5
const WALL_COLOR = '#191a1f'
const CEIL_COLOR = '#15161a'
const STONE_COLOR = '#232429'
const SAFFRON = '#e0972f'
const MAROON = '#7d2130'
const HALF_W = HALLWAY_WIDTH / 2

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
        decay={1.6}
      />
      <object3D ref={target} position={targetPosition} />
    </>
  )
}

// Evenly spaced z positions bracketing each frame pair — used to place
// pilasters, ceiling beams and the base wash consistently regardless of
// hallway length.
function useBayPositions(totalLength) {
  return useMemo(() => {
    const bays = Math.max(1, Math.round((totalLength - ENTRANCE_MARGIN) / SEGMENT_DEPTH))
    return Array.from({ length: bays + 1 }, (_, i) => ENTRANCE_MARGIN + i * SEGMENT_DEPTH)
  }, [totalLength])
}

// Engaged half-columns flush against the two side walls, one pair per bay
// boundary — architectural rhythm that scales with the hallway.
function Pilasters({ totalLength }) {
  const zPositions = useBayPositions(totalLength)

  return (
    <>
      {zPositions.map((z, i) => (
        <group key={i}>
          {[-1, 1].map((side) => (
            <group key={side} position={[side * (HALF_W - 0.55), 0, z]} rotation={[0, Math.PI / 2, 0]}>
              <mesh position={[0, HEIGHT / 2, 0]}>
                <cylinderGeometry args={[0.3, 0.34, HEIGHT, 12, 1, true]} />
                <meshStandardMaterial color={STONE_COLOR} roughness={0.75} side={2} />
              </mesh>
              <mesh position={[0, 0.12, 0]}>
                <cylinderGeometry args={[0.4, 0.4, 0.24, 12]} />
                <meshStandardMaterial color={STONE_COLOR} roughness={0.7} />
              </mesh>
              <mesh position={[0, HEIGHT - 0.14, 0]}>
                <cylinderGeometry args={[0.4, 0.4, 0.28, 12]} />
                <meshStandardMaterial color={STONE_COLOR} roughness={0.6} metalness={0.1} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </>
  )
}

// Cornice trim along the tops of both side walls, plus ceiling beams at each
// bay boundary with a slim saffron accent groove underneath.
function CeilingDetail({ totalLength }) {
  const zPositions = useBayPositions(totalLength)

  return (
    <group>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (HALF_W - 0.1), HEIGHT - 0.12, totalLength / 2]}>
          <boxGeometry args={[0.14, 0.24, totalLength]} />
          <meshStandardMaterial color={CEIL_COLOR} roughness={0.7} metalness={0.15} />
        </mesh>
      ))}

      {zPositions.map((z, i) => (
        <group key={i} position={[0, HEIGHT - 0.06, z]}>
          <mesh>
            <boxGeometry args={[HALLWAY_WIDTH, 0.3, 0.5]} />
            <meshStandardMaterial color="#101114" roughness={0.85} />
          </mesh>
          <mesh position={[0, -0.16, 0]}>
            <boxGeometry args={[HALLWAY_WIDTH - 0.6, 0.03, 0.08]} />
            <meshStandardMaterial color={SAFFRON} emissive={SAFFRON} emissiveIntensity={0.4} roughness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// Entrance header — a lit lintel marking the threshold, since the near end
// of the hallway has no wall (it's the way in).
function EntranceHeader() {
  return (
    <group position={[0, HEIGHT - 0.3, 0.15]}>
      <mesh>
        <boxGeometry args={[HALLWAY_WIDTH, 0.5, 0.3]} />
        <meshStandardMaterial color={CEIL_COLOR} roughness={0.7} metalness={0.2} />
      </mesh>
      <mesh position={[0, -0.28, 0.05]}>
        <boxGeometry args={[HALLWAY_WIDTH - 0.5, 0.03, 0.06]} />
        <meshStandardMaterial color={SAFFRON} emissive={SAFFRON} emissiveIntensity={0.5} roughness={0.3} />
      </mesh>
    </group>
  )
}

// Low, dim maroon wash along the base of the side walls — a secondary
// accent underneath the primary saffron key lights, kept subtle on purpose.
function BaseWash({ totalLength }) {
  const zPositions = useBayPositions(totalLength)
  return (
    <>
      {zPositions.map((z, i) =>
        [-1, 1].map((side) => (
          <pointLight
            key={`${i}-${side}`}
            position={[side * (HALF_W - 0.3), 0.25, z]}
            color={MAROON}
            intensity={1.1}
            distance={4}
            decay={2.2}
          />
        ))
      )}
    </>
  )
}

// One spotlight per actual frame, aimed at that frame specifically —
// derived from the same laid-out category data the frames themselves use,
// so lighting always matches placement regardless of hallway length.
function FrameSpotlights({ frames }) {
  return (
    <>
      {frames.map((cat) => {
        const [px, py, pz] = cat.position
        const ry = cat.rotation[1]
        // Pull the light toward the hallway's interior. NOTE: this is the
        // opposite sign from standingSpotFor's "forward" (which points INTO
        // the wall, away from the room) — reusing that sign here by mistake
        // once pushed the spotlight clean through the wall and outside the
        // building, leaving the frame it was meant to light almost dark.
        const inX = Math.sin(ry)
        const inZ = Math.cos(ry)
        const inwardOffset = 2.4
        return (
          <SpotWithTarget
            key={cat.id}
            position={[px + inX * inwardOffset, HEIGHT - 0.5, pz + inZ * inwardOffset]}
            targetPosition={[px, py + 0.1, pz]}
            color={SAFFRON}
            intensity={110}
            angle={0.42}
            penumbra={0.55}
            distance={8}
          />
        )
      })}
    </>
  )
}

export default function Room({ frames, totalLength }) {
  const midZ = totalLength / 2

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, midZ]} receiveShadow>
        <planeGeometry args={[HALLWAY_WIDTH, totalLength]} />
        <meshStandardMaterial color="#1c1d22" roughness={0.7} metalness={0.15} />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, HEIGHT, midZ]}>
        <planeGeometry args={[HALLWAY_WIDTH, totalLength]} />
        <meshStandardMaterial color={CEIL_COLOR} roughness={0.9} />
      </mesh>
      <CeilingDetail totalLength={totalLength} />
      <EntranceHeader />

      {/* Side walls */}
      <mesh position={[-HALF_W, HEIGHT / 2, midZ]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[totalLength, HEIGHT]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.8} />
      </mesh>
      <mesh position={[HALF_W, HEIGHT / 2, midZ]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[totalLength, HEIGHT]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.8} />
      </mesh>

      {/* Far end wall, backdrop for the terminus piece */}
      <mesh position={[0, HEIGHT / 2, totalLength]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[HALLWAY_WIDTH, HEIGHT]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.8} />
      </mesh>

      <Pilasters totalLength={totalLength} />

      <TerminusPiece position={[0, 0, totalLength - 0.7]} />

      <FrameSpotlights frames={frames} />

      <BaseWash totalLength={totalLength} />

      {/* Gentle light near the entrance so the threshold isn't pitch black
          before the first frame's spotlight picks up. */}
      <pointLight position={[0, 3, 1]} color={SAFFRON} intensity={12} distance={6} decay={2} />

      {/* Soft overall fill so the architecture reads even away from spotlights —
          kept cool and dim so it reads as shadow, not a second light source,
          giving the warm spotlights something dark to contrast against. */}
      <hemisphereLight args={['#3a3f52', '#08080a', 0.35]} />
      <ambientLight intensity={0.16} color="#2a2c3a" />
    </group>
  )
}
